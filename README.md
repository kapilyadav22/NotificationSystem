# Notification System

A full-stack notification platform built with Spring Boot and React.  
It supports sending notifications over multiple channels, tracks delivery state, and includes an admin console for operations like retries, templates, user preferences, and runtime health/metrics.

## What this project includes

- Notification API to create and track notifications
- Multi-channel delivery support (`EMAIL`, `SMS`, `PUSH`)
- Kafka-based async processing with retry + DLQ flow
- Idempotency support on send requests (`Idempotency-Key` header)
- Per-user/channel preference management
- Admin APIs for notification listing and manual retry
- Template management APIs (upsert/list/get by channel)
- Redis-based caching and rate limiting
- Actuator health/info/metrics exposure
- React admin dashboard with tabs for:
  - Notifications
  - Templates
  - Preferences
  - Actuator
  - Metrics

## Tech stack

Backend:
- Java 21
- Spring Boot 4
- Spring Web MVC, Validation, JPA
- Kafka
- Redis
- MySQL
- Spring Actuator

Frontend:
- React + Vite
- Tailwind CSS

## API overview

Base URL: `http://localhost:8080`

- `POST /notifications` -> create notification (accepts optional `Idempotency-Key`)
- `GET /notifications/{notificationId}` -> get current status
- `GET /admin/notifications?status=...` -> list notifications for admin
- `POST /admin/notifications/{notificationId}/retry` -> trigger manual retry
- `PUT /admin/templates` -> create/update template
- `GET /admin/templates` -> list templates
- `GET /admin/templates/{templateId}?channel=...` -> fetch specific template
- `PUT /preferences/{userId}` -> create/update user preferences
- `GET /preferences/{userId}` -> get user preferences
- `GET /actuator/health`
- `GET /actuator/info`
- `GET /actuator/metrics`

## Local setup

### 1) Start infrastructure

Make sure these are running locally:
- MySQL on `3306`
- Kafka on `9092`
- Redis on `6379`

Default values are already configured in `src/main/resources/application.properties`, but can be overridden using environment variables.

### 2) Run backend

```bash
./mvnw spring-boot:run
```

Backend starts on `http://localhost:8080`.

### 3) Run frontend

```bash
cd webapp
npm install
npm run dev
```

Frontend starts on `http://localhost:5173`.

## Notes

- Local secret-style overrides can go in `src/main/resources/application-local.properties` (ignored by Git).
- Logs are printed to console by default (no file appender is configured).
