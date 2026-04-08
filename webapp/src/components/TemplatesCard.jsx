import { startTransition, useState } from "react";
import { CHANNELS } from "../constants";
import { pretty } from "../lib/http";

export default function TemplatesCard({ apiRequest, onResult }) {
  const [templateFormId, setTemplateFormId] = useState("ORDER_CONFIRMATION");
  const [templateFormChannel, setTemplateFormChannel] = useState("EMAIL");
  const [templateContent, setTemplateContent] = useState("Hi {{name}}, your order {{orderId}} is confirmed.");
  const [templates, setTemplates] = useState([]);

  async function upsertTemplate(event) {
    event.preventDefault();
    const result = await apiRequest("/admin/templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: templateFormId,
        channel: templateFormChannel,
        content: templateContent
      })
    });
    onResult(pretty(result));
  }

  async function loadTemplates() {
    const result = await apiRequest("/admin/templates");
    startTransition(() => {
      setTemplates(Array.isArray(result.data) ? result.data : []);
    });
    onResult(pretty(result));
  }

  return (
    <article className="card">
      <h2>Templates</h2>
      <form onSubmit={upsertTemplate} className="stack">
        <label className="field">
          <span>Template ID</span>
          <input value={templateFormId} onChange={(e) => setTemplateFormId(e.target.value)} />
        </label>
        <label className="field">
          <span>Channel</span>
          <select value={templateFormChannel} onChange={(e) => setTemplateFormChannel(e.target.value)}>
            {CHANNELS.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Content</span>
          <textarea value={templateContent} onChange={(e) => setTemplateContent(e.target.value)} rows={4} />
        </label>
        <div className="actions">
          <button type="submit">Upsert Template</button>
          <button type="button" onClick={loadTemplates}>Load Templates</button>
        </div>
      </form>
      <div className="list">
        {templates.map((tpl) => (
          <div key={`${tpl.templateId}-${tpl.channel}`} className="pill">
            <strong>{tpl.templateId}</strong> [{tpl.channel}]
          </div>
        ))}
      </div>
    </article>
  );
}
