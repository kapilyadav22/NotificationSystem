package com.example.notificationsystem.controller;

import com.example.notificationsystem.dto.AdminNotificationResponse;
import com.example.notificationsystem.dto.SendNotificationResponse;
import com.example.notificationsystem.model.NotificationStatus;
import com.example.notificationsystem.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin/notifications")
public class AdminController {

    private final NotificationService notificationService;

    public AdminController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<AdminNotificationResponse> list(
            @RequestParam(value = "status", required = false) NotificationStatus status
    ) {
        return notificationService.getNotificationsForAdmin(status);
    }

    @PostMapping("/{notificationId}/retry")
    public ResponseEntity<SendNotificationResponse> retry(@PathVariable String notificationId) {
        return ResponseEntity.accepted().body(notificationService.manualRetry(notificationId));
    }
}
