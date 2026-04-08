package com.example.notificationsystem.observability;

import com.example.notificationsystem.model.Channel;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tag;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;

@Component
public class NotificationMetrics {

    private final MeterRegistry meterRegistry;

    public NotificationMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    public void incrementAccepted(Channel channel) {
        meterRegistry.counter(
                "notifications.accepted.total",
                List.of(Tag.of("channel", channel.name()))
        ).increment();
    }

    public void incrementSent(Channel channel) {
        meterRegistry.counter(
                "notifications.sent.total",
                List.of(Tag.of("channel", channel.name()))
        ).increment();
    }

    public void incrementFailed(Channel channel) {
        meterRegistry.counter(
                "notifications.failed.total",
                List.of(Tag.of("channel", channel.name()))
        ).increment();
    }

    public void incrementRetried(Channel channel) {
        meterRegistry.counter(
                "notifications.retried.total",
                List.of(Tag.of("channel", channel.name()))
        ).increment();
    }

    public void incrementDlq(Channel channel) {
        meterRegistry.counter(
                "notifications.dlq.total",
                List.of(Tag.of("channel", channel.name()))
        ).increment();
    }

    public void recordDeliveryLatency(Channel channel, Duration duration) {
        Timer.builder("notifications.delivery.latency")
                .description("Delivery processing latency")
                .tag("channel", channel.name())
                .register(meterRegistry)
                .record(duration);
    }
}
