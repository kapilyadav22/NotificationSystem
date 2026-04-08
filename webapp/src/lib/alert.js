import Swal from "sweetalert2";
import { showToast } from "../components/ui/Toast";

export { showToast };


export function showAlert(icon, title, html) {
  Swal.fire({
    icon,
    title,
    html,
    background: "#ffffff",
    color: "#1e293b",
    confirmButtonColor: "#6366f1",
    customClass: {
      popup: "!rounded-2xl !shadow-2xl",
      title: "!text-lg !font-semibold",
      confirmButton: "!rounded-xl !font-medium !px-6",
    },
  });
}

/**
 * Parse an API result and show the appropriate toast.
 */
export function handleApiResult(payload) {
  if (typeof payload !== "string") {
    showToast("info", "Response received");
    return;
  }

  const trimmed = payload.trim();
  if (!trimmed) {
    showToast("info", "No response content");
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    const lower = trimmed.toLowerCase();
    const icon = lower.includes("invalid") || lower.includes("error") ? "error" : "info";
    showToast(icon, trimmed.length > 80 ? trimmed.slice(0, 80) + "…" : trimmed);
    return;
  }

  const ok = parsed?.ok === true;
  const status = parsed?.status;
  const data = parsed?.data;

  if (ok) {
    if (data?.notificationId) {
      showToast("success", "Notification sent", `ID: ${data.notificationId} • Status ${status}`);
    } else {
      showToast("success", "Request successful", `Status ${status}`);
    }
  } else {
    const serverError = data?.error || data?.message;
    const msg = serverError
      ? `${serverError} (status ${status})`
      : `Request failed (status ${status})`;
    showToast("error", "Request failed", msg);
  }
}
