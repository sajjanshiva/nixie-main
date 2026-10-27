"use client";
// Loads an admin list (?page=1,2…) for the given filters, with "Load more".
import { useCallback, useEffect, useRef, useState } from "react";
import { adminApi } from "@/lib/adminApi";

export default function usePagedList(path, key, params) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reqId = useRef(0);
  const paramString = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== "" && v != null)).toString();

  const load = useCallback(
    async (p) => {
      const id = ++reqId.current;
      setLoading(true);
      setError("");
      try {
        const qs = new URLSearchParams(paramString);
        qs.set("page", String(p));
        const d = await adminApi(`${path}?${qs}`);
        if (id !== reqId.current) return;
        setItems((list) => (p === 1 ? d[key] : [...list, ...d[key]]));
        setHasMore(!!d.hasMore);
        setPage(p);
      } catch (e) {
        if (id === reqId.current) setError(e.message);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [path, key, paramString]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  return { items, setItems, loading, error, hasMore, loadMore: () => load(page + 1), reload: () => load(1) };
}
