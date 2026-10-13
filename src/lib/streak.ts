// 연속 걷기: 하루 목표 걸음(DAILY_GOAL)을 채운 날이 며칠 이어졌는지
export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 오늘 목표를 채웠으면 오늘부터, 아직이면 어제부터 거꾸로 세요 (오늘은 하루가 끝나기 전까지 끊기지 않아요)
export function streakOf(log: Record<string, number>, goal: number, now: Date = new Date()) {
  const d = new Date(now);
  let n = (log[dayKey(d)] ?? 0) >= goal ? 1 : 0;
  d.setDate(d.getDate() - 1);
  while ((log[dayKey(d)] ?? 0) >= goal) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
