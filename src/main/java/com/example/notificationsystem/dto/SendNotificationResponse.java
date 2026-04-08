package com.example.notificationsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SendNotificationResponse {

    private String status;
    private String notificationId;
}
