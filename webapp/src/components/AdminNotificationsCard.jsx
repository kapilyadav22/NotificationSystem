import { startTransition, useDeferredValue, useState } from "react";
import { ADMIN_STATUSES } from "../constants";
import { pretty } from "../lib/http";

export default function AdminNotificationsCard({ apiRequest, onResult }) {
  const [adminStatus, setAdminStatus] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
  const [adminNotifications, setAdminNotifications] = useState([]);
  const deferredSearch = useDeferredValue(adminSearch);

  async function loadAdminNotifications() {
    const suffix = adminStatus ? `?status=${adminStatus}` : "";
    const result = await apiRequest(`/admin/notifications${suffix}`);
    startTransition(() => {
      setAdminNotifications(Array.isArray(result.data) ? result.data : []);
    });
    onResult(pretty(result));
  }

  async function retryNotification(notificationId) {
    const result = await apiRequest(`/admin/notifications/${notificationId}/retry`, { method: "POST" });
    onResult(pretty(result));
    await loadAdminNotifications();
  }

  const filteredAdmin = adminNotifications.filter((item) => {
    if (!deferredSearch.trim()) return true;
    const query = deferredSearch.toLowerCase();
    return (
      item.notificationId?.toLowerCase().includes(query) ||
      item.userId?.toLowerCase().includes(query) ||
      item.status?.toLowerCase().includes(query)
    );
  });

  return (
    <article className="card wide">
      <h2>Admin Notifications</h2>
      <div className="toolbar">
        <label className="field">
          <span>Status</span>
          <select value={adminStatus} onChange={(e) => setAdminStatus(e.target.value)}>
            {ADMIN_STATUSES.map((entry) => (
              <option key={entry || "ALL"} value={entry}>
                {entry || "ALL"}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Search</span>
          <input value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} placeholder="notificationId or userId" />
        </label>
        <button onClick={loadAdminNotifications}>Load</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Channel</th>
              <th>Status</th>
              <th>Retry</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmin.map((item) => (
              <tr key={item.notificationId}>
                <td>{item.notificationId}</td>
                <td>{item.userId}</td>
                <td>{item.channel}</td>
                <td>{item.status}</td>
                <td>{item.retryCount}</td>
                <td>
                  {(item.status === "FAILED" || item.status === "DLQ") && (
                    <button onClick={() => retryNotification(item.notificationId)}>Retry</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
