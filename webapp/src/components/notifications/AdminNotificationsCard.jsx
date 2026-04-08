import { startTransition, useCallback, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { List, Filter, Search, RotateCcw, AlertTriangle, Clock, FileText, Eye, Fingerprint } from "lucide-react";
import { ADMIN_STATUSES } from "../../constants";
import { pretty } from "../../lib/http";
import { handleApiResult, showToast } from "../../lib/alert";
import { useDebounce, useThrottle } from "../../hooks/usePerformance";
import Swal from "sweetalert2";

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

const ROW_HEIGHT = 48;

export default function AdminNotificationsCard({ apiRequest }) {
  const [adminStatus, setAdminStatus] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(adminSearch, 250);
  const scrollContainerRef = useRef(null);

  async function loadAdminNotifications() {
    setLoading(true);
    try {
      const suffix = adminStatus ? `?status=${adminStatus}` : "";
      const result = await apiRequest(`/admin/notifications${suffix}`);
      startTransition(() => {
        setAdminNotifications(Array.isArray(result.data) ? result.data : []);
      });
      handleApiResult(pretty(result));
    } catch (err) {
      showToast("error", "Network error", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function retryNotification(notificationId) {
    const confirm = await Swal.fire({
      title: "Retry Notification?",
      html: `<p class="text-sm text-gray-600">This will re-enqueue notification <code class="text-xs bg-gray-100 px-1.5 py-0.5 rounded">${notificationId}</code> to the main Kafka topic for reprocessing.</p>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Retry",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#6366f1",
      customClass: { popup: "!rounded-2xl" },
    });
    if (!confirm.isConfirmed) return;
    try {
      const result = await apiRequest(`/admin/notifications/${notificationId}/retry`, { method: "POST" });
      handleApiResult(pretty(result));
      await loadAdminNotifications();
    } catch (err) {
      showToast("error", "Retry failed", err.message);
    }
  }

  const showNotificationDetail = useCallback((item) => {
    Swal.fire({
      title: "Notification Detail",
      html: `
        <div style="text-align:left; font-size:13px; line-height:1.8;">
          <div><strong>ID:</strong> <code style="font-size:11px;background:#f1f5f9;padding:2px 6px;border-radius:6px;">${item.notificationId}</code></div>
          <div><strong>User:</strong> ${item.userId}</div>
          <div><strong>Channel:</strong> ${item.channel}</div>
          <div><strong>Status:</strong> <span style="font-weight:700;">${item.status}</span></div>
          <div><strong>Template:</strong> ${item.templateId || "—"}</div>
          <div><strong>Retry Count:</strong> ${item.retryCount} / 3</div>
          ${item.idempotencyKey ? `<div style="margin-top:6px;padding:8px;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;"><strong style="color:#7c3aed;">🔑 Idempotency Key:</strong> <code style="font-size:11px;color:#6d28d9;">${item.idempotencyKey}</code></div>` : ""}
          ${item.failureReason ? `<div style="margin-top:6px;padding:8px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;"><strong style="color:#dc2626;">Failure:</strong> <span style="color:#b91c1c;">${item.failureReason}</span></div>` : ""}
          <div style="margin-top:8px;color:#94a3b8;font-size:11px;">
            Created: ${formatDateTime(item.createdAt)}<br/>
            Updated: ${formatDateTime(item.updatedAt)}
          </div>
        </div>
      `,
      confirmButtonColor: "#6366f1",
      customClass: { popup: "!rounded-2xl" },
      width: 480,
    });
  }, []);

  const filteredAdmin = useMemo(() => {
    if (!debouncedSearch.trim()) return adminNotifications;
    const query = debouncedSearch.toLowerCase();
    return adminNotifications.filter((item) =>
      item.notificationId?.toLowerCase().includes(query) ||
      item.userId?.toLowerCase().includes(query) ||
      item.status?.toLowerCase().includes(query) ||
      item.templateId?.toLowerCase().includes(query) ||
      item.failureReason?.toLowerCase().includes(query) ||
      item.idempotencyKey?.toLowerCase().includes(query)
    );
  }, [adminNotifications, debouncedSearch]);

  const rowVirtualizer = useVirtualizer({
    count: filteredAdmin.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  function getStatusBadge(status) {
    const base = "text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap";
    switch (status) {
      case "SENT": return `${base} text-success-600 bg-success-500/10`;
      case "FAILED": return `${base} text-error-600 bg-error-500/10`;
      case "DLQ": return `${base} text-error-600 bg-error-500/10`;
      case "PROCESSING": return `${base} text-warning-600 bg-warning-500/10`;
      case "RETRIED": return `${base} text-violet-600 bg-violet-100`;
      case "PENDING": return `${base} text-blue-600 bg-blue-100`;
      default: return `${base} text-primary-600 bg-primary-500/10`;
    }
  }

  const statusCounts = useMemo(() =>
    adminNotifications.reduce((acc, n) => {
      acc[n.status] = (acc[n.status] || 0) + 1;
      return acc;
    }, {}),
    [adminNotifications]
  );

  return (
    <div className="glass-card rounded-2xl p-5 shadow-lg shadow-surface-200/50 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <List className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-surface-800 uppercase tracking-wide">
            Admin Notifications
          </h3>
        </div>
        {adminNotifications.length > 0 && (
          <span className="text-xs font-medium text-surface-500 bg-surface-100 px-2.5 py-1 rounded-full">
            {filteredAdmin.length} of {adminNotifications.length}
          </span>
        )}
      </div>

      {/* Status summary chips */}
      {Object.keys(statusCounts).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => {
                setAdminStatus(status);
                loadAdminNotifications();
              }}
              className={`${getStatusBadge(status)} cursor-pointer hover:scale-105 transition-transform`}
            >
              {status}: {count}
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[140px]">
          <label className="flex items-center gap-1 text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5">
            <Filter className="w-3 h-3" /> Status
          </label>
          <select
            value={adminStatus}
            onChange={(e) => setAdminStatus(e.target.value)}
            className="w-full bg-white/60 border border-surface-200 rounded-xl px-3 py-2 text-sm text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all cursor-pointer"
          >
            {ADMIN_STATUSES.map((s) => (
              <option key={s || "ALL"} value={s}>{s || "ALL"}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="flex items-center gap-1 text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5">
            <Search className="w-3 h-3" /> Search
          </label>
          <input
            value={adminSearch}
            onChange={(e) => setAdminSearch(e.target.value)}
            placeholder="ID, userId, template, failure…"
            className="w-full bg-white/60 border border-surface-200 rounded-xl px-3 py-2 text-sm text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={loadAdminNotifications}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-4 py-2 rounded-xl shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all disabled:opacity-60 cursor-pointer"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Load
          </button>
        </div>
      </div>

      {/* Virtualized Table */}
      <div className="rounded-xl border border-surface-200 overflow-hidden">
        {/* Sticky header */}
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            <div className="flex bg-surface-50/80 border-b border-surface-200">
              <div className="w-[11%] text-left text-[11px] font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">ID</div>
              <div className="w-[9%] text-left text-[11px] font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">User</div>
              <div className="w-[9%] text-left text-[11px] font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">Channel</div>
              <div className="w-[11%] text-left text-[11px] font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">Template</div>
              <div className="w-[11%] text-left text-[11px] font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">Idempotency</div>
              <div className="w-[11%] text-left text-[11px] font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">Status</div>
              <div className="w-[7%] text-left text-[11px] font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">Retries</div>
              <div className="w-[16%] text-left text-[11px] font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">Created</div>
              <div className="w-[15%] text-left text-[11px] font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">Actions</div>
            </div>

            {/* Scrollable virtualized body */}
            <div
              ref={scrollContainerRef}
              className="overflow-auto"
              style={{ maxHeight: "420px" }}
            >
              {filteredAdmin.length === 0 ? (
                <div className="text-center text-sm text-surface-400 py-8">
                  {adminNotifications.length === 0 ? "Click Load to fetch notifications" : "No matching results"}
                </div>
              ) : (
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const item = filteredAdmin[virtualRow.index];
                    return (
                      <div
                        key={item.notificationId}
                        className="absolute top-0 left-0 w-full flex items-center hover:bg-surface-50/60 transition-colors border-b border-surface-100/60"
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <div className="w-[11%] px-4 text-xs font-mono text-surface-700 truncate" title={item.notificationId}>
                          {item.notificationId?.slice(0, 8)}…
                        </div>
                        <div className="w-[9%] px-4 text-xs text-surface-700 truncate" title={item.userId}>{item.userId}</div>
                        <div className="w-[9%] px-4 text-xs text-surface-700">{item.channel}</div>
                        <div className="w-[11%] px-4 text-xs text-surface-600">
                          {item.templateId ? (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3 text-surface-400 shrink-0" />
                              <span className="truncate" title={item.templateId}>{item.templateId}</span>
                            </span>
                          ) : (
                            <span className="text-surface-400">raw</span>
                          )}
                        </div>
                        <div className="w-[11%] px-4 text-xs text-surface-600">
                          {item.idempotencyKey ? (
                            <span className="flex items-center gap-1 text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded max-w-full">
                              <Fingerprint className="w-3 h-3 shrink-0" />
                              <span className="truncate flex-1 font-mono text-[10px]" title={item.idempotencyKey}>{item.idempotencyKey.slice(0, 8)}…</span>
                            </span>
                          ) : (
                            <span className="text-surface-300">—</span>
                          )}
                        </div>
                        <div className="w-[11%] px-4">
                          <span className={getStatusBadge(item.status)}>{item.status}</span>
                        </div>
                        <div className="w-[7%] px-4 text-xs text-surface-700">{item.retryCount}</div>
                        <div className="w-[16%] px-4 text-[11px] text-surface-400 whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            {formatDateTime(item.createdAt)}
                          </span>
                        </div>
                        <div className="w-[15%] px-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => showNotificationDetail(item)}
                              className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:bg-primary-500/10 px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
                              title="View details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {(item.status === "FAILED" || item.status === "DLQ") && (
                              <button
                                onClick={() => retryNotification(item.notificationId)}
                                className="flex items-center gap-1 text-xs font-medium text-error-600 hover:bg-error-500/10 px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
                                title="Retry notification"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Retry
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
