import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function readStoredOrder(key: string): string[] {
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeStoredOrder(key: string, ids: string[]) {
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // no-op
  }
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function usePersistentReorder<T extends { id: string }>(items: T[], storageKey: string) {
  const [orderedIds, setOrderedIds] = useState<string[]>(() => readStoredOrder(storageKey));

  // Stable signature of item IDs to avoid re-running effect on every render
  const itemIdsSignature = useMemo(() => items.map((item) => item.id).join(","), [items]);

  useEffect(() => {
    const itemIds = itemIdsSignature.split(",").filter(Boolean);
    if (itemIds.length === 0) return;

    setOrderedIds((prev) => {
      const current = prev.length > 0 ? prev : readStoredOrder(storageKey);
      const deduped = current.filter((id, index) => current.indexOf(id) === index);
      const preserved = deduped.filter((id) => itemIds.includes(id));
      const missing = itemIds.filter((id) => !preserved.includes(id));
      const next = [...preserved, ...missing];

      // Only update if order actually changed
      if (arraysEqual(prev, next)) return prev;

      writeStoredOrder(storageKey, next);
      return next;
    });
  }, [itemIdsSignature, storageKey]);

  const orderedItems = useMemo(() => {
    if (orderedIds.length === 0) return items;
    const indexMap = new Map(orderedIds.map((id, index) => [id, index]));
    return [...items].sort((a, b) => {
      const aIndex = indexMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const bIndex = indexMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return aIndex - bIndex;
    });
  }, [items, orderedIds]);

  // Keep a ref to avoid stale closures in handleReorder
  const orderedIdsRef = useRef(orderedIds);
  orderedIdsRef.current = orderedIds;

  const handleReorder = useCallback(
    (nextOrderedItems: T[]) => {
      const nextVisibleIds = nextOrderedItems.map((item) => item.id);
      const currentIds = orderedIdsRef.current;
      const remainingIds = currentIds.filter((id) => !nextVisibleIds.includes(id));
      const nextIds = [...nextVisibleIds, ...remainingIds];

      // No-op if unchanged
      if (arraysEqual(currentIds, nextIds)) return;

      setOrderedIds(nextIds);
      writeStoredOrder(storageKey, nextIds);
    },
    [storageKey],
  );

  return { orderedItems, handleReorder };
}


