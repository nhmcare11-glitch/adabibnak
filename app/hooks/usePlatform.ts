import { useEffect, useState } from "react";

export function usePlatform() {
  const [isNative, setIsNative] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function detect() {
      try {
        const { Capacitor } = await import("@capacitor/core");
        setIsNative(Capacitor.isNativePlatform());
      } catch {
        setIsNative(false);
      } finally {
        setIsLoading(false);
      }
    }
    detect();
  }, []);

  return { isNative, isLoading };
}