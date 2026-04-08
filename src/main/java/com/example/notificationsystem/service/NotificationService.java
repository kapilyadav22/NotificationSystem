package com.example.notificationsystem.service;

import com.example.notificationsystem.dto.AdminNotificationResponse;
import com.example.notificationsystem.dto.NotificationStatusResponse;
import com.example.notificationsystem.dto.SendNotificationRequest;
import com.example.notificationsystem.dto.SendNotificationResponse;
import com.example.notificationsystem.dto.UserPreferenceRequest;
import com.example.notificationsystem.dto.UserPreferenceResponse;
import com.example.notificationsystem.event.NotificationEvent;
import com.example.notificationsystem.model.NotificationStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationCommandService commandService;
    private final NotificationQueryService queryService;
    private final NotificationPreferenceService preferenceService;

    public NotificationService(
            NotificationCommandService commandService,
            NotificationQueryService queryService,
            NotificationPreferenceService preferenceService
    ) {
        this.commandService = commandService;
        this.queryService = queryService;
        this.preferenceService = preferenceService;
    }

    public SendNotificationResponse createNotification(SendNotificationRequest request, String idempotencyKey) {
        return commandService.createNotification(request, idempotencyKey);
    }

    public NotificationStatusResponse getStatus(String notificationId) {
        return queryService.getStatus(notificationId);
    }

    public void processNotification(NotificationEvent event, boolean fromRetryTopic) {
        commandService.processNotification(event, fromRetryTopic);
    }

    public UserPreferenceResponse upsertPreferences(String userId, UserPreferenceRequest request) {
        return preferenceService.upsertPreferences(userId, request);
    }

    public UserPreferenceResponse getPreferences(String userId) {
        return preferenceService.getPreferences(userId);
    }

    public List<AdminNotificationResponse> getNotificationsForAdmin(NotificationStatus status) {
        return queryService.getNotificationsForAdmin(status);
    }

    public SendNotificationResponse manualRetry(String notificationId) {
        return commandService.manualRetry(notificationId);
    }
}
