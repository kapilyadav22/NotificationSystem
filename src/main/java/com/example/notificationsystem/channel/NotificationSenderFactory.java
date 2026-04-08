package com.example.notificationsystem.channel;

import com.example.notificationsystem.model.Channel;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class NotificationSenderFactory {

    private final Map<Channel, NotificationSender> senders = new EnumMap<>(Channel.class);

    public NotificationSenderFactory(List<NotificationSender> notificationSenders) {
        for (NotificationSender sender : notificationSenders) {
            this.senders.put(sender.channel(), sender);
        }
    }

    public NotificationSender getSender(Channel channel) {
        NotificationSender sender = senders.get(channel);
        if (sender == null) {
            throw new IllegalArgumentException("No sender configured for channel " + channel);
        }
        return sender;
    }
}
