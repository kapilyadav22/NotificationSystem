import { startTransition, useCallback, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDebounce } from "../../hooks/usePerformance";
import { FileText, Plus, Download, Hash, Type, Search, Clock, Trash2 } from "lucide-react";
import { CHANNELS } from "../../constants";
import { pretty } from "../../lib/http";
import { handleApiResult, showToast } from "../../lib/alert";
import PageHeader from "../layout/PageHeader";
import Swal from "sweetalert2";

function formatDateTime(dt) {
  if (!dt) return "—";
  try {
    const d = new Date(dt);
    return d.toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return String(dt);
  }
}

export default function TemplatesTab({ apiRequest }) {
  const [templateFormId, setTemplateFormId] = useState("ORDER_CONFIRMATION");
  const [templateFormChannel, setTemplateFormChannel] = useState("EMAIL");
  const [templateContent, setTemplateContent] = useState("Hi {{name}}, your order {{orderId}} is confirmed.");
  const [templates, setTemplates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Single template lookup
  const [lookupId, setLookupId] = useState("");
  const [lookupChannel, setLookupChannel] = useState("EMAIL");
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  async function upsertTemplate(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await apiRequest("/admin/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: templateFormId,
          channel: templateFormChannel,
          content: templateContent,
        }),
      });
      handleApiResult(pretty(result));
    } catch (err) {
      showToast("error", "Network error", err.message);
    } finally {
      setSaving(false);
    }
  }

  async function loadTemplates() {
    setLoadingList(true);
    try {
      const result = await apiRequest("/admin/templates");
      startTransition(() => {
        setTemplates(Array.isArray(result.data) ? result.data : []);
      });
      handleApiResult(pretty(result));
    } catch (err) {
      showToast("error", "Network error", err.message);
    } finally {
      setLoadingList(false);
    }
  }

  async function lookupTemplate() {
    if (!lookupId.trim()) {
      showToast("warning", "Enter template ID");
      return;
    }
    setLookupLoading(true);
    try {
      const result = await apiRequest(`/admin/templates/${lookupId.trim()}?channel=${lookupChannel}`);
      setLookupResult(result.data);
      handleApiResult(pretty(result));
    } catch (err) {
      showToast("error", "Lookup failed", err.message);
      setLookupResult(null);
    } finally {
      setLookupLoading(false);
    }
  }

  function loadIntoForm(tpl) {
    setTemplateFormId(tpl.templateId);
    setTemplateFormChannel(tpl.channel);
    setTemplateContent(tpl.content);
    showToast("info", "Loaded into form", `${tpl.templateId} [${tpl.channel}]`);
  }

  function showTemplateDetail(tpl) {
    Swal.fire({
      title: tpl.templateId,
      html: `
        <div style="text-align:left; font-size:13px; line-height:1.8;">
          <div><strong>Channel:</strong> ${tpl.channel}</div>
          <div><strong>DB ID:</strong> ${tpl.id || "—"}</div>
          <div style="margin-top:8px;"><strong>Content:</strong></div>
          <pre style="background:#f1f5f9;border-radius:8px;padding:10px;font-size:12px;white-space:pre-wrap;margin-top:4px;font-family:monospace;">${tpl.content}</pre>
          <div style="margin-top:8px;color:#94a3b8;font-size:11px;">
            Created: ${formatDateTime(tpl.createdAt)}<br/>
            Updated: ${formatDateTime(tpl.updatedAt)}
          </div>
        </div>
      `,
      confirmButtonColor: "#6366f1",
      customClass: { popup: "!rounded-2xl" },
      width: 520,
    });
  }

  const debouncedSearch = useDebounce(searchQuery, 250);

  const filteredTemplates = useMemo(() => {
    if (!debouncedSearch.trim()) return templates;
    const q = debouncedSearch.toLowerCase();
    return templates.filter((tpl) =>
      tpl.templateId?.toLowerCase().includes(q) ||
      tpl.channel?.toLowerCase().includes(q) ||
      tpl.content?.toLowerCase().includes(q)
    );
  }, [templates, debouncedSearch]);

  const templateListRef = useRef(null);
  const templateVirtualizer = useVirtualizer({
    count: filteredTemplates.length,
    getScrollElement: () => templateListRef.current,
    estimateSize: () => 110,
    overscan: 5,
  });

  // Extract used variables from content
  const extractVariables = useCallback((content) => {
    const matches = content?.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map((m) => m.replace(/[{}]/g, "")))];
  }, []);

  return (
    <div>
      <PageHeader
        title="Templates"
        description="Create, manage, and preview notification templates with dynamic {{variables}}."
        icon={FileText}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upsert Form */}
        <div className="space-y-5">
          <div className="glass-card rounded-2xl p-5 shadow-lg shadow-surface-200/50 animate-fade-in-up">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-surface-800 uppercase tracking-wide">
                Create / Update Template
              </h3>
            </div>

            <form onSubmit={upsertTemplate} className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5">
                  <Hash className="w-3 h-3" /> Template ID
                </label>
                <input
                  type="text"
                  value={templateFormId}
                  onChange={(e) => setTemplateFormId(e.target.value)}
                  maxLength={100}
                  className="w-full bg-white/60 border border-surface-200 rounded-xl px-3.5 py-2.5 text-sm text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
                  placeholder="e.g. ORDER_CONFIRMATION"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5">
                  Channel
                </label>
                <div className="flex gap-2">
                  {CHANNELS.map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setTemplateFormChannel(ch)}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer
                        ${templateFormChannel === ch
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-300/30"
                          : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                        }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-surface-500 uppercase tracking-wider mb-1.5">
                  <Type className="w-3 h-3" /> Content
                  <span className="text-surface-400 normal-case tracking-normal font-normal ml-1">
                    (max 4000 chars)
                  </span>
                </label>
                <textarea
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  rows={5}
                  maxLength={4000}
                  className="w-full bg-white/60 border border-surface-200 rounded-xl px-3.5 py-2.5 text-sm text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all resize-none font-mono"
                  placeholder="Hi {{name}}, your order {{orderId}} is confirmed."
                />
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    {extractVariables(templateContent).map((v) => (
                      <span key={v} className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-surface-400">
                    {templateContent.length}/4000
                  </span>
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all disabled:opacity-60 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {saving ? "Saving…" : "Upsert Template"}
              </button>
            </form>
          </div>

          {/* Lookup single template */}
          <div className="glass-card rounded-2xl p-5 shadow-lg shadow-surface-200/50 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                <Search className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-surface-800 uppercase tracking-wide">
                Lookup Template
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={lookupId}
                  onChange={(e) => setLookupId(e.target.value)}
                  placeholder="Template ID"
                  className="flex-1 bg-white/60 border border-surface-200 rounded-xl px-3 py-2 text-sm text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
                />
                <select
                  value={lookupChannel}
                  onChange={(e) => setLookupChannel(e.target.value)}
                  className="bg-white/60 border border-surface-200 rounded-xl px-3 py-2 text-sm text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all cursor-pointer"
                >
                  {CHANNELS.map((ch) => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={lookupTemplate}
                disabled={lookupLoading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 text-white font-semibold py-2 rounded-xl shadow-lg shadow-violet-500/25 transition-all disabled:opacity-60 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                {lookupLoading ? "Searching…" : "Fetch Template"}
              </button>
              {lookupResult && (
                <div className="p-3 rounded-xl bg-surface-50 border border-surface-200 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-surface-800">{lookupResult.templateId}</span>
                    <span className="text-[11px] font-bold text-primary-600 bg-primary-100/60 px-2.5 py-1 rounded-full">{lookupResult.channel}</span>
                  </div>
                  <pre className="text-xs text-surface-700 bg-surface-100 p-2.5 rounded-lg font-mono whitespace-pre-wrap">{lookupResult.content}</pre>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-surface-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDateTime(lookupResult.createdAt)}</span>
                    <button
                      onClick={() => loadIntoForm(lookupResult)}
                      className="text-primary-600 hover:text-primary-700 font-medium cursor-pointer"
                    >
                      Edit →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Templates List */}
        <div className="glass-card rounded-2xl p-5 shadow-lg shadow-surface-200/50 animate-fade-in-up" style={{ animationDelay: "0.08s" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <Download className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-surface-800 uppercase tracking-wide">
                Existing Templates
              </h3>
            </div>
            <button
              onClick={loadTemplates}
              disabled={loadingList}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              <Download className={`w-3.5 h-3.5 ${loadingList ? "animate-spin" : ""}`} />
              {loadingList ? "Loading…" : "Refresh"}
            </button>
          </div>

          {/* Search */}
          {templates.length > 0 && (
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates…"
                  className="w-full bg-white/60 border border-surface-200 rounded-xl pl-9 pr-3 py-2 text-xs text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
                />
              </div>
            </div>
          )}

          {templates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 text-surface-300 mx-auto mb-3" />
              <p className="text-sm text-surface-400">No templates loaded yet</p>
              <p className="text-xs text-surface-400 mt-1">Click Refresh to fetch from server</p>
            </div>
          ) : (
            <div ref={templateListRef} className="max-h-[520px] overflow-auto">
              <div
                style={{
                  height: `${templateVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {templateVirtualizer.getVirtualItems().map((virtualRow) => {
                  const tpl = filteredTemplates[virtualRow.index];
                  return (
                    <div
                      key={`${tpl.templateId}-${tpl.channel}`}
                      className="absolute top-0 left-0 w-full px-0.5"
                      style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <div
                        className="p-3 bg-surface-50/80 rounded-xl border border-surface-200/60 hover:border-primary-200 hover:bg-primary-50/30 transition-all group cursor-pointer mb-2"
                        onClick={() => showTemplateDetail(tpl)}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-sm font-semibold text-surface-800">{tpl.templateId}</p>
                          <span className="text-[11px] font-bold text-primary-600 bg-primary-100/60 px-2.5 py-1 rounded-full shrink-0">
                            {tpl.channel}
                          </span>
                        </div>
                        <p className="text-xs text-surface-500 line-clamp-2 font-mono">{tpl.content}</p>
                        <div className="flex items-center justify-between mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] text-surface-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(tpl.updatedAt)}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); loadIntoForm(tpl); }}
                            className="text-[10px] font-semibold text-primary-600 hover:text-primary-700 cursor-pointer"
                          >
                            Edit →
                          </button>
                        </div>
                        {extractVariables(tpl.content).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {extractVariables(tpl.content).map((v) => (
                              <span key={v} className="text-[9px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                {v}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
