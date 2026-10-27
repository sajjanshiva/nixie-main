// Keeps the last analysis results in memory (not in browser storage) so the result page
// opens instantly after an upload. The page still loads from the server on a refresh.
const cache = new Map();
export const putAnalysis = (a) => a?.id && cache.set(a.id, a);
export const getAnalysis = (id) => cache.get(id) || null;
