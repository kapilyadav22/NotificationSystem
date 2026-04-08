import { useState } from "react";
import { Bell } from "lucide-react";
import PageHeader from "../layout/PageHeader";
import SendNotificationCard from "../notifications/SendNotificationCard";
import NotificationStatusCard from "../notifications/NotificationStatusCard";
import AdminNotificationsCard from "../notifications/AdminNotificationsCard";

export default function NotificationsTab({ apiRequest }) {
  const [lastNotificationId, setLastNotificationId] = useState("");

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Send notifications, track delivery status, and manage all notifications."
        icon={Bell}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <SendNotificationCard
          apiRequest={apiRequest}
          onNotificationId={setLastNotificationId}
        />
        <NotificationStatusCard
          apiRequest={apiRequest}
          lastNotificationId={lastNotificationId}
        />
      </div>

      <AdminNotificationsCard apiRequest={apiRequest} />
    </div>
  );
}
