import { useState } from "react";
import {
  Activity, Heart, RefreshCw, CheckCircle, XCircle, Loader,
  Database, Server, Wifi, Radio, Copy,
} from "lucide-react";
import { showToast } from "../../lib/alert";
import PageHeader from "../layout/PageHeader";

function CopyButton({ text }) {
  function handleCopy() {
    navigator.clipboard.writeText(text);
    showToast("success", "Copied to clipboard");
  }
  return (
    <button onClick={handleCopy} className="p-1 hover:bg-surface-200 rounded transition-colors cursor-pointer" title="Copy">
      <Copy className="w-3 h-3 text-surface-400" />
    </button>
  );
}

export default function ActuatorTab({ apiRequest }) {
  const [healthData, setHealthData] = useState(null);
  const [rawData, setRawData] = useState("");
  const [loading, setLoading] = useState(false);
  const [infoData, setInfoData] = useState(null);
  const [rawInfoData, setRawInfoData] = useState("");
  const [loadingInfo, setLoadingInfo] = useState(false);

  async function loadHealth() {
    setLoading(true);
    try {
      const result = await apiRequest("/actuator/health");
      setHealthData(result.data);
      setRawData(JSON.stringify(result.data, null, 2));
      showToast("success", "Health data loaded");
    } catch (err) {
      showToast("error", "Network error", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadInfo() {
    setLoadingInfo(true);
    try {
      const result = await apiRequest("/actuator/info");
      setInfoData(result.data);
      setRawInfoData(JSON.stringify(result.data, null, 2));
      showToast("success", "Info data loaded");
    } catch (err) {
      showToast("error", "Network error", err.message);
    } finally {
      setLoadingInfo(false);
    }
  }

  const overallStatus = healthData?.status;
  const statusIcon = overallStatus === "UP"
    ? <CheckCircle className="w-5 h-5 text-success-600" />
    : overallStatus === "DOWN"
    ? <XCircle className="w-5 h-5 text-error-600" />
    : <Loader className="w-5 h-5 text-surface-400" />;

  const statusColor = overallStatus === "UP"
    ? "bg-success-500/10 text-success-600 border-success-500/20"
    : overallStatus === "DOWN"
    ? "bg-error-500/10 text-error-600 border-error-500/20"
    : "bg-surface-100 text-surface-500 border-surface-200";

  const components = healthData?.components ? Object.entries(healthData.components) : [];

  function getComponentIcon(name) {
    const n = name.toLowerCase();
    if (n.includes("db") || n.includes("mysql") || n.includes("datasource")) return Database;
    if (n.includes("kafka")) return Radio;
    if (n.includes("redis")) return Wifi;
    if (n.includes("disk")) return Server;
    return Activity;
  }

  return (
    <div>
      <PageHeader
        title="Actuator"
        description="Monitor application health (MySQL, Kafka, Redis) and app info."
        icon={Activity}
      />

      {/* Exposed Endpoints Info */}
      <div className="glass-card rounded-2xl p-4 shadow-lg shadow-surface-200/50 mb-5 animate-fade-in-up">
        <p className="text-xs text-surface-500 mb-2 font-medium uppercase tracking-wider">Exposed Actuator Endpoints</p>
        <div className="flex flex-wrap gap-2">
          {["health", "info", "metrics"].map((ep) => (
            <span key={ep} className="text-[11px] font-mono text-primary-700 bg-primary-50 border border-primary-200/40 px-2.5 py-1 rounded-lg">
              /actuator/{ep}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Health Check */}
        <div className="glass-card rounded-2xl p-5 shadow-lg shadow-surface-200/50 animate-fade-in-up" style={{ animationDelay: "0.03s" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-surface-800 uppercase tracking-wide">
                Health Check
              </h3>
            </div>
            <button
              onClick={loadHealth}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Loading…" : "Check Health"}
            </button>
          </div>

          {/* Overall Status Badge */}
          {overallStatus && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border mb-4 ${statusColor}`}>
              {statusIcon}
              <span className="text-sm font-bold">{overallStatus}</span>
            </div>
          )}

          {/* Component breakdown */}
          {components.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider mb-1">Infrastructure Components</p>
              {components.map(([name, comp]) => {
                const Icon = getComponentIcon(name);
                return (
                  <div
                    key={name}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-50/80 border border-surface-200/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-surface-500" />
                      <div>
                        <span className="text-sm font-medium text-surface-700 capitalize">{name}</span>
                        {/* Show Kafka details */}
                        {comp.details?.bootstrapServers && (
                          <p className="text-[10px] text-surface-400">{comp.details.bootstrapServers}</p>
                        )}
                        {comp.details?.nodeCount !== undefined && (
                          <p className="text-[10px] text-surface-400">{comp.details.nodeCount} node(s)</p>
                        )}
                        {/* Show DB details */}
                        {comp.details?.database && (
                          <p className="text-[10px] text-surface-400">{comp.details.database}</p>
                        )}
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      comp.status === "UP"
                        ? "text-success-600 bg-success-500/10"
                        : "text-error-600 bg-error-500/10"
                    }`}>
                      {comp.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Raw output */}
          {rawData && (
            <div className="relative">
              <div className="absolute top-2 right-2"><CopyButton text={rawData} /></div>
              <pre className="bg-surface-900 text-emerald-300 rounded-xl p-4 text-xs overflow-auto max-h-52 font-mono">
                {rawData}
              </pre>
            </div>
          )}

          {!healthData && !loading && (
            <div className="text-center py-10">
              <Heart className="w-10 h-10 text-surface-300 mx-auto mb-3" />
              <p className="text-sm text-surface-400">Click Check Health to query the actuator</p>
              <p className="text-xs text-surface-400 mt-1">Shows MySQL, Kafka, Redis + disk status</p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="glass-card rounded-2xl p-5 shadow-lg shadow-surface-200/50 animate-fade-in-up" style={{ animationDelay: "0.06s" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-surface-800 uppercase tracking-wide">
                App Info
              </h3>
            </div>
            <button
              onClick={loadInfo}
              disabled={loadingInfo}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingInfo ? "animate-spin" : ""}`} />
              {loadingInfo ? "Loading…" : "Load Info"}
            </button>
          </div>

          {/* Structured info display */}
          {infoData?.app && (
            <div className="space-y-2 mb-4">
              {Object.entries(infoData.app).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-surface-50/80 border border-surface-200/60">
                  <span className="text-xs font-medium text-surface-500 uppercase">{key}</span>
                  <span className="text-sm font-semibold text-surface-800">{String(val)}</span>
                </div>
              ))}
            </div>
          )}

          {rawInfoData ? (
            <div className="relative">
              <div className="absolute top-2 right-2"><CopyButton text={rawInfoData} /></div>
              <pre className="bg-surface-900 text-sky-300 rounded-xl p-4 text-xs overflow-auto max-h-64 font-mono">
                {rawInfoData}
              </pre>
            </div>
          ) : (
            <div className="text-center py-10">
              <Activity className="w-10 h-10 text-surface-300 mx-auto mb-3" />
              <p className="text-sm text-surface-400">Click Load Info to query /actuator/info</p>
              <p className="text-xs text-surface-400 mt-1">Shows app name, phase, and build info</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
