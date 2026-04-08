# API Examples

Base URL used below: `http://localhost:8080`

---

## 1) Create Notification

**Endpoint**: `POST /notifications`  
**Path params**: none  
**Query params**: none  
**Headers**:
- `Content-Type: application/json`
- `Idempotency-Key: notif-user-1001-order-5001` (optional but recommended)

**Request body (example)**:
```json
{
  "userId": "user-1001",
  "message": "Your OTP is 482913",
  "channel": "SMS",
  "templateId": "otp-template",
  "variables": {
    "otp": "482913",
    "appName": "NotifyApp"
  }
}
```

---

## 2) Get Notification Status

**Endpoint**: `GET /notifications/{notificationId}`  
**Path params**:
- `notificationId` (required)

**Example**:
```bash
curl -X GET "http://localhost:8080/notifications/2d602c59-7a10-4f2e-8d1e-4b1f9d4d5012"
```

---

## 3) List Notifications (Admin)

**Endpoint**: `GET /admin/notifications`  
**Path params**: none  
**Query params**:
- `status` (optional): `PENDING | PROCESSING | SENT | FAILED | RETRIED | DLQ`

**Example**:
```bash
curl -X GET "http://localhost:8080/admin/notifications?status=FAILED"
```

---

## 4) Retry Notification (Admin)

**Endpoint**: `POST /admin/notifications/{notificationId}/retry`  
**Path params**:
- `notificationId` (required)

**Example**:
```bash
curl -X POST "http://localhost:8080/admin/notifications/2d602c59-7a10-4f2e-8d1e-4b1f9d4d5012/retry"
```

---

## 5) Upsert Template (Admin)

**Endpoint**: `PUT /admin/templates`  
**Path params**: none  
**Query params**: none  
**Headers**:
- `Content-Type: application/json`

**Request body (example)**:
```json
{
  "templateId": "welcome-template",
  "channel": "EMAIL",
  "content": "Hi {{name}}, welcome to NotifyApp."
}
```

---

## 6) List Templates (Admin)

**Endpoint**: `GET /admin/templates`  
**Path params**: none  
**Query params**: none

**Example**:
```bash
curl -X GET "http://localhost:8080/admin/templates"
```

---

## 7) Get Template by Template ID + Channel (Admin)

**Endpoint**: `GET /admin/templates/{templateId}`  
**Path params**:
- `templateId` (required)  
**Query params**:
- `channel` (required): `EMAIL | SMS | PUSH`

**Example**:
```bash
curl -X GET "http://localhost:8080/admin/templates/welcome-template?channel=EMAIL"
```

---

## 8) Upsert User Preferences

**Endpoint**: `PUT /preferences/{userId}`  
**Path params**:
- `userId` (required)

**Headers**:
- `Content-Type: application/json`

**Request body (example)**:
```json
{
  "emailEnabled": true,
  "smsEnabled": false,
  "pushEnabled": true
}
```

---

## 9) Get User Preferences

**Endpoint**: `GET /preferences/{userId}`  
**Path params**:
- `userId` (required)

**Example**:
```bash
curl -X GET "http://localhost:8080/preferences/user-1001"
```

---

## 10) Actuator Health

**Endpoint**: `GET /actuator/health`  
**Body**: none

**Example**:
```bash
curl -X GET "http://localhost:8080/actuator/health"
```

---

## 11) Actuator Info

**Endpoint**: `GET /actuator/info`  
**Body**: none

**Example**:
```bash
curl -X GET "http://localhost:8080/actuator/info"
```

---

## 12) Actuator Metrics

**Endpoint**: `GET /actuator/metrics`  
**Body**: none

**Example**:
```bash
curl -X GET "http://localhost:8080/actuator/metrics"
```

