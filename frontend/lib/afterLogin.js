// What happens right after a customer logs in or signs up.
import { api } from "./api";
import { getPending, safeNext } from "./guestFlow";

export async function finishLogin(router, next) {
  const pending = getPending();
  if (pending?.analysisId && pending.openContactAfterLogin) {
    try {
      await api(`/analyses/${pending.analysisId}/claim`, { method: "POST" });
    } catch {
      /* expired or already someone else's: the contact page explains */
    }
    try {
      sessionStorage.setItem("nixie_pending", JSON.stringify({ analysisId: pending.analysisId, openContactAfterLogin: 0 }));
    } catch {}
    router.replace(`/contact?analysis=${pending.analysisId}`);
    return;
  }
  router.replace(safeNext(next, "/"));
}
