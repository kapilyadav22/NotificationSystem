package com.example.notificationsystem.channel;

import com.example.notificationsystem.entity.Notification;
import com.example.notificationsystem.model.Channel;

public interface NotificationSender {

    Channel channel();

    void send(Notification notification);
}
