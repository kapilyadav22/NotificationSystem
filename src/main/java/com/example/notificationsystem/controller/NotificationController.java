package com.example.notificationsystem.controller;

import com.example.notificationsystem.dto.NotificationStatusResponse;
import com.example.notificationsystem.dto.SendNotificationRequest;
import com.example.notificationsystem.dto.SendNotificationResponse;
import com.example.notificationsystem.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping
    public ResponseEntity<SendNotificationResponse> send(
            @Valid @RequestBody SendNotificationRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        SendNotificationResponse response = notificationService.createNotification(request, idempotencyKey);
        return ResponseEntity.accepted().body(response);
    }

    @GetMapping("/{notificationId}")
    public NotificationStatusResponse getStatus(@PathVariable String notificationId) {
        return notificationService.getStatus(notificationId);
    }
}
