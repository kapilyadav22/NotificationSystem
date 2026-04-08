package com.example.notificationsystem.exception;

public class UserPreferenceNotFoundException extends RuntimeException {

    public UserPreferenceNotFoundException(String userId) {
        super("User preferences not found for userId " + userId);
    }
}
