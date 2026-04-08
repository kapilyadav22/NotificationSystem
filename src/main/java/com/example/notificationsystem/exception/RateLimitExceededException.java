package com.example.notificationsystem.exception;

public class RateLimitExceededException extends RuntimeException {

    public RateLimitExceededException(String userId, long limitPerMinute) {
        super("Rate limit exceeded for userId " + userId + ". Max " + limitPerMinute + " notifications per minute.");
    }
}
