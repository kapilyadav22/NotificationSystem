import { Bell, Server, Settings, Menu, X } from "lucide-react";
import { useState } from "react";

const tabs = [
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "templates", label: "Templates", icon: Settings },
  { id: "preferences", label: "Preferences", icon: Settings },
  { id: "actuator", label: "Actuator", icon: Server },
  { id: "metrics", label: "Metrics", icon: Server },
];

export default function MobileHeader({ activeTab, onTabChange, apiBaseUrl, setApiBaseUrl }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const currentTab = tabs.find((t) => t.id === activeTab);

  return (
    <div className="lg:hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-surface-950 text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold">Notif Console</span>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg hover:bg-surface-800 transition-colors"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Slide down menu */}
      {menuOpen && (
        <div className="bg-surface-900 border-b border-surface-800 px-4 py-3 space-y-1 animate-fade-in">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  setMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${active
                    ? "bg-primary-600/20 text-primary-300"
                    : "text-surface-400 hover:bg-surface-800 hover:text-surface-200"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-surface-800 mt-2">
            <label className="block text-xs text-surface-500 font-medium mb-1 uppercase tracking-wider">
              API Base URL
            </label>
            <input
              type="text"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              placeholder="http://localhost:8080"
            />
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="px-4 py-2 bg-surface-50 border-b border-surface-200 flex items-center gap-2 text-sm">
        <span className="text-surface-400">Dashboard</span>
        <span className="text-surface-300">/</span>
        <span className="font-medium text-surface-700">{currentTab?.label}</span>
      </div>
    </div>
  );
}
