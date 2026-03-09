import { useCallback, useEffect, useMemo, useState } from "react";

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

export function usePersistentReorder<T extends { id: string }>(items: T[], storageKey: string) {
  const [orderedIds, setOrderedIds] = useState<string[]>([]);

  useEffect(() => {
    setOrderedIds(readStoredOrder(storageKey));
  }, [storageKey]);

  useEffect(() => {
    const itemIds = items.map((item) => item.id);
    setOrderedIds((prev) => {
      const current = prev.length > 0 ? prev : readStoredOrder(storageKey);
      const deduped = current.filter((id, index) => current.indexOf(id) === index);
      const preserved = deduped.filter((id) => itemIds.includes(id));
      const missing = itemIds.filter((id) => !preserved.includes(id));
      const next = [...preserved, ...missing];
      writeStoredOrder(storageKey, next);
      return next;
    });
  }, [items, storageKey]);

  const orderedItems = useMemo(() => {
    if (orderedIds.length === 0) return items;
    const indexMap = new Map(orderedIds.map((id, index) => [id, index]));
    return [...items].sort((a, b) => {
      const aIndex = indexMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const bIndex = indexMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return aIndex - bIndex;
    });
  }, [items, orderedIds]);

  const handleReorder = useCallback(
    (nextOrderedItems: T[]) => {
      const nextVisibleIds = nextOrderedItems.map((item) => item.id);
      const remainingIds = orderedItems
        .map((item) => item.id)
        .filter((id) => !nextVisibleIds.includes(id));
      const nextIds = [...nextVisibleIds, ...remainingIds];
      setOrderedIds(nextIds);
      writeStoredOrder(storageKey, nextIds);
    },
    [orderedItems, storageKey]
  );

  return { orderedItems, handleReorder };
}
