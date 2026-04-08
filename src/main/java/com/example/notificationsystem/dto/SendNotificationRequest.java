package com.example.notificationsystem.dto;

import com.example.notificationsystem.model.Channel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Map;

@Data
public class SendNotificationRequest {

    @NotBlank
    @Size(max = 100)
    private String userId;

    @Size(max = 1000)
    private String message;

    @NotNull
    private Channel channel;

    @Size(max = 100)
    private String templateId;

    private Map<String, String> variables;
}
