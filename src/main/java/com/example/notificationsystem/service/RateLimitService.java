package com.example.notificationsystem.service;

import com.example.notificationsystem.exception.RateLimitExceededException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

@Service
public class RateLimitService {

    private static final Logger log = LoggerFactory.getLogger(RateLimitService.class);
    private static final String RATE_KEY_PREFIX = "rate_limit:";

    private final StringRedisTemplate redisTemplate;
    private final long rateLimitPerMinute;

    public RateLimitService(
            StringRedisTemplate redisTemplate,
            @Value("${app.rate-limit.max-per-minute:5}") long rateLimitPerMinute
    ) {
        this.redisTemplate = redisTemplate;
        this.rateLimitPerMinute = rateLimitPerMinute;
    }

    public void enforceRateLimit(String userId) {
        String key = rateLimitKey(userId);
        try {
            Long count = redisTemplate.opsForValue().increment(key);
            if (count != null && count == 1L) {
                redisTemplate.expire(key, Duration.ofSeconds(70));
            }
            if (count != null && count > rateLimitPerMinute) {
                throw new RateLimitExceededException(userId, rateLimitPerMinute);
            }
        } catch (RateLimitExceededException ex) {
            throw ex;
        } catch (Exception ex) {
            // Fail-open for Redis outage to keep API available.
            log.warn("Rate limit check skipped due to Redis issue. userId={}", userId, ex);
        }
    }

    private String rateLimitKey(String userId) {
        long epochMinute = Instant.now().atZone(ZoneOffset.UTC).toEpochSecond() / 60;
        return RATE_KEY_PREFIX + userId + ":" + epochMinute;
    }
}
