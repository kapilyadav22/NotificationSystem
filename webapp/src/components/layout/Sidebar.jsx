import { Bell, Server, Settings } from "lucide-react";

const tabs = [
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "templates", label: "Templates", icon: Settings },
  { id: "preferences", label: "Preferences", icon: Settings },
  { id: "actuator", label: "Actuator", icon: Server },
  { id: "metrics", label: "Metrics", icon: Server },
];

export default function Sidebar({ activeTab, onTabChange, apiBaseUrl, setApiBaseUrl }) {
  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-surface-950 text-white">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center animate-pulse-glow">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Notif Console</h1>
            <p className="text-[11px] text-surface-400 font-medium">v1.0 — System Dashboard</p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer
                ${active
                  ? "bg-primary-600/20 text-primary-300 shadow-lg shadow-primary-900/20"
                  : "text-surface-400 hover:bg-surface-800/60 hover:text-surface-200"
                }`}
            >
              <Icon className={`w-[18px] h-[18px] ${active ? "text-primary-400" : ""}`} />
              {tab.label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* API Base URL */}
      <div className="p-4 border-t border-surface-800/50">
        <label className="block text-xs text-surface-500 font-medium mb-1.5 uppercase tracking-wider">
          API Base URL
        </label>
        <input
          type="text"
          value={apiBaseUrl}
          onChange={(e) => setApiBaseUrl(e.target.value)}
          className="w-full bg-surface-800/60 border border-surface-700/50 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/40 transition-all"
          placeholder="http://localhost:8080"
        />
      </div>
    </aside>
  );
}
