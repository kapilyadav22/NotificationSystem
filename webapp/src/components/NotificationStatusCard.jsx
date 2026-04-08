import { useState } from "react";
import { pretty } from "../lib/http";

export default function NotificationStatusCard({ apiRequest, onResult, lastNotificationId }) {
  const [statusNotificationId, setStatusNotificationId] = useState("");

  async function getNotificationStatus() {
    if (!statusNotificationId.trim()) {
      onResult("Enter notification id");
      return;
    }
    const result = await apiRequest(`/notifications/${statusNotificationId.trim()}`);
    onResult(pretty(result));
  }

  return (
    <article className="card">
      <h2>Notification Status</h2>
      <div className="stack">
        <label className="field">
          <span>Notification ID</span>
          <input
            value={statusNotificationId}
            onChange={(e) => setStatusNotificationId(e.target.value)}
            placeholder={lastNotificationId || "Paste notification id"}
          />
        </label>
        <button onClick={getNotificationStatus}>Get Status</button>
      </div>
    </article>
  );
}
