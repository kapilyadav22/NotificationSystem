import { useState } from "react";
import { pretty } from "../lib/http";

export default function PreferencesCard({ apiRequest, onResult }) {
  const [prefUserId, setPrefUserId] = useState("u1");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  async function upsertPreferences(event) {
    event.preventDefault();
    const result = await apiRequest(`/preferences/${prefUserId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailEnabled, smsEnabled, pushEnabled })
    });
    onResult(pretty(result));
  }

  async function getPreferences() {
    const result = await apiRequest(`/preferences/${prefUserId}`);
    onResult(pretty(result));
  }

  return (
    <article className="card">
      <h2>User Preferences</h2>
      <form onSubmit={upsertPreferences} className="stack">
        <label className="field">
          <span>User ID</span>
          <input value={prefUserId} onChange={(e) => setPrefUserId(e.target.value)} />
        </label>
        <label className="toggle"><input type="checkbox" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} /> Email</label>
        <label className="toggle"><input type="checkbox" checked={smsEnabled} onChange={(e) => setSmsEnabled(e.target.checked)} /> SMS</label>
        <label className="toggle"><input type="checkbox" checked={pushEnabled} onChange={(e) => setPushEnabled(e.target.checked)} /> Push</label>
        <div className="actions">
          <button type="submit">Save Preferences</button>
          <button type="button" onClick={getPreferences}>Load Preferences</button>
        </div>
      </form>
    </article>
  );
}
