import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LINE_DATA } from '../data';
import { metrics, DAILY_GOAL } from '../lib/progress';
import { dayKey, streakOf } from '../lib/streak';

export type Settings = { nickname: string; arrivalAlert: boolean; extAlert: boolean; theme: string; character: string; sound: boolean; haptic: boolean };

type State = {
  activeLine: number; // 지금 걷는 노선 (한 번에 하나만)
  stepsByLine: Record<number, number>; // 노선별 저장된 걸음 수 (노선을 바꿔도 유지)
  cleared: Record<number, boolean>;
  legendUnlocked: boolean; // 모든 코스를 완주해 전설 캐릭터를 받았는지 (코스가 늘어나도 유지)
  clearedMeters: Record<number, number>; // 완주했을 때의 노선 길이(m) — 나중에 역이 늘었는지 비교용
  todaySteps: number;
  todayDate: string;
  onboarded: boolean; // 첫 실행 안내를 마쳤는지
  lastSeenAt: number; // 마지막으로 걸음을 확인한 시각 (iOS 에서 꺼 둔 동안의 걸음을 따라잡는 데 써요)
  dayLog: Record<string, number>; // 날짜별 걸음 수 (연속 걷기 계산용, 최근 120일)
  bestStreak: number; // 지금까지 최고 연속 일수 (한 번 얻은 뱃지·테마는 유지)
  settings: Settings;
  setSetting: <K extends keyof Settings>(k: K, v: Settings[K]) => void;
  addSteps: (n: number) => void;
  finishOnboarding: () => void;
  setLastSeen: (t: number) => void;
  selectLine: (id: number) => void;
  claim: () => void;
  reset: () => void;
};

export const useTrabby = create<State>()(
  persist(
    (set) => ({
      activeLine: 3,
      stepsByLine: {},
      cleared: {},
      legendUnlocked: false,
      clearedMeters: {},
      todaySteps: 0,
      todayDate: '',
      onboarded: false,
      lastSeenAt: 0,
      dayLog: {},
      bestStreak: 0,
      settings: { nickname: '트라비러버', arrivalAlert: true, extAlert: true, theme: 'sky', character: 'turtle', sound: true, haptic: true },
      setSetting: (k, v) => set((s) => ({ settings: { ...s.settings, [k]: v } })),
      addSteps: (n) =>
        set((s) => {
          const now = new Date();
          const d = now.toDateString();
          const today = { todaySteps: (s.todayDate === d ? s.todaySteps : 0) + n, todayDate: d };
          // 날짜별 걸음 기록과 최고 연속 일수 (오래된 기록은 120일만 남겨요)
          const key = dayKey(now);
          const merged = { ...(s.dayLog ?? {}), [key]: ((s.dayLog ?? {})[key] ?? 0) + n };
          const keep = Object.keys(merged).sort().slice(-120);
          const dayLog: Record<string, number> = {};
          keep.forEach((k) => { dayLog[k] = merged[k]; });
          const log = { dayLog, bestStreak: Math.max(s.bestStreak ?? 0, streakOf(dayLog, DAILY_GOAL, now)) };
          // 완주했고 새 구간도 없을 때만 더 쌓지 않아요 (역이 늘면 이어서 걸을 수 있어요)
          const total = metrics(LINE_DATA[s.activeLine]).total;
          const cm = s.clearedMeters[s.activeLine];
          if (s.cleared[s.activeLine] && (cm === undefined || cm >= total - 1)) return { ...today, ...log };
          return { ...today, ...log, stepsByLine: { ...s.stepsByLine, [s.activeLine]: (s.stepsByLine[s.activeLine] ?? 0) + n } };
        }),
      finishOnboarding: () => set({ onboarded: true }),
      setLastSeen: (t) => set({ lastSeenAt: t }),
      selectLine: (id) => set({ activeLine: id }),
      claim: () =>
        set((s) => {
          const cleared = { ...s.cleared, [s.activeLine]: true };
          const all = Object.keys(LINE_DATA).map(Number).every((id) => cleared[id]);
          return {
            cleared,
            clearedMeters: { ...s.clearedMeters, [s.activeLine]: metrics(LINE_DATA[s.activeLine]).total },
            legendUnlocked: s.legendUnlocked || all,
          };
        }),
      reset: () => set({ activeLine: 3, stepsByLine: {}, cleared: {}, legendUnlocked: false, clearedMeters: {}, todaySteps: 0, dayLog: {}, bestStreak: 0 }),
    }),
    { name: 'trabby-v2', storage: createJSONStorage(() => AsyncStorage) }
  )
);
