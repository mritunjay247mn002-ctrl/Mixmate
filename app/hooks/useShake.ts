import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';

/**
 * Fires `onShake` when the device is shaken sharply.
 * Debounced so a single shake doesn't trigger repeatedly.
 */
export function useShake(onShake: () => void, threshold = 1.6) {
  const last = useRef(0);
  const sub = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const available = await Accelerometer.isAvailableAsync();
        if (!available || !active) return;
        Accelerometer.setUpdateInterval(120);
        sub.current = Accelerometer.addListener(({ x, y, z }) => {
          const mag = Math.sqrt(x * x + y * y + z * z);
          const now = Date.now();
          if (mag > threshold && now - last.current > 900) {
            last.current = now;
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success
            ).catch(() => {});
            onShake();
          }
        });
      } catch {
        // sensor unavailable; silently noop
      }
    })();
    return () => {
      active = false;
      sub.current?.remove();
      sub.current = null;
    };
  }, [onShake, threshold]);
}
