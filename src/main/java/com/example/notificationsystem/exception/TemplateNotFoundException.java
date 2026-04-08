package com.example.notificationsystem.exception;

import com.example.notificationsystem.model.Channel;

public class TemplateNotFoundException extends RuntimeException {

    public TemplateNotFoundException(String templateId, Channel channel) {
        super("Template not found for templateId " + templateId + " and channel " + channel);
    }
}
