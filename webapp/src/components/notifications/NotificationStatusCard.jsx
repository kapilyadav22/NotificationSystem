import { useState } from "react";
import { Search, Hash, Clock, AlertTriangle, Fingerprint } from "lucide-react";
import { pretty } from "../../lib/http";
import { handleApiResult, showToast } from "../../lib/alert";

function formatDateTime(dt) {
  if (!dt) return "—";
  try {
    const d = new Date(dt);
    return d.toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch {
    return String(dt);
  }
}

export default function NotificationStatusCard({ apiRequest, lastNotificationId }) {
  const [statusNotificationId, setStatusNotificationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusResult, setStatusResult] = useState(null);

  async function getNotificationStatus() {
    const id = statusNotificationId.trim() || lastNotificationId;
    if (!id) {
      showToast("warning", "Missing ID", "Enter a notification ID first");
      return;
    }
    setLoading(true);
    try {
      const result = await apiRequest(`/notifications/${id}`);
      setStatusResult(result.data);
      handleApiResult(pretty(result));
    } catch (err) {
      showToast("error", "Network error", err.message);
    } finally {
      setLoading(false);
    }
  }

  const statusColor =
    statusResult?.status === "SENT" ? "text-success-600 bg-success-500/10" :
    statusResult?.status === "FAILED" || statusResult?.status === "DLQ" ? "text-error-600 bg-error-500/10" :
    statusResult?.status === "PROCESSING" ? "text-warning-600 bg-warning-500/10" :
    statusResult?.status === "RETRIED" ? "text-violet-600 bg-violet-100" :
    "text-primary-600 bg-primary-500/10";

  return (
    <div className="glass-card rounded-2xl p-5 shadow-lg shadow-surface-200/50 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
          <Search className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-sm font-semibold text-surface-800 uppercase tracking-wide">
          Track Status
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5">
            <Hash className="w-3 h-3" />
            Notification ID
          </label>
          <input
            type="text"
            value={statusNotificationId}
            onChange={(e) => setStatusNotificationId(e.target.value)}
            placeholder={lastNotificationId || "Paste notification ID"}
            className="w-full bg-white/60 border border-surface-200 rounded-xl px-3.5 py-2.5 text-sm text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
          />
        </div>

        <button
          onClick={getNotificationStatus}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200 disabled:opacity-60 cursor-pointer"
        >
          <Search className="w-4 h-4" />
          {loading ? "Looking up…" : "Get Status"}
        </button>

        {statusResult && (
          <div className="mt-3 p-3 rounded-xl bg-surface-50 border border-surface-200 space-y-2 animate-fade-in">
            {statusResult.status && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-surface-500 uppercase">Status</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor}`}>
                  {statusResult.status}
                </span>
              </div>
            )}
            {statusResult.notificationId && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-surface-500 uppercase">ID</span>
                <span className="text-xs font-mono text-surface-700 truncate max-w-[180px]">{statusResult.notificationId}</span>
              </div>
            )}
            {statusResult.userId && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-surface-500 uppercase">User</span>
                <span className="text-xs text-surface-700">{statusResult.userId}</span>
              </div>
            )}
            {statusResult.channel && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-surface-500 uppercase">Channel</span>
                <span className="text-xs text-surface-700">{statusResult.channel}</span>
              </div>
            )}
            {statusResult.retryCount !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-surface-500 uppercase">Retries</span>
                <span className="text-xs text-surface-700">{statusResult.retryCount} / 3</span>
              </div>
            )}

            {/* Idempotency Key */}
            {statusResult.idempotencyKey && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-violet-50/60 border border-violet-200/40">
                <span className="text-xs font-medium text-violet-600 uppercase flex items-center gap-1">
                  <Fingerprint className="w-3 h-3" />
                  Idempotency Key
                </span>
                <span className="text-[11px] font-mono text-violet-700 truncate max-w-[160px]" title={statusResult.idempotencyKey}>
                  {statusResult.idempotencyKey}
                </span>
              </div>
            )}

            {/* Failure Reason */}
            {statusResult.failureReason && (
              <div className="mt-2 p-2.5 rounded-lg bg-error-500/5 border border-error-500/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3 h-3 text-error-500" />
                  <span className="text-[11px] font-semibold text-error-600 uppercase">Failure Reason</span>
                </div>
                <p className="text-xs text-error-600/80 break-words">{statusResult.failureReason}</p>
              </div>
            )}

            {/* Timestamps */}
            {(statusResult.createdAt || statusResult.updatedAt) && (
              <div className="mt-2 pt-2 border-t border-surface-200/60 space-y-1">
                {statusResult.createdAt && (
                  <div className="flex items-center gap-1.5 text-[11px] text-surface-400">
                    <Clock className="w-3 h-3" />
                    Created: {formatDateTime(statusResult.createdAt)}
                  </div>
                )}
                {statusResult.updatedAt && (
                  <div className="flex items-center gap-1.5 text-[11px] text-surface-400">
                    <Clock className="w-3 h-3" />
                    Updated: {formatDateTime(statusResult.updatedAt)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
