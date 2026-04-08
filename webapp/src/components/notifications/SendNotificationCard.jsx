import { useCallback, useState } from "react";
import { Send, Key, MessageSquare, FileText, Zap, Fingerprint, BugPlay, ShieldAlert } from "lucide-react";
import { CHANNELS } from "../../constants";
import { pretty } from "../../lib/http";
import { handleApiResult, showToast } from "../../lib/alert";
import { useThrottle } from "../../hooks/usePerformance";

export default function SendNotificationCard({ apiRequest, onNotificationId }) {
  const [userId, setUserId] = useState("u1");
  const [channel, setChannel] = useState("EMAIL");
  const [messageMode, setMessageMode] = useState("RAW");
  const [message, setMessage] = useState("Hello from React console");
  const [templateId, setTemplateId] = useState("");
  const [variablesText, setVariablesText] = useState('{ "name": "Kapil", "orderId": "A123" }');
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [sending, setSending] = useState(false);
  const [runningRateTest, setRunningRateTest] = useState(false);

  const doSend = useCallback(async () => {
    // Client-side validation matching backend @Valid constraints
    if (!userId.trim()) {
      showToast("warning", "User ID is required");
      return;
    }
    if (userId.trim().length > 100) {
      showToast("warning", "User ID must be ≤ 100 characters");
      return;
    }
    if (messageMode === "RAW" && message.length > 1000) {
      showToast("warning", "Message must be ≤ 1000 characters");
      return;
    }
    if (messageMode === "TEMPLATE" && templateId.trim().length > 100) {
      showToast("warning", "Template ID must be ≤ 100 characters");
      return;
    }

    setSending(true);

    const payload = { userId: userId.trim(), channel };
    if (messageMode === "RAW") {
      payload.message = message;
    } else {
      payload.templateId = templateId.trim();
      try {
        payload.variables = variablesText ? JSON.parse(variablesText) : {};
      } catch {
        showToast("error", "Invalid JSON", "Template variables JSON is malformed");
        setSending(false);
        return;
      }
    }

    const headers = { "Content-Type": "application/json" };
    if (idempotencyKey.trim()) {
      headers["Idempotency-Key"] = idempotencyKey.trim();
    }

    try {
      const result = await apiRequest("/notifications", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (result.data?.notificationId) {
        onNotificationId(result.data.notificationId);
      }
      handleApiResult(pretty(result));
    } catch (err) {
      showToast("error", "Network error", err.message);
    } finally {
      setSending(false);
    }
  }, [userId, channel, messageMode, message, templateId, variablesText, idempotencyKey, apiRequest, onNotificationId]);

  // Throttle send to 500ms to prevent accidental double clicks while allowing rate-limit tests
  const throttledSend = useThrottle(doSend, 500);

  function handleSubmit(event) {
    event.preventDefault();
    throttledSend();
  }

  function generateIdempotencyKey() {
    const key = crypto.randomUUID();
    setIdempotencyKey(key);
    showToast("info", "Generated key", key.slice(0, 20) + "…");
  }

  async function runRateLimitDemo() {
    if (sending || runningRateTest) {
      return;
    }
    setRunningRateTest(true);
    const demoUserId = "u_throttle_test";
    setUserId(demoUserId);
    setChannel("EMAIL");
    setMessageMode("RAW");
    setIdempotencyKey("");

    let acceptedCount = 0;
    let rejected429Count = 0;
    let lastNotificationId = "";

    for (let i = 1; i <= 6; i += 1) {
      try {
        const result = await apiRequest("/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: demoUserId,
            channel: "EMAIL",
            message: `RATE_LIMIT_DEMO_${i}`,
          }),
        });

        if (result.ok) {
          acceptedCount += 1;
          if (result.data?.notificationId) {
            lastNotificationId = result.data.notificationId;
          }
        } else if (result.status === 429) {
          rejected429Count += 1;
        }
      } catch (error) {
        showToast("error", "Rate-limit demo failed", error.message);
        setRunningRateTest(false);
        return;
      }
    }

    if (lastNotificationId) {
      onNotificationId(lastNotificationId);
    }

    if (rejected429Count > 0) {
      showToast(
        "success",
        "429 demo complete",
        `Accepted: ${acceptedCount}, Rejected(429): ${rejected429Count}`
      );
    } else {
      showToast(
        "warning",
        "No 429 observed",
        `Accepted: ${acceptedCount}. Wait 60s and run again.`
      );
    }
    setRunningRateTest(false);
  }

  return (
    <div className="glass-card rounded-2xl p-5 shadow-lg shadow-surface-200/50 animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
            <Send className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-surface-800 uppercase tracking-wide">
            Send Notification
          </h3>
        </div>
      </div>

      {/* Rate Limit Warning */}
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200/60 mb-4 text-[11px]">
        <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span className="text-amber-700">
          <strong>Rate limit:</strong> 5 requests/min per user ·
{/*           <strong>Throttle:</strong> 1 send/0.5s in UI */}
        </span>
      </div>

      {/* Test Scenarios */}
      <div className="flex items-center gap-2 mb-4 p-2.5 rounded-lg border border-red-200 bg-red-50/50">
        <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest px-1">TEST:</span>
        <button
          type="button"
          onClick={() => {
            setChannel("EMAIL");
            setMessageMode("RAW");
            setMessage("DLQ_DEMO");
            setIdempotencyKey("");
            showToast("warning", "Ready for DLQ", "Click Send. It will retry 3 times and then move to DLQ.");
          }}
          className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer"
        >
          <BugPlay className="w-3 h-3" />
          Simulate DLQ
        </button>
        <button
          type="button"
          onClick={() => {
            setChannel("EMAIL");
            setMessageMode("RAW");
            setMessage("FAILED_DEMO");
            setIdempotencyKey("");
            showToast("warning", "Ready for FAILED", "Click Send. It will stay FAILED and you can retry from Admin.");
          }}
          className="flex items-center gap-1 bg-rose-100 hover:bg-rose-200 text-rose-700 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer"
        >
          <ShieldAlert className="w-3 h-3" />
          Simulate FAILED
        </button>
        <button
          type="button"
          onClick={() => {
            setChannel("EMAIL");
            setMessageMode("RAW");
            setMessage("PENDING_DEMO");
            setIdempotencyKey("");
            showToast("warning", "Ready for PENDING", "Click Send. Notification will stay in PENDING state.");
          }}
          className="flex items-center gap-1 bg-sky-100 hover:bg-sky-200 text-sky-700 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer"
        >
          <BugPlay className="w-3 h-3" />
          Simulate PENDING
        </button>
        <button
          type="button"
          onClick={runRateLimitDemo}
          disabled={runningRateTest || sending}
          className="flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-700 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors cursor-pointer"
        >
          <ShieldAlert className="w-3 h-3" />
          {runningRateTest ? "Running 429..." : "Simulate 429"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* User ID + Channel in row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5">
              User ID <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              maxLength={100}
              required
              className="w-full bg-white/60 border border-surface-200 rounded-xl px-3.5 py-2 text-sm text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
              placeholder="e.g. u1"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5">
              Channel <span className="text-error-500">*</span>
            </label>
            <div className="flex gap-1.5">
              {CHANNELS.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannel(ch)}
                  className={`flex-1 px-2 py-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer
                    ${channel === ch
                      ? "bg-primary-600 text-white shadow-md shadow-primary-300/30"
                      : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                    }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payload Mode */}
        <div>
          <label className="block text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5">
            Payload Mode
          </label>
          <div className="flex gap-2">
            {[
              { value: "RAW", label: "Raw Message", icon: MessageSquare },
              { value: "TEMPLATE", label: "Template", icon: FileText },
            ].map(({ value, label, icon: Ic }) => (
              <button
                key={value}
                type="button"
                onClick={() => setMessageMode(value)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer
                  ${messageMode === value
                    ? "bg-surface-800 text-white shadow-md"
                    : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                  }`}
              >
                <Ic className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Message / Template fields */}
        {messageMode === "RAW" ? (
          <div>
            <label className="flex items-center justify-between text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5">
              <span>Message</span>
              <span className="text-[10px] text-surface-400 normal-case tracking-normal">{message.length}/1000</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              maxLength={1000}
              className="w-full bg-white/60 border border-surface-200 rounded-xl px-3.5 py-2 text-sm text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all resize-none"
              placeholder="Enter notification message"
            />
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5">
                Template ID <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                maxLength={100}
                className="w-full bg-white/60 border border-surface-200 rounded-xl px-3.5 py-2 text-sm text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
                placeholder="e.g. ORDER_CONFIRMATION"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5">
                Variables JSON
              </label>
              <textarea
                value={variablesText}
                onChange={(e) => setVariablesText(e.target.value)}
                rows={2}
                className="w-full bg-white/60 border border-surface-200 rounded-xl px-3.5 py-2 text-sm font-mono text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all resize-none"
                placeholder='{ "key": "value" }'
              />
            </div>
          </>
        )}

        {/* Idempotency Key — prominent section */}
        <div className="p-3 rounded-xl bg-violet-50/60 border border-violet-200/40">
          <label className="flex items-center justify-between text-xs font-medium text-surface-600 uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5 text-violet-500" />
              Idempotency Key
            </span>
            <button
              type="button"
              onClick={generateIdempotencyKey}
              className="text-[10px] font-semibold text-violet-600 hover:text-violet-700 bg-violet-100 hover:bg-violet-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer normal-case tracking-normal"
            >
              Auto-generate
            </button>
          </label>
          <input
            type="text"
            value={idempotencyKey}
            onChange={(e) => setIdempotencyKey(e.target.value)}
            maxLength={128}
            className="w-full bg-white/80 border border-violet-200/60 rounded-lg px-3 py-2 text-sm text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-300 transition-all font-mono"
            placeholder="Prevents duplicate sends for 24h (optional)"
          />
          <p className="text-[10px] text-violet-500/70 mt-1">
            Sent as <code className="text-[10px] bg-violet-100 px-1 py-0.5 rounded">Idempotency-Key</code> header. Same key = same notification, no duplicates.
          </p>
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all duration-200 disabled:opacity-60 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          {sending ? "Sending…" : "Send Notification"}
        </button>
      </form>
    </div>
  );
}
