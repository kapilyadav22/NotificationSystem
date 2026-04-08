package com.example.notificationsystem.observability;

import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.AdminClientConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Component("kafka")
public class KafkaHealthIndicator implements HealthIndicator {

    private final String bootstrapServers;
    private final Duration timeout;

    public KafkaHealthIndicator(
            @Value("${spring.kafka.bootstrap-servers}") String bootstrapServers,
            @Value("${app.health.kafka-timeout-seconds:3}") long timeoutSeconds
    ) {
        this.bootstrapServers = bootstrapServers;
        this.timeout = Duration.ofSeconds(timeoutSeconds);
    }

    @Override
    public Health health() {
        Map<String, Object> config = Map.of(
                AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers,
                AdminClientConfig.REQUEST_TIMEOUT_MS_CONFIG, (int) timeout.toMillis()
        );

        try (AdminClient adminClient = AdminClient.create(config)) {
            int nodeCount = adminClient.describeCluster()
                    .nodes()
                    .get(timeout.toMillis(), TimeUnit.MILLISECONDS)
                    .size();
            return Health.up()
                    .withDetail("bootstrapServers", bootstrapServers)
                    .withDetail("nodeCount", nodeCount)
                    .build();
        } catch (Exception ex) {
            return Health.down(ex)
                    .withDetail("bootstrapServers", bootstrapServers)
                    .build();
        }
    }
}
