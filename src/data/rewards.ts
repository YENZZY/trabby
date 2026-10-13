import { LINE_GROUPS, LINE_DATA } from './index';

// 보상 규칙
//  · 노선(본선) 완주                         → 그 노선 색 테마 (settings/themes.ts)
//  · 코스가 여러 개인 노선의 "전 코스" 완주   → 그 노선 캐릭터 (1호선 4개, 2호선 3개, 5호선 2개 코스)
//  · 앱의 모든 코스 완주                      → 전설 캐릭터 (한 번 받으면 코스가 늘어나도 유지: store 의 legendUnlocked)
// 캐릭터를 늘리려면 코스가 여러 개인 노선(routes.json 의 group)을 만들고 아래에 한 줄 추가하세요.
// 그림은 임시로 이모지를 써요 (나중에 일러스트로 교체).
export type Character = { id: string; name: string; emoji: string; group?: string; legendary?: boolean };
export const CHARACTERS: Character[] = [
  { id: 'turtle', name: '기본 트라비', emoji: '🐢' },
  { id: 'tiger', name: '호랑이 트라비', emoji: '🐯', group: '1호선' }, // 코스 4개 (경부선 포함)
  { id: 'cat', name: '고양이 트라비', emoji: '🐱', group: '2호선' }, // 코스 3개
  { id: 'bear', name: '곰 트라비', emoji: '🐻', group: '5호선' }, // 코스 2개
  { id: 'dragon', name: '전설의 용 트라비', emoji: '🐉', legendary: true }, // 모든 코스 완주
];

const idsOf = (group: string) => LINE_GROUPS.find((g) => g.name === group)?.ids ?? [];

// 그 노선의 본선을 완주했는지 (테마 해금 조건)
export const mainCleared = (group: string, cleared: Record<number, boolean>) =>
  idsOf(group).some((id) => LINE_DATA[id].line.kind !== 'extra' && cleared[id]);

// 그 노선의 모든 코스를 완주했는지 (캐릭터 해금 조건). 코스가 하나뿐인 노선은 해당 없음
export const allCoursesCleared = (group: string, cleared: Record<number, boolean>) =>
  idsOf(group).length > 1 && idsOf(group).every((id) => cleared[id]);

export const charUnlocked = (c: Character, cleared: Record<number, boolean>, legendUnlocked = false) =>
  c.legendary ? legendUnlocked : !c.group || allCoursesCleared(c.group, cleared);
