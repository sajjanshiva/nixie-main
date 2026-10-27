// One small helper for every call to the backend.
// The browser always calls /api/... on this same site; next.config.mjs forwards it to Render.
// Cookies (login) are sent automatically.

export class ApiError extends Error {
  constructor({ status, code, message, fields, extra }) {
    super(message || "Something went wrong. Please try again.");
    this.status = status;
    this.code = code || "UNKNOWN";
    this.fields = fields || null; // { fieldName: "message" } for VALIDATION_ERROR
    this.extra = extra || {}; // e.g. retryAfterSeconds, attemptsLeft
  }
}

/**
 * api("/auth/login", { method: "POST", body: { email, password } })
 * api("/analyses", { method: "POST", body: formData })   // multipart: pass FormData
 */
export async function api(path, { method = "GET", body, signal } = {}) {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: "include",
      headers: body && !isForm ? { "Content-Type": "application/json" } : undefined,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
      signal,
      cache: "no-store",
    });
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    throw new ApiError({ status: 0, code: "NETWORK", message: "Can't reach Nixie right now. Check your connection and try again." });
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const e = data?.error || {};
    const { code, message, fields, ...extra } = e;
    if (res.status === 413 && !code) {
      throw new ApiError({ status: 413, code: "UPLOAD_ERROR", message: "This photo is too large. Please use one under 10 MB." });
    }
    throw new ApiError({
      status: res.status,
      code: code || (res.status >= 500 ? "SERVER_ERROR" : "ERROR"),
      message: message || (res.status >= 500 ? "Something went wrong. Please try again." : "Request failed."),
      fields,
      extra,
    });
  }
  return data;
}
