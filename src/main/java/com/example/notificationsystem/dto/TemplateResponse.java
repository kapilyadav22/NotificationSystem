package com.example.notificationsystem.dto;

import com.example.notificationsystem.model.Channel;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class TemplateResponse {

    private Long id;
    private String templateId;
    private Channel channel;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
