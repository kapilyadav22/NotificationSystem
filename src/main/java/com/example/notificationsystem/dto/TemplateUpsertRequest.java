package com.example.notificationsystem.dto;

import com.example.notificationsystem.model.Channel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TemplateUpsertRequest {

    @NotBlank
    @Size(max = 100)
    private String templateId;

    @NotNull
    private Channel channel;

    @NotBlank
    @Size(max = 4000)
    private String content;
}
