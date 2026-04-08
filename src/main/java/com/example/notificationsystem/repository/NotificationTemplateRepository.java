package com.example.notificationsystem.repository;

import com.example.notificationsystem.entity.NotificationTemplate;
import com.example.notificationsystem.model.Channel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, Long> {

    Optional<NotificationTemplate> findByTemplateIdAndChannel(String templateId, Channel channel);

    List<NotificationTemplate> findAllByOrderByTemplateIdAscChannelAsc();
}
