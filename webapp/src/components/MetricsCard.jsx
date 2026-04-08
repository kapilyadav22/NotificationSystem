import { useState } from "react";
import { pretty } from "../lib/http";

export default function MetricsCard({ apiRequest, onResult }) {
  const [metricName, setMetricName] = useState("notifications.sent.total");
  const [metricData, setMetricData] = useState("");

  async function loadMetric() {
    const result = await apiRequest(`/actuator/metrics/${metricName}`);
    const formatted = pretty(result);
    setMetricData(formatted);
    onResult(formatted);
  }

  return (
    <article className="card">
      <h2>Metrics</h2>
      <div className="stack">
        <label className="field">
          <span>Metric Name</span>
          <input value={metricName} onChange={(e) => setMetricName(e.target.value)} />
        </label>
        <button onClick={loadMetric}>Load Metric</button>
        <pre>{metricData}</pre>
      </div>
    </article>
  );
}
