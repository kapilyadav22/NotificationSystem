package com.example.notificationsystem.channel;

import com.example.notificationsystem.entity.Notification;
import com.example.notificationsystem.model.Channel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class PushNotificationSender implements NotificationSender {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationSender.class);
    private static final int MAX_PUSH_LENGTH = 500;

    @Override
    public Channel channel() {
        return Channel.PUSH;
    }

    @Override
    public void send(Notification notification) {
        String message = notification.getMessage();
        if (message.length() > MAX_PUSH_LENGTH) {
            throw new IllegalArgumentException("Push message exceeds max length of " + MAX_PUSH_LENGTH);
        }
        log.info(
                "Push sent. notificationId={}, userId={}, message={}",
                notification.getId(),
                notification.getUserId(),
                message
        );
    }
}
