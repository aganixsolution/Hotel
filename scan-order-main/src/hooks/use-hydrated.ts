import { useEffect, useState } from "react";

/** True after the first client render — use to gate UI that depends on localStorage. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
