package com.example.notificationsystem.service;

import com.example.notificationsystem.dto.AdminNotificationResponse;
import com.example.notificationsystem.dto.NotificationStatusResponse;
import com.example.notificationsystem.entity.Notification;
import com.example.notificationsystem.exception.NotificationNotFoundException;
import com.example.notificationsystem.model.NotificationStatus;
import com.example.notificationsystem.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationQueryService {

    private final NotificationRepository notificationRepository;

    public NotificationQueryService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public NotificationStatusResponse getStatus(String notificationId) {
        Notification notification = getNotificationOrThrow(notificationId);
        return new NotificationStatusResponse(
                notification.getId(),
                notification.getUserId(),
                notification.getChannel(),
                notification.getStatus(),
                notification.getRetryCount(),
                notification.getFailureReason(),
                notification.getCreatedAt(),
                notification.getUpdatedAt(),
                notification.getIdempotencyKey()
        );
    }

    @Transactional(readOnly = true)
    public List<AdminNotificationResponse> getNotificationsForAdmin(NotificationStatus status) {
        List<Notification> notifications = status == null
                ? notificationRepository.findAll()
                : notificationRepository.findByStatusOrderByCreatedAtDesc(status);
        return notifications.stream()
                .map(notification -> new AdminNotificationResponse(
                        notification.getId(),
                        notification.getUserId(),
                        notification.getChannel(),
                        notification.getTemplateId(),
                        notification.getStatus(),
                        notification.getRetryCount(),
                        notification.getFailureReason(),
                        notification.getCreatedAt(),
                        notification.getUpdatedAt(),
                        notification.getIdempotencyKey()
                ))
                .toList();
    }

    private Notification getNotificationOrThrow(String notificationId) {
        return notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotificationNotFoundException(notificationId));
    }
}
