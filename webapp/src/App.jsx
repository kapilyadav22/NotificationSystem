import { lazy, Suspense, useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import MobileHeader from "./components/layout/MobileHeader";
import ToastContainer from "./components/ui/Toast";
import { createApiRequest } from "./lib/http";
import { Loader } from "lucide-react";

// Lazy-load all tab components for code-splitting
const NotificationsTab = lazy(() => import("./components/tabs/NotificationsTab"));
const TemplatesTab = lazy(() => import("./components/tabs/TemplatesTab"));
const PreferencesTab = lazy(() => import("./components/tabs/PreferencesTab"));
const ActuatorTab = lazy(() => import("./components/tabs/ActuatorTab"));
const MetricsTab = lazy(() => import("./components/tabs/MetricsTab"));

function TabFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex items-center gap-3 text-surface-400">
        <Loader className="w-5 h-5 animate-spin" />
        <span className="text-sm font-medium">Loading…</span>
      </div>
    </div>
  );
}

export default function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState("http://localhost:8080");
  const [activeTab, setActiveTab] = useState("notifications");

  const apiRequest = createApiRequest(apiBaseUrl);

  function renderTab() {
    switch (activeTab) {
      case "notifications":
        return <NotificationsTab apiRequest={apiRequest} />;
      case "templates":
        return <TemplatesTab apiRequest={apiRequest} />;
      case "preferences":
        return <PreferencesTab apiRequest={apiRequest} />;
      case "actuator":
        return <ActuatorTab apiRequest={apiRequest} />;
      case "metrics":
        return <MetricsTab apiRequest={apiRequest} />;
      default:
        return <NotificationsTab apiRequest={apiRequest} />;
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-surface-50 via-white to-primary-50/30">
      <ToastContainer />
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        apiBaseUrl={apiBaseUrl}
        setApiBaseUrl={setApiBaseUrl}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <MobileHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          apiBaseUrl={apiBaseUrl}
          setApiBaseUrl={setApiBaseUrl}
        />

        {/* Content Area */}
        <main className="flex-1 p-5 lg:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <Suspense fallback={<TabFallback />}>
              {renderTab()}
            </Suspense>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-surface-200/60 px-5 lg:px-8 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-surface-400">
            <span>Notification System Console v1.0</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
              Connected to {apiBaseUrl}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
