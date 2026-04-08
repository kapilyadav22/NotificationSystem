package com.example.notificationsystem.service;

import com.example.notificationsystem.channel.NotificationSender;
import com.example.notificationsystem.channel.NotificationSenderFactory;
import com.example.notificationsystem.dto.SendNotificationRequest;
import com.example.notificationsystem.dto.SendNotificationResponse;
import com.example.notificationsystem.entity.Notification;
import com.example.notificationsystem.event.NotificationEvent;
import com.example.notificationsystem.exception.InvalidRetryStateException;
import com.example.notificationsystem.exception.NotificationNotFoundException;
import com.example.notificationsystem.model.NotificationStatus;
import com.example.notificationsystem.observability.NotificationMetrics;
import com.example.notificationsystem.producer.NotificationEventProducer;
import com.example.notificationsystem.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

@Service
public class NotificationCommandService {

    private static final Logger log = LoggerFactory.getLogger(NotificationCommandService.class);
    private static final String PENDING_DEMO_TOKEN = "PENDING_DEMO";
    private static final String FAILED_DEMO_TOKEN = "FAILED_DEMO";
    private static final String DLQ_DEMO_TOKEN = "DLQ_DEMO";
    private static final String LEGACY_FAIL_DEMO_TOKEN = "FAIL_DEMO";
    private static final String FAIL_EMAIL_TOKEN = "FAIL_EMAIL";
    private static final String FAIL_SMS_TOKEN = "FAIL_SMS";
    private static final String FAIL_PUSH_TOKEN = "FAIL_PUSH";

    private final NotificationRepository notificationRepository;
    private final NotificationEventProducer eventProducer;
    private final NotificationSenderFactory notificationSenderFactory;
    private final NotificationPreferenceService preferenceService;
    private final NotificationMessageService messageService;
    private final IdempotencyService idempotencyService;
    private final RateLimitService rateLimitService;
    private final NotificationMetrics notificationMetrics;
    private final int maxRetryAttempts;

    public NotificationCommandService(
            NotificationRepository notificationRepository,
            NotificationEventProducer eventProducer,
            NotificationSenderFactory notificationSenderFactory,
            NotificationPreferenceService preferenceService,
            NotificationMessageService messageService,
            IdempotencyService idempotencyService,
            RateLimitService rateLimitService,
            NotificationMetrics notificationMetrics,
            @Value("${app.retry.max-attempts:3}") int maxRetryAttempts
    ) {
        this.notificationRepository = notificationRepository;
        this.eventProducer = eventProducer;
        this.notificationSenderFactory = notificationSenderFactory;
        this.preferenceService = preferenceService;
        this.messageService = messageService;
        this.idempotencyService = idempotencyService;
        this.rateLimitService = rateLimitService;
        this.notificationMetrics = notificationMetrics;
        this.maxRetryAttempts = maxRetryAttempts;
    }

    @Transactional
    public SendNotificationResponse createNotification(SendNotificationRequest request, String idempotencyKey) {
        rateLimitService.enforceRateLimit(request.getUserId());

        Optional<String> existingId = idempotencyService.findNotificationId(idempotencyKey);
        if (existingId.isPresent()) {
            return new SendNotificationResponse("ACCEPTED", existingId.get());
        }

        Notification notification = new Notification();
        notification.setId(UUID.randomUUID().toString());
        notification.setUserId(request.getUserId());
        notification.setTemplateId(hasText(request.getTemplateId()) ? request.getTemplateId() : null);
        notification.setMessage(messageService.resolveMessage(request));
        notification.setChannel(request.getChannel());
        notification.setStatus(NotificationStatus.PENDING);
        notification.setRetryCount(0);
        notification.setIdempotencyKey(hasText(idempotencyKey) ? idempotencyKey : null);

        try {
            notificationRepository.save(notification);
        } catch (DataIntegrityViolationException ex) {
            if (hasText(idempotencyKey)) {
                Notification existing = notificationRepository.findByIdempotencyKey(idempotencyKey).orElseThrow(() -> ex);
                idempotencyService.cache(idempotencyKey, existing.getId());
                return new SendNotificationResponse("ACCEPTED", existing.getId());
            }
            throw ex;
        }

        idempotencyService.cache(idempotencyKey, notification.getId());
        eventProducer.publishMain(notification);
        notificationMetrics.incrementAccepted(notification.getChannel());
        return new SendNotificationResponse("ACCEPTED", notification.getId());
    }

    @Transactional
    public void processNotification(NotificationEvent event, boolean fromRetryTopic) {
        long startedAt = System.nanoTime();
        Notification notification = notificationRepository.findById(event.getNotificationId()).orElse(null);
        if (notification == null) {
            log.warn("Skipping unknown notification. notificationId={}", event.getNotificationId());
            return;
        }
        if (notification.getStatus() == NotificationStatus.SENT) {
            return;
        }
        if (shouldKeepPendingForDemo(notification)) {
            log.info(
                    "Pending demo active. Keeping notification in PENDING state. notificationId={}, source={}",
                    notification.getId(),
                    fromRetryTopic ? "RETRY_TOPIC" : "MAIN_TOPIC"
            );
            notification.setStatus(NotificationStatus.PENDING);
            notification.setFailureReason("Held in PENDING for demo (remove PENDING_DEMO token to process normally)");
            notificationRepository.save(notification);
            return;
        }

        notification.setStatus(NotificationStatus.PROCESSING);
        notificationRepository.save(notification);

        try {
            if (!preferenceService.isChannelEnabled(notification.getUserId(), notification.getChannel())) {
                notification.setStatus(NotificationStatus.FAILED);
                notification.setFailureReason("Channel disabled by user preference");
                notificationRepository.save(notification);
                notificationMetrics.incrementFailed(notification.getChannel());
                notificationMetrics.recordDeliveryLatency(
                        notification.getChannel(),
                        Duration.ofNanos(System.nanoTime() - startedAt)
                );
                return;
            }

            if (shouldForceFailed(notification)) {
                handleForcedFailed(notification, fromRetryTopic, startedAt);
                return;
            }

            String simulatedFailureMessage = getSimulatedFailureMessage(notification);
            if (simulatedFailureMessage != null) {
                throw new IllegalStateException(simulatedFailureMessage);
            }

            NotificationSender sender = notificationSenderFactory.getSender(notification.getChannel());
            sender.send(notification);
            notification.setStatus(NotificationStatus.SENT);
            notification.setFailureReason(null);
            notificationRepository.save(notification);
            notificationMetrics.incrementSent(notification.getChannel());
            notificationMetrics.recordDeliveryLatency(
                    notification.getChannel(),
                    Duration.ofNanos(System.nanoTime() - startedAt)
            );
        } catch (Exception ex) {
            handleDeliveryFailure(notification, ex, fromRetryTopic, startedAt);
        }
    }

    @Transactional
    public SendNotificationResponse manualRetry(String notificationId) {
        Notification notification = getNotificationOrThrow(notificationId);
        if (notification.getStatus() != NotificationStatus.FAILED && notification.getStatus() != NotificationStatus.DLQ) {
            throw new InvalidRetryStateException(notificationId, notification.getStatus().name());
        }
        notification.setStatus(NotificationStatus.PENDING);
        notification.setFailureReason(null);
        notificationRepository.save(notification);
        eventProducer.publishMain(notification);
        return new SendNotificationResponse("ACCEPTED", notification.getId());
    }

    private void handleDeliveryFailure(Notification notification, Exception ex, boolean fromRetryTopic, long startedAt) {
        int nextAttempt = notification.getRetryCount() + 1;
        notification.setRetryCount(nextAttempt);
        notification.setFailureReason(trimFailure(ex.getMessage()));

        if (nextAttempt <= maxRetryAttempts) {
            notification.setStatus(NotificationStatus.RETRIED);
            notificationRepository.save(notification);
            eventProducer.publishRetry(notification);
            notificationMetrics.incrementRetried(notification.getChannel());
            notificationMetrics.incrementFailed(notification.getChannel());
            notificationMetrics.recordDeliveryLatency(
                    notification.getChannel(),
                    Duration.ofNanos(System.nanoTime() - startedAt)
            );
            log.error(
                    "Notification delivery failed. notificationId={}, attempt={}, source={}",
                    notification.getId(),
                    nextAttempt,
                    fromRetryTopic ? "RETRY_TOPIC" : "MAIN_TOPIC",
                    ex
            );
            return;
        }

        notification.setStatus(NotificationStatus.DLQ);
        notificationRepository.save(notification);
        eventProducer.publishDlq(notification);
        notificationMetrics.incrementDlq(notification.getChannel());
        notificationMetrics.incrementFailed(notification.getChannel());
        notificationMetrics.recordDeliveryLatency(
                notification.getChannel(),
                Duration.ofNanos(System.nanoTime() - startedAt)
        );
        log.error(
                "Notification moved to DLQ. notificationId={}, attempts={}",
                notification.getId(),
                notification.getRetryCount(),
                ex
        );
    }

    private Notification getNotificationOrThrow(String notificationId) {
        return notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotificationNotFoundException(notificationId));
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String trimFailure(String value) {
        if (value == null) {
            return "Unknown failure";
        }
        return value.length() > 500 ? value.substring(0, 500) : value;
    }

    private boolean shouldKeepPendingForDemo(Notification notification) {
        String message = notification.getMessage();
        return message != null && message.contains(PENDING_DEMO_TOKEN);
    }

    private boolean shouldForceFailed(Notification notification) {
        String message = notification.getMessage();
        return message != null && message.contains(FAILED_DEMO_TOKEN);
    }

    private String getSimulatedFailureMessage(Notification notification) {
        String message = notification.getMessage();
        if (message == null) {
            return null;
        }
        if (message.contains(DLQ_DEMO_TOKEN)) {
            return "Simulated failure for DLQ demo (DLQ_DEMO token)";
        }
        if (message.contains(LEGACY_FAIL_DEMO_TOKEN)) {
            return "Simulated failure for DLQ demo (legacy FAIL_DEMO token)";
        }
        return switch (notification.getChannel()) {
            case EMAIL -> message.contains(FAIL_EMAIL_TOKEN) ? "Simulated email provider failure" : null;
            case SMS -> message.contains(FAIL_SMS_TOKEN) ? "Simulated SMS provider failure" : null;
            case PUSH -> message.contains(FAIL_PUSH_TOKEN) ? "Simulated push provider failure" : null;
        };
    }

    private void handleForcedFailed(Notification notification, boolean fromRetryTopic, long startedAt) {
        int nextAttempt = notification.getRetryCount() + 1;
        notification.setRetryCount(nextAttempt);
        if (nextAttempt > maxRetryAttempts) {
            notification.setStatus(NotificationStatus.DLQ);
            notification.setFailureReason("FAILED_DEMO reached retry limit and moved to DLQ");
            notificationRepository.save(notification);
            eventProducer.publishDlq(notification);
            notificationMetrics.incrementDlq(notification.getChannel());
            notificationMetrics.incrementFailed(notification.getChannel());
            notificationMetrics.recordDeliveryLatency(
                    notification.getChannel(),
                    Duration.ofNanos(System.nanoTime() - startedAt)
            );
            log.warn(
                    "FAILED_DEMO moved to DLQ at retry limit. notificationId={}, attempt={}, source={}",
                    notification.getId(),
                    nextAttempt,
                    fromRetryTopic ? "RETRY_TOPIC" : "MAIN_TOPIC"
            );
            return;
        }

        notification.setStatus(NotificationStatus.FAILED);
        notification.setFailureReason("Forced FAILED for demo (FAILED_DEMO token)");
        notificationRepository.save(notification);
        notificationMetrics.incrementFailed(notification.getChannel());
        notificationMetrics.recordDeliveryLatency(
                notification.getChannel(),
                Duration.ofNanos(System.nanoTime() - startedAt)
        );
        log.warn(
                "Forced FAILED demo applied. notificationId={}, attempt={}, source={}",
                notification.getId(),
                nextAttempt,
                fromRetryTopic ? "RETRY_TOPIC" : "MAIN_TOPIC"
        );
    }
}
