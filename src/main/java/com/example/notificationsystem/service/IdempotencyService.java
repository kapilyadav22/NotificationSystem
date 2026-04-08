package com.example.notificationsystem.service;

import com.example.notificationsystem.entity.Notification;
import com.example.notificationsystem.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

@Service
public class IdempotencyService {

    private static final Logger log = LoggerFactory.getLogger(IdempotencyService.class);
    private static final String IDEMPOTENCY_KEY_PREFIX = "idem:";

    private final NotificationRepository notificationRepository;
    private final StringRedisTemplate redisTemplate;
    private final Duration idempotencyCacheTtl;

    public IdempotencyService(
            NotificationRepository notificationRepository,
            StringRedisTemplate redisTemplate,
            @Value("${app.cache.idempotency-ttl-hours:24}") long idempotencyCacheTtlHours
    ) {
        this.notificationRepository = notificationRepository;
        this.redisTemplate = redisTemplate;
        this.idempotencyCacheTtl = Duration.ofHours(idempotencyCacheTtlHours);
    }

    public Optional<String> findNotificationId(String idempotencyKey) {
        if (!hasText(idempotencyKey)) {
            return Optional.empty();
        }

        String cached = readFromCache(idempotencyKey);
        if (hasText(cached)) {
            return Optional.of(cached);
        }

        Optional<Notification> existing = notificationRepository.findByIdempotencyKey(idempotencyKey);
        existing.ifPresent(notification -> cache(idempotencyKey, notification.getId()));
        return existing.map(Notification::getId);
    }

    public void cache(String idempotencyKey, String notificationId) {
        if (!hasText(idempotencyKey) || !hasText(notificationId)) {
            return;
        }
        try {
            redisTemplate.opsForValue().set(idempotencyRedisKey(idempotencyKey), notificationId, idempotencyCacheTtl);
        } catch (Exception ex) {
            log.warn("Idempotency cache write failed. key={}", idempotencyKey, ex);
        }
    }

    private String readFromCache(String idempotencyKey) {
        try {
            return redisTemplate.opsForValue().get(idempotencyRedisKey(idempotencyKey));
        } catch (Exception ex) {
            log.warn("Idempotency cache read failed. key={}", idempotencyKey, ex);
            return null;
        }
    }

    private String idempotencyRedisKey(String idempotencyKey) {
        return IDEMPOTENCY_KEY_PREFIX + idempotencyKey;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
