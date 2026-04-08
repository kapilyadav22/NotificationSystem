import { useState } from "react";
import { UserCog, Save, Download, Mail, MessageCircle, Smartphone } from "lucide-react";
import { pretty } from "../../lib/http";
import { handleApiResult, showToast } from "../../lib/alert";
import PageHeader from "../layout/PageHeader";

export default function PreferencesTab({ apiRequest }) {
  const [prefUserId, setPrefUserId] = useState("u1");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  async function upsertPreferences(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await apiRequest(`/preferences/${prefUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailEnabled, smsEnabled, pushEnabled }),
      });
      handleApiResult(pretty(result));
    } catch (err) {
      showToast("error", "Network error", err.message);
    } finally {
      setSaving(false);
    }
  }

  async function getPreferences() {
    setLoading(true);
    try {
      const result = await apiRequest(`/preferences/${prefUserId}`);
      if (result.data) {
        if (result.data.emailEnabled !== undefined) setEmailEnabled(result.data.emailEnabled);
        if (result.data.smsEnabled !== undefined) setSmsEnabled(result.data.smsEnabled);
        if (result.data.pushEnabled !== undefined) setPushEnabled(result.data.pushEnabled);
      }
      handleApiResult(pretty(result));
    } catch (err) {
      showToast("error", "Network error", err.message);
    } finally {
      setLoading(false);
    }
  }

  const channels = [
    { key: "email", label: "Email", icon: Mail, enabled: emailEnabled, toggle: setEmailEnabled, color: "from-blue-500 to-indigo-500" },
    { key: "sms", label: "SMS", icon: MessageCircle, enabled: smsEnabled, toggle: setSmsEnabled, color: "from-green-500 to-emerald-500" },
    { key: "push", label: "Push", icon: Smartphone, enabled: pushEnabled, toggle: setPushEnabled, color: "from-purple-500 to-violet-500" },
  ];

  return (
    <div>
      <PageHeader
        title="User Preferences"
        description="Manage notification channel preferences for individual users."
        icon={UserCog}
      />

      <div className="max-w-xl">
        <div className="glass-card rounded-2xl p-6 shadow-lg shadow-surface-200/50 animate-fade-in-up">
          <form onSubmit={upsertPreferences} className="space-y-5">
            {/* User ID */}
            <div>
              <label className="block text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5">
                User ID
              </label>
              <input
                type="text"
                value={prefUserId}
                onChange={(e) => setPrefUserId(e.target.value)}
                className="w-full bg-white/60 border border-surface-200 rounded-xl px-3.5 py-2.5 text-sm text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
                placeholder="Enter user ID"
              />
            </div>

            {/* Channel Toggles */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-surface-500 uppercase tracking-wider">
                Channel Preferences
              </label>
              {channels.map(({ key, label, icon: Icon, enabled, toggle, color }) => (
                <div
                  key={key}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200
                    ${enabled
                      ? "bg-white border-surface-200 shadow-sm"
                      : "bg-surface-50/60 border-surface-200/60"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center ${enabled ? "opacity-100" : "opacity-40"} transition-opacity`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${enabled ? "text-surface-800" : "text-surface-400"} transition-colors`}>
                        {label}
                      </p>
                      <p className="text-[11px] text-surface-400">
                        {enabled ? "Notifications enabled" : "Notifications disabled"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(!enabled)}
                    className={`relative w-11 h-6 rounded-full transition-all duration-300 cursor-pointer
                      ${enabled ? "bg-primary-500" : "bg-surface-300"}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300
                        ${enabled ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all disabled:opacity-60 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={getPreferences}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-surface-100 hover:bg-surface-200 text-surface-700 font-semibold py-2.5 rounded-xl transition-all disabled:opacity-60 cursor-pointer"
              >
                <Download className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Loading…" : "Load"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
