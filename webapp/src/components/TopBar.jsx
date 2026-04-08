export default function TopBar({ apiBaseUrl, setApiBaseUrl }) {
  return (
    <header className="topbar">
      <div>
        <h1>Notification System Console</h1>
        <p>Phase 1 to Phase 6 simulator for API, async delivery, templates, admin and observability.</p>
      </div>
      <label className="field">
        <span>API Base URL</span>
        <input value={apiBaseUrl} onChange={(e) => setApiBaseUrl(e.target.value)} />
      </label>
    </header>
  );
}
