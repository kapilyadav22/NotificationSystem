import { useState } from "react";
import { pretty } from "../lib/http";

export default function ActuatorCard({ apiRequest, onResult }) {
  const [healthData, setHealthData] = useState("");

  async function loadHealth() {
    const result = await apiRequest("/actuator/health");
    const formatted = pretty(result);
    setHealthData(formatted);
    onResult(formatted);
  }

  return (
    <article className="card">
      <h2>Actuator</h2>
      <div className="stack">
        <button onClick={loadHealth}>Load Health</button>
        <pre>{healthData}</pre>
      </div>
    </article>
  );
}
