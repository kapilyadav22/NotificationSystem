export function pretty(value) {
  return JSON.stringify(value, null, 2);
}

async function parseJsonResponse(response) {
  const text = await response.text();
  let data = text;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // Keep raw text fallback.
  }
  return { ok: response.ok, status: response.status, data };
}

export function createApiRequest(apiBaseUrl) {
  return async function apiRequest(path, options = {}) {
    const response = await fetch(`${apiBaseUrl}${path}`, options);
    return parseJsonResponse(response);
  };
}
