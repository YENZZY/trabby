import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { useTrabby } from '../../store/useTrabby';

export type SensorStatus = 'idle' | 'granted' | 'denied' | 'unavailable';

// 걸음 센서 연결. enabled(첫 실행 안내를 마침)가 되면 권한을 물어보고 걸음을 세요.
//  · iOS: 앱을 꺼 둔 동안의 걸음도 다시 열 때 반영해요 (기기가 최근 7일 기록을 갖고 있어요)
//  · 안드로이드: 앱이 켜진 동안만 세요 (꺼 둔 동안은 Health Connect 연동이 필요해요 → docs 참고)
export function usePedometer(enabled: boolean) {
  const addSteps = useTrabby((s) => s.addSteps);
  const setLastSeen = useTrabby((s) => s.setLastSeen);
  const [status, setStatus] = useState<SensorStatus>('idle');
  const subRef = useRef<{ remove: () => void } | null>(null);
  const lastWrite = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const stop = () => { subRef.current?.remove(); subRef.current = null; };

    const start = async () => {
      stop();
      if (!(await Pedometer.isAvailableAsync())) { if (alive) setStatus('unavailable'); return; }
      const perm = await Pedometer.requestPermissionsAsync();
      if (!perm.granted) { if (alive) setStatus('denied'); return; }
      if (alive) setStatus('granted');

      if (Platform.OS === 'ios') {
        const since = useTrabby.getState().lastSeenAt;
        if (since > 0) {
          const from = new Date(Math.max(since, Date.now() - 7 * 24 * 3600 * 1000));
          try {
            const r = await Pedometer.getStepCountAsync(from, new Date());
            if (r.steps > 0) addSteps(r.steps);
          } catch {}
        }
      }
      setLastSeen(Date.now());

      let last = 0;
      subRef.current = Pedometer.watchStepCount((r: { steps: number }) => {
        const delta = r.steps - last;
        last = r.steps;
        if (delta <= 0) return;
        addSteps(delta);
        if (Date.now() - lastWrite.current > 5000) { lastWrite.current = Date.now(); setLastSeen(Date.now()); } // 저장은 5초에 한 번만
      });
    };

    start();
    const sub = AppState.addEventListener('change', (st: string) => {
      if (st === 'active') start();
      else { stop(); setLastSeen(Date.now()); }
    });
    return () => { alive = false; sub.remove(); stop(); };
  }, [enabled]);

  return { status };
}
