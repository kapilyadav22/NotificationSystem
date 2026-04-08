import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Returns a debounced version of the value.
 * Updates only after `delay` ms of no changes.
 * Use for search inputs to avoid filtering on every keystroke.
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/**
 * Returns a debounced callback that fires at most once per `delay` ms.
 * Useful for search input onChange handlers.
 */
export function useDebouncedCallback(callback, delay = 300) {
  const timerRef = useRef(null);

  const debounced = useCallback(
    (...args) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return debounced;
}

/**
 * Returns a throttled callback that fires at most once per `delay` ms.
 * Use for button clicks (send, load, retry) to prevent rapid re-firing.
 */
export function useThrottle(callback, delay = 1000) {
  const lastCallRef = useRef(0);
  const timerRef = useRef(null);

  const throttled = useCallback(
    (...args) => {
      const now = Date.now();
      const remaining = delay - (now - lastCallRef.current);

      if (remaining <= 0) {
        lastCallRef.current = now;
        callback(...args);
      } else if (!timerRef.current) {
        // Schedule trailing call
        timerRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          timerRef.current = null;
          callback(...args);
        }, remaining);
      }
    },
    [callback, delay]
  );

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return throttled;
}
