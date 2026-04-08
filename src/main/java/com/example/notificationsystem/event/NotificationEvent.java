package com.example.notificationsystem.event;

import com.example.notificationsystem.model.Channel;
import lombok.Data;


@Data
public class NotificationEvent {

    private String notificationId;
    private String userId;
    private String message;
    private Channel channel;

    public NotificationEvent() {
    }

    public NotificationEvent(String notificationId, String userId, String message, Channel channel) {
        this.notificationId = notificationId;
        this.userId = userId;
        this.message = message;
        this.channel = channel;
    }

}
