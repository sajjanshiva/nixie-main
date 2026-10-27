"use client";
// Loads a paged list (?page=1,2,3…) with a "Load more" button.
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function usePaged(path, key) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    async (p) => {
      setLoading(true);
      setError("");
      try {
        const data = await api(`${path}?page=${p}`);
        setItems((list) => (p === 1 ? data[key] : [...list, ...data[key]]));
        setHasMore(!!data.hasMore);
        setPage(p);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [path, key]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  return { items, loading, error, hasMore, loadMore: () => load(page + 1), retry: () => load(page) };
}
