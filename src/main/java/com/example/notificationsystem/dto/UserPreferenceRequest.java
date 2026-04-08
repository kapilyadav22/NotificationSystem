package com.example.notificationsystem.dto;

import lombok.Data;

@Data
public class UserPreferenceRequest {

    private boolean emailEnabled;
    private boolean smsEnabled;
    private boolean pushEnabled;
}
