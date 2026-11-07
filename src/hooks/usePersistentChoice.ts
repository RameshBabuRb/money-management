import { useCallback, useState } from 'react';

/**
 * A small remembered choice — which tab, which scope. Kept out of the main
 * store because losing it costs nothing and it should never reach a backup.
 */
export function usePersistentChoice<T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = window.localStorage.getItem(key) as T | null;
      return saved && allowed.includes(saved) ? saved : fallback;
    } catch {
      return fallback;
    }
  });

  const choose = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, next);
      } catch {
        // Remembering it is a nicety, not worth a warning.
      }
    },
    [key],
  );

  return [value, choose];
}
