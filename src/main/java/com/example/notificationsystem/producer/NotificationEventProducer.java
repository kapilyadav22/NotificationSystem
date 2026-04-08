package com.example.notificationsystem.producer;

import com.example.notificationsystem.entity.Notification;
import com.example.notificationsystem.event.NotificationEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class NotificationEventProducer {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventProducer.class);

    private final KafkaTemplate<String, NotificationEvent> kafkaTemplate;
    private final String mainTopic;
    private final String retryTopic;
    private final String dlqTopic;

    public NotificationEventProducer(
            KafkaTemplate<String, NotificationEvent> kafkaTemplate,
            @Value("${app.kafka.notification-topic:notification-send}")
            String mainTopic,
            @Value("${app.kafka.retry-topic:notification-retry}")
            String retryTopic,
            @Value("${app.kafka.dlq-topic:notification-dlq}")
            String dlqTopic
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.mainTopic = mainTopic;
        this.retryTopic = retryTopic;
        this.dlqTopic = dlqTopic;
    }

    public void publishMain(Notification notification) {
        publish(mainTopic, notification, "MAIN");
    }

    public void publishRetry(Notification notification) {
        publish(retryTopic, notification, "RETRY");
    }

    public void publishDlq(Notification notification) {
        publish(dlqTopic, notification, "DLQ");
    }

    private void publish(String topic, Notification notification, String flow) {
        NotificationEvent event = new NotificationEvent(
                notification.getId(),
                notification.getUserId(),
                notification.getMessage(),
                notification.getChannel()
        );
        kafkaTemplate.send(topic, notification.getId(), event).whenComplete((result, ex) -> {
            if (ex != null) {
                log.error(
                        "Failed to publish notification event. flow={}, notificationId={}",
                        flow,
                        notification.getId(),
                        ex
                );
            } else {
                log.info(
                        "Published notification event. flow={}, topic={}, notificationId={}",
                        flow,
                        topic,
                        notification.getId()
                );
            }
        });
    }
}
