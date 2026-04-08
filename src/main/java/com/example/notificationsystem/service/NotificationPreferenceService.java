package com.example.notificationsystem.service;

import com.example.notificationsystem.dto.UserPreferenceRequest;
import com.example.notificationsystem.dto.UserPreferenceResponse;
import com.example.notificationsystem.entity.UserPreference;
import com.example.notificationsystem.exception.UserPreferenceNotFoundException;
import com.example.notificationsystem.model.Channel;
import com.example.notificationsystem.repository.UserPreferenceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;

@Service
public class NotificationPreferenceService {

    private static final Logger log = LoggerFactory.getLogger(NotificationPreferenceService.class);
    private static final String PREF_KEY_PREFIX = "pref:";

    private final UserPreferenceRepository userPreferenceRepository;
    private final StringRedisTemplate redisTemplate;
    private final Duration preferenceCacheTtl;

    public NotificationPreferenceService(
            UserPreferenceRepository userPreferenceRepository,
            StringRedisTemplate redisTemplate,
            @Value("${app.cache.preference-ttl-minutes:30}") long preferenceCacheTtlMinutes
    ) {
        this.userPreferenceRepository = userPreferenceRepository;
        this.redisTemplate = redisTemplate;
        this.preferenceCacheTtl = Duration.ofMinutes(preferenceCacheTtlMinutes);
    }

    @Transactional
    public UserPreferenceResponse upsertPreferences(String userId, UserPreferenceRequest request) {
        UserPreference preference = userPreferenceRepository.findById(userId).orElseGet(UserPreference::new);
        preference.setUserId(userId);
        preference.setEmailEnabled(request.isEmailEnabled());
        preference.setSmsEnabled(request.isSmsEnabled());
        preference.setPushEnabled(request.isPushEnabled());
        userPreferenceRepository.save(preference);
        cachePreference(preference);
        return toPreferenceResponse(preference);
    }

    @Transactional(readOnly = true)
    public UserPreferenceResponse getPreferences(String userId) {
        Optional<UserPreference> cached = getPreferenceFromCache(userId);
        if (cached.isPresent()) {
            return toPreferenceResponse(cached.get());
        }

        UserPreference preference = userPreferenceRepository.findById(userId)
                .orElseThrow(() -> new UserPreferenceNotFoundException(userId));
        cachePreference(preference);
        return toPreferenceResponse(preference);
    }

    @Transactional(readOnly = true)
    public boolean isChannelEnabled(String userId, Channel channel) {
        Optional<UserPreference> cached = getPreferenceFromCache(userId);
        if (cached.isPresent()) {
            return isEnabledForChannel(cached.get(), channel);
        }

        Optional<UserPreference> preference = userPreferenceRepository.findById(userId);
        if (preference.isEmpty()) {
            return true;
        }
        cachePreference(preference.get());
        return isEnabledForChannel(preference.get(), channel);
    }

    private boolean isEnabledForChannel(UserPreference preference, Channel channel) {
        return switch (channel) {
            case EMAIL -> preference.isEmailEnabled();
            case SMS -> preference.isSmsEnabled();
            case PUSH -> preference.isPushEnabled();
        };
    }

    private Optional<UserPreference> getPreferenceFromCache(String userId) {
        String key = preferenceKey(userId);
        try {
            Map<Object, Object> map = redisTemplate.opsForHash().entries(key);
            if (map == null || map.isEmpty()) {
                return Optional.empty();
            }
            UserPreference preference = new UserPreference();
            preference.setUserId(userId);
            preference.setEmailEnabled(Boolean.parseBoolean(String.valueOf(map.getOrDefault("emailEnabled", "false"))));
            preference.setSmsEnabled(Boolean.parseBoolean(String.valueOf(map.getOrDefault("smsEnabled", "false"))));
            preference.setPushEnabled(Boolean.parseBoolean(String.valueOf(map.getOrDefault("pushEnabled", "false"))));
            return Optional.of(preference);
        } catch (Exception ex) {
            log.warn("Preference cache read failed. userId={}", userId, ex);
            return Optional.empty();
        }
    }

    private void cachePreference(UserPreference preference) {
        String key = preferenceKey(preference.getUserId());
        try {
            redisTemplate.opsForHash().putAll(key, Map.of(
                    "emailEnabled", String.valueOf(preference.isEmailEnabled()),
                    "smsEnabled", String.valueOf(preference.isSmsEnabled()),
                    "pushEnabled", String.valueOf(preference.isPushEnabled())
            ));
            redisTemplate.expire(key, preferenceCacheTtl);
        } catch (Exception ex) {
            log.warn("Preference cache write failed. userId={}", preference.getUserId(), ex);
        }
    }

    private UserPreferenceResponse toPreferenceResponse(UserPreference preference) {
        return new UserPreferenceResponse(
                preference.getUserId(),
                preference.isEmailEnabled(),
                preference.isSmsEnabled(),
                preference.isPushEnabled()
        );
    }

    private String preferenceKey(String userId) {
        return PREF_KEY_PREFIX + userId;
    }
}
