import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { BarChart3, Search, RefreshCw, TrendingUp, Hash, Gauge } from "lucide-react";
import { showToast } from "../../lib/alert";
import { useDebounce } from "../../hooks/usePerformance";
import PageHeader from "../layout/PageHeader";

// Custom metrics from NotificationMetrics.java + standard actuator
const COMMON_METRICS = [
  { name: "notifications.accepted.total", label: "Accepted", group: "Notifications" },
  { name: "notifications.sent.total", label: "Sent", group: "Notifications" },
  { name: "notifications.failed.total", label: "Failed", group: "Notifications" },
  { name: "notifications.retried.total", label: "Retried", group: "Notifications" },
  { name: "notifications.dlq.total", label: "DLQ", group: "Notifications" },
  { name: "notifications.delivery.latency", label: "Delivery Latency", group: "Notifications" },
  { name: "jvm.memory.used", label: "JVM Memory Used", group: "JVM" },
  { name: "jvm.memory.max", label: "JVM Memory Max", group: "JVM" },
  { name: "jvm.threads.live", label: "Live Threads", group: "JVM" },
  { name: "system.cpu.usage", label: "CPU Usage", group: "System" },
  { name: "process.uptime", label: "Uptime", group: "System" },
  { name: "http.server.requests", label: "HTTP Requests", group: "HTTP" },
];

const METRIC_GROUPS = [...new Set(COMMON_METRICS.map((m) => m.group))];

export default function MetricsTab({ apiRequest }) {
  const [metricName, setMetricName] = useState("notifications.sent.total");
  const [metricData, setMetricData] = useState(null);
  const [rawData, setRawData] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableMetrics, setAvailableMetrics] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Dashboard: load multiple key metrics at once
  const [dashboard, setDashboard] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  async function loadMetric() {
    if (!metricName.trim()) {
      showToast("warning", "Enter a metric name");
      return;
    }
    setLoading(true);
    try {
      const result = await apiRequest(`/actuator/metrics/${metricName.trim()}`);
      setMetricData(result.data);
      setRawData(JSON.stringify(result.data, null, 2));
      showToast("success", "Metric loaded", metricName);
    } catch (err) {
      showToast("error", "Network error", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableMetrics() {
    setLoadingList(true);
    try {
      const result = await apiRequest("/actuator/metrics");
      const names = result.data?.names || [];
      setAvailableMetrics(names);
      showToast("success", `${names.length} metrics found`);
    } catch (err) {
      showToast("error", "Network error", err.message);
    } finally {
      setLoadingList(false);
    }
  }

  async function loadDashboard() {
    setLoadingDashboard(true);
    const dashboardMetrics = [
      "notifications.accepted.total",
      "notifications.sent.total",
      "notifications.failed.total",
      "notifications.retried.total",
      "notifications.dlq.total",
    ];
    const results = [];
    for (const name of dashboardMetrics) {
      try {
        const result = await apiRequest(`/actuator/metrics/${name}`);
        const value = result.data?.measurements?.[0]?.value;
        results.push({ name, label: name.split(".").slice(1, -1).join(" "), value: value ?? "—" });
      } catch {
        results.push({ name, label: name.split(".").slice(1, -1).join(" "), value: "—" });
      }
    }
    setDashboard(results);
    setLoadingDashboard(false);
    showToast("success", "Dashboard refreshed");
  }

  const debouncedSearch = useDebounce(searchQuery, 250);

  const filteredMetrics = useMemo(() =>
    availableMetrics.filter((m) =>
      m.toLowerCase().includes(debouncedSearch.toLowerCase())
    ),
    [availableMetrics, debouncedSearch]
  );

  const metricsListRef = useRef(null);
  const metricsVirtualizer = useVirtualizer({
    count: filteredMetrics.length,
    getScrollElement: () => metricsListRef.current,
    estimateSize: () => 32,
    overscan: 15,
  });

  const measurements = metricData?.measurements || [];
  const tags = metricData?.availableTags || [];

  function getDashboardColor(name) {
    if (name.includes("sent")) return "from-emerald-500 to-green-500";
    if (name.includes("accepted")) return "from-blue-500 to-indigo-500";
    if (name.includes("failed")) return "from-red-500 to-rose-500";
    if (name.includes("retried")) return "from-amber-500 to-orange-500";
    if (name.includes("dlq")) return "from-rose-600 to-red-600";
    return "from-primary-500 to-primary-600";
  }

  return (
    <div>
      <PageHeader
        title="Metrics"
        description="Explore custom notification metrics, JVM stats, and Spring Boot Actuator counters."
        icon={BarChart3}
      />

      {/* Quick Dashboard */}
      <div className="glass-card rounded-2xl p-5 shadow-lg shadow-surface-200/50 mb-5 animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Gauge className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-surface-800 uppercase tracking-wide">
              Notification Dashboard
            </h3>
          </div>
          <button
            onClick={loadDashboard}
            disabled={loadingDashboard}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingDashboard ? "animate-spin" : ""}`} />
            {loadingDashboard ? "Loading…" : "Refresh Dashboard"}
          </button>
        </div>

        {dashboard.length === 0 ? (
          <div className="text-center py-6">
            <Gauge className="w-8 h-8 text-surface-300 mx-auto mb-2" />
            <p className="text-sm text-surface-400">Click Refresh Dashboard to load key notification counters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {dashboard.map((d) => (
              <button
                key={d.name}
                onClick={() => setMetricName(d.name)}
                className="p-4 rounded-xl bg-gradient-to-br from-surface-50 to-white border border-surface-200/60 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer text-left"
              >
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getDashboardColor(d.name)} mb-2`} />
                <p className="text-[10px] font-medium text-surface-400 uppercase tracking-wider mb-0.5 line-clamp-1">
                  {d.label}
                </p>
                <p className="text-xl font-bold text-surface-800 tracking-tight">
                  {typeof d.value === "number" ? d.value.toLocaleString() : d.value}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Metric Query */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 shadow-lg shadow-surface-200/50 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-surface-800 uppercase tracking-wide">
              Query Metric
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5">
                <Hash className="w-3 h-3" /> Metric Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={metricName}
                  onChange={(e) => setMetricName(e.target.value)}
                  className="flex-1 bg-white/60 border border-surface-200 rounded-xl px-3.5 py-2.5 text-sm text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
                  placeholder="e.g. notifications.sent.total"
                />
                <button
                  onClick={loadMetric}
                  disabled={loading}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-indigo-700 hover:to-purple-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-60 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  Load
                </button>
              </div>
            </div>

            {/* Quick Access by Group */}
            {METRIC_GROUPS.map((group) => (
              <div key={group}>
                <label className="block text-[10px] font-semibold text-surface-400 uppercase tracking-wider mb-1.5">
                  {group}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_METRICS.filter((m) => m.group === group).map((m) => (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => setMetricName(m.name)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all cursor-pointer
                        ${metricName === m.name
                          ? "bg-primary-600 text-white shadow-sm"
                          : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                        }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Measurement Cards */}
            {measurements.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-surface-500 uppercase tracking-wider mb-2">
                  Measurements
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {measurements.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-gradient-to-br from-surface-50 to-white border border-surface-200/60 shadow-sm"
                    >
                      <p className="text-[11px] font-medium text-surface-400 uppercase tracking-wider mb-1">
                        {m.statistic}
                      </p>
                      <p className="text-2xl font-bold text-surface-800 tracking-tight">
                        {typeof m.value === "number" ? m.value.toLocaleString(undefined, { maximumFractionDigits: 4 }) : m.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Tags (channel breakdown) */}
            {tags.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-surface-500 uppercase tracking-wider mb-2">
                  Available Tags (filter by channel, etc.)
                </label>
                <div className="space-y-2">
                  {tags.map((tag) => (
                    <div key={tag.tag} className="p-3 rounded-xl bg-surface-50/80 border border-surface-200/60">
                      <span className="text-xs font-semibold text-surface-700">{tag.tag}:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {tag.values.map((val) => (
                          <span
                            key={val}
                            className="text-[11px] font-medium text-primary-700 bg-primary-100/60 px-2 py-0.5 rounded-full"
                          >
                            {val}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metric description and base unit */}
            {metricData?.description && (
              <p className="text-xs text-surface-500 italic">
                {metricData.description}
                {metricData.baseUnit && <span className="ml-1">(unit: {metricData.baseUnit})</span>}
              </p>
            )}

            {/* Raw output */}
            {rawData && (
              <div>
                <label className="block text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5">
                  Raw Response
                </label>
                <pre className="bg-surface-900 text-violet-300 rounded-xl p-4 text-xs overflow-auto max-h-52 font-mono">
                  {rawData}
                </pre>
              </div>
            )}

            {!metricData && !loading && (
              <div className="text-center py-8">
                <BarChart3 className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                <p className="text-sm text-surface-400">Select a metric and click Load to view data</p>
              </div>
            )}
          </div>
        </div>

        {/* Available Metrics Browser */}
        <div className="glass-card rounded-2xl p-5 shadow-lg shadow-surface-200/50 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-surface-800 uppercase tracking-wide">
                Browse
              </h3>
            </div>
            <button
              onClick={loadAvailableMetrics}
              disabled={loadingList}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? "animate-spin" : ""}`} />
              {loadingList ? "…" : "Fetch"}
            </button>
          </div>

          {availableMetrics.length > 0 && (
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter metrics…"
                  className="w-full bg-white/60 border border-surface-200 rounded-xl pl-9 pr-3 py-2 text-xs text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
                />
              </div>
              <p className="text-[10px] text-surface-400 mt-1.5">{filteredMetrics.length} of {availableMetrics.length} metrics</p>
            </div>
          )}

          <div ref={metricsListRef} className="max-h-[480px] overflow-auto">
            {availableMetrics.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-8 h-8 text-surface-300 mx-auto mb-2" />
                <p className="text-xs text-surface-400">Click Fetch to browse all metrics</p>
              </div>
            ) : (
              <div
                style={{
                  height: `${metricsVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {metricsVirtualizer.getVirtualItems().map((virtualRow) => {
                  const m = filteredMetrics[virtualRow.index];
                  return (
                    <button
                      key={m}
                      className={`absolute top-0 left-0 w-full text-left text-xs px-3 py-2 rounded-lg transition-all cursor-pointer
                        ${metricName === m
                          ? "bg-primary-600 text-white font-semibold"
                          : "text-surface-600 hover:bg-surface-100"
                        }`}
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      onClick={() => setMetricName(m)}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
