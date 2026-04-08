package com.example.notificationsystem.exception;

public class InvalidRetryStateException extends RuntimeException {

    public InvalidRetryStateException(String notificationId, String status) {
        super("Notification " + notificationId + " cannot be retried from status " + status);
    }
}
