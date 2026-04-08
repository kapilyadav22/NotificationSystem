package com.example.notificationsystem.dto;

import com.example.notificationsystem.model.Channel;
import com.example.notificationsystem.model.NotificationStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class AdminNotificationResponse {

    private String notificationId;
    private String userId;
    private Channel channel;
    private String templateId;
    private NotificationStatus status;
    private int retryCount;
    private String failureReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String idempotencyKey;
}
