import { useEffect, useState } from "react";

/**
 * Debounce a value by the specified delay (in milliseconds).
 * Returns the debounced value that only updates after the delay has elapsed
 * since the last change.
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export { useDebounce };
