package com.example.notificationsystem.consumer;

import com.example.notificationsystem.event.NotificationEvent;
import com.example.notificationsystem.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class NotificationConsumer {

    private static final Logger log = LoggerFactory.getLogger(NotificationConsumer.class);

    private final NotificationService notificationService;

    public NotificationConsumer(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @KafkaListener(topics = "${app.kafka.notification-topic:notification-send}")
    public void consumeMain(NotificationEvent event) {
        if (event == null) {
            log.warn("Skipping null message on main topic due to deserialization failure");
            return;
        }
        notificationService.processNotification(event, false);
    }

    @KafkaListener(topics = "${app.kafka.retry-topic:notification-retry}")
    public void consumeRetry(NotificationEvent event) {
        if (event == null) {
            log.warn("Skipping null message on retry topic due to deserialization failure");
            return;
        }
        notificationService.processNotification(event, true);
    }

    @KafkaListener(topics = "${app.kafka.dlq-topic:notification-dlq}")
    public void consumeDlq(NotificationEvent event) {
        if (event == null) {
            log.warn("Skipping null message on DLQ topic due to deserialization failure");
            return;
        }
        log.warn("DLQ message received. notificationId={}, userId={}", event.getNotificationId(), event.getUserId());
    }
}
