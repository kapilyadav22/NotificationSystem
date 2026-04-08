import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const ICON_COLORS = {
  success: "text-emerald-500",
  error: "text-red-500",
  warning: "text-amber-500",
  info: "text-blue-500",
};

const PROGRESS_COLORS = {
  success: "bg-emerald-400",
  error: "bg-red-400",
  warning: "bg-amber-400",
  info: "bg-blue-400",
};

let toastId = 0;
let externalAddToast = null;

/**
 * Lightweight toast — call from anywhere, no context needed.
 */
export function showToast(icon = "info", title = "", text = "") {
  externalAddToast?.({ id: ++toastId, icon, title, text });
}

function SingleToast({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const Icon = ICONS[toast.icon] || ICONS.info;
  const duration = 3500;

  useEffect(() => {
    const start = Date.now();
    const frame = () => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct > 0) raf = requestAnimationFrame(frame);
    };
    let raf = requestAnimationFrame(frame);

    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, duration);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [toast.id, onRemove, duration]);

  function dismiss() {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  }

  return (
    <div
      className={`
        relative flex items-start gap-3 w-[380px] max-w-[90vw] px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm
        transition-all duration-300 overflow-hidden
        ${COLORS[toast.icon] || COLORS.info}
        ${exiting ? "opacity-0 translate-y-[-12px] scale-95" : "opacity-100 translate-y-0 scale-100"}
      `}
      style={{ animation: exiting ? "none" : "toast-in 0.3s ease-out" }}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${ICON_COLORS[toast.icon] || ICON_COLORS.info}`} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold leading-snug">{toast.title}</p>
        )}
        {toast.text && (
          <p className="text-xs opacity-80 mt-0.5 leading-snug break-words">{toast.text}</p>
        )}
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 p-0.5 rounded-md hover:bg-black/5 transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5 opacity-50" />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/5">
        <div
          className={`h-full ${PROGRESS_COLORS[toast.icon] || PROGRESS_COLORS.info} transition-none`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Mount this once at the root of your app. It renders the toast container.
 */
export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((t) => {
    setToasts((prev) => {
      // Keep max 4 visible at once
      const next = [t, ...prev];
      return next.length > 4 ? next.slice(0, 4) : next;
    });
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Register the external function so showToast() works from anywhere
  useEffect(() => {
    externalAddToast = addToast;
    return () => { externalAddToast = null; };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <SingleToast toast={t} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
}
