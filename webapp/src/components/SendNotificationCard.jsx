import { useState } from "react";
import { CHANNELS } from "../constants";
import { pretty } from "../lib/http";

export default function SendNotificationCard({ apiRequest, onResult, onNotificationId }) {
  const [userId, setUserId] = useState("u1");
  const [channel, setChannel] = useState("EMAIL");
  const [messageMode, setMessageMode] = useState("RAW");
  const [message, setMessage] = useState("Hello from React console");
  const [templateId, setTemplateId] = useState("");
  const [variablesText, setVariablesText] = useState('{ "name": "Kapil", "orderId": "A123" }');
  const [idempotencyKey, setIdempotencyKey] = useState("");

  async function sendNotification(event) {
    event.preventDefault();

    const payload = { userId, channel };
    if (messageMode === "RAW") {
      payload.message = message;
    } else {
      payload.templateId = templateId;
      try {
        payload.variables = variablesText ? JSON.parse(variablesText) : {};
      } catch {
        onResult("Invalid template variables JSON");
        return;
      }
    }

    const headers = { "Content-Type": "application/json" };
    if (idempotencyKey.trim()) {
      headers["Idempotency-Key"] = idempotencyKey.trim();
    }

    const result = await apiRequest("/notifications", {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    if (result.data?.notificationId) {
      onNotificationId(result.data.notificationId);
    }
    onResult(pretty(result));
  }

  return (
    <article className="card">
      <h2>Send Notification</h2>
      <form onSubmit={sendNotification} className="stack">
        <label className="field">
          <span>User ID</span>
          <input value={userId} onChange={(e) => setUserId(e.target.value)} />
        </label>
        <label className="field">
          <span>Channel</span>
          <select value={channel} onChange={(e) => setChannel(e.target.value)}>
            {CHANNELS.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Payload Mode</span>
          <select value={messageMode} onChange={(e) => setMessageMode(e.target.value)}>
            <option value="RAW">Raw Message</option>
            <option value="TEMPLATE">Template</option>
          </select>
        </label>
        {messageMode === "RAW" ? (
          <label className="field">
            <span>Message</span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
          </label>
        ) : (
          <>
            <label className="field">
              <span>Template ID</span>
              <input value={templateId} onChange={(e) => setTemplateId(e.target.value)} />
            </label>
            <label className="field">
              <span>Variables JSON</span>
              <textarea value={variablesText} onChange={(e) => setVariablesText(e.target.value)} rows={4} />
            </label>
          </>
        )}
        <label className="field">
          <span>Idempotency Key</span>
          <input value={idempotencyKey} onChange={(e) => setIdempotencyKey(e.target.value)} />
        </label>
        <button type="submit">Submit</button>
      </form>
    </article>
  );
}
