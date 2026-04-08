package com.example.notificationsystem.channel;

import com.example.notificationsystem.entity.Notification;
import com.example.notificationsystem.model.Channel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class EmailNotificationSender implements NotificationSender {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationSender.class);

    @Override
    public Channel channel() {
        return Channel.EMAIL;
    }

    @Override
    public void send(Notification notification) {
        log.info(
                "Email sent. notificationId={}, userId={}, message={}",
                notification.getId(),
                notification.getUserId(),
                notification.getMessage()
        );
    }
}
