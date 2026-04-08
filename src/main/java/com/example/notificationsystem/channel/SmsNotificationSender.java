package com.example.notificationsystem.channel;

import com.example.notificationsystem.entity.Notification;
import com.example.notificationsystem.model.Channel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class SmsNotificationSender implements NotificationSender {

    private static final Logger log = LoggerFactory.getLogger(SmsNotificationSender.class);
    private static final int MAX_SMS_LENGTH = 160;

    @Override
    public Channel channel() {
        return Channel.SMS;
    }

    @Override
    public void send(Notification notification) {
        String message = notification.getMessage();
        if (message.length() > MAX_SMS_LENGTH) {
            throw new IllegalArgumentException("SMS message exceeds max length of " + MAX_SMS_LENGTH);
        }
        log.info(
                "SMS sent. notificationId={}, userId={}, message={}",
                notification.getId(),
                notification.getUserId(),
                message
        );
    }
}
