package com.example.notificationsystem.service;

import com.example.notificationsystem.dto.SendNotificationRequest;
import com.example.notificationsystem.exception.InvalidNotificationRequestException;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class NotificationMessageService {

    private static final Pattern TEMPLATE_VARIABLE_PATTERN = Pattern.compile("\\{\\{\\s*([a-zA-Z0-9_]+)\\s*}}");
    private final TemplateService templateService;

    public NotificationMessageService(TemplateService templateService) {
        this.templateService = templateService;
    }

    public String resolveMessage(SendNotificationRequest request) {
        validateNotificationContent(request);
        if (hasText(request.getTemplateId())) {
            String template = templateService.resolveTemplateContent(request.getTemplateId(), request.getChannel());
            return renderTemplate(template, request.getVariables());
        }
        return request.getMessage();
    }

    private String renderTemplate(String template, Map<String, String> variables) {
        Matcher matcher = TEMPLATE_VARIABLE_PATTERN.matcher(template);
        StringBuilder rendered = new StringBuilder();
        while (matcher.find()) {
            String key = matcher.group(1);
            String value = variables == null ? null : variables.get(key);
            if (!hasText(value)) {
                throw new InvalidNotificationRequestException("Missing template variable: " + key);
            }
            matcher.appendReplacement(rendered, Matcher.quoteReplacement(value));
        }
        matcher.appendTail(rendered);
        return rendered.toString();
    }

    private void validateNotificationContent(SendNotificationRequest request) {
        boolean hasTemplate = hasText(request.getTemplateId());
        boolean hasMessage = hasText(request.getMessage());
        if (hasTemplate && hasMessage) {
            throw new InvalidNotificationRequestException("Provide either message or templateId, not both");
        }
        if (!hasTemplate && !hasMessage) {
            throw new InvalidNotificationRequestException("Either message or templateId is required");
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
