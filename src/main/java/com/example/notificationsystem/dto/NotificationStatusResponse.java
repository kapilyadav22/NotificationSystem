package com.example.notificationsystem.dto;

import com.example.notificationsystem.model.Channel;
import com.example.notificationsystem.model.NotificationStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class NotificationStatusResponse {

    private String notificationId;
    private String userId;
    private Channel channel;
    private NotificationStatus status;
    private int retryCount;
    private String failureReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String idempotencyKey;
}
