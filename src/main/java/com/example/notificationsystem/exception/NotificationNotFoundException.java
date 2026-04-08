package com.example.notificationsystem.exception;

public class NotificationNotFoundException extends RuntimeException {

    public NotificationNotFoundException(String notificationId) {
        super("Notification not found for id " + notificationId);
    }
}
