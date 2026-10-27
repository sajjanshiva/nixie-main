// Server-side fetch (used only by server components, e.g. the gallery pages for Google
// and link previews). Calls the Render backend directly.

const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:4000").replace(/\/+$/, "");

/** Returns parsed JSON, or null if the backend is unreachable / returns an error. */
export async function serverGet(path, { revalidate = 60, timeoutMs = 8000 } = {}) {
  try {
    const res = await fetch(`${BACKEND_URL}/api${path}`, {
      next: { revalidate },
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return { __status: res.status };
    return await res.json();
  } catch {
    return null;
  }
}
