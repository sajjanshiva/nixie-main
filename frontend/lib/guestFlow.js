// The guest → login → contact flow (only IDs are stored in the browser, never prices).
//  1. A guest runs an analysis and clicks "Contact us".
//  2. We remember the analysis id + "open the contact form after login".
//  3. After login the analysis is linked to the account, then /contact?analysis=<id> opens.
//  4. After the form is sent, this is cleared.

const KEY = "nixie_pending";
const GUEST_RUNS_KEY = "nixie_guest_runs"; // timestamps of guest analyses (soft limit)

export function setPendingContact(analysisId) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ analysisId, openContactAfterLogin: 1 }));
  } catch {}
}
export function getPending() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}
export function clearPending() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}

/** Soft browser-side guest limit (the real limit is on the server). */
export function recordGuestRun() {
  try {
    const runs = guestRuns();
    runs.push(Date.now());
    localStorage.setItem(GUEST_RUNS_KEY, JSON.stringify(runs));
  } catch {}
}
export function guestRuns() {
  try {
    const day = 24 * 60 * 60 * 1000;
    const runs = JSON.parse(localStorage.getItem(GUEST_RUNS_KEY) || "[]");
    return Array.isArray(runs) ? runs.filter((t) => Date.now() - t < day) : [];
  } catch {
    return [];
  }
}

/** Only allow same-site relative paths for ?next= redirects. */
export function safeNext(next, fallback = "/") {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
