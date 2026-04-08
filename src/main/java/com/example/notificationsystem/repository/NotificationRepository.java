package com.example.notificationsystem.repository;

import com.example.notificationsystem.entity.Notification;
import com.example.notificationsystem.model.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, String> {

    Optional<Notification> findByIdempotencyKey(String idempotencyKey);

    List<Notification> findByStatusOrderByCreatedAtDesc(NotificationStatus status);
}
