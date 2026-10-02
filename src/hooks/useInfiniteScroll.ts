"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export function useInfiniteScroll(onLoadMore: () => void, hasMore: boolean) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [loading, setLoading] = useState(false);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !hasMore) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && hasMore && !loading) {
            setLoading(true);
            Promise.resolve(onLoadMore()).finally(() => setLoading(false));
          }
        },
        { rootMargin: "200px" }
      );
      observerRef.current.observe(node);
    },
    [onLoadMore, hasMore, loading]
  );

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  return { sentinelRef, loading };
}
