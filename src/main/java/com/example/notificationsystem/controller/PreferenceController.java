package com.example.notificationsystem.controller;

import com.example.notificationsystem.dto.UserPreferenceRequest;
import com.example.notificationsystem.dto.UserPreferenceResponse;
import com.example.notificationsystem.service.NotificationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/preferences")
public class PreferenceController {

    private final NotificationService notificationService;

    public PreferenceController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PutMapping("/{userId}")
    public UserPreferenceResponse upsert(
            @PathVariable String userId,
            @RequestBody UserPreferenceRequest request
    ) {
        return notificationService.upsertPreferences(userId, request);
    }

    @GetMapping("/{userId}")
    public UserPreferenceResponse get(@PathVariable String userId) {
        return notificationService.getPreferences(userId);
    }
}
