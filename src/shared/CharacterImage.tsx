import React, { useEffect, useState } from 'react';
import { Image, Text } from 'react-native';
import Svg from 'react-native-svg';
import { Turtle, type Pose } from './Turtle';
import { CHARACTERS } from '../data/rewards';
import { CHARACTER_ART } from '../data/generated/characterArt';

export type CharState = 'idle' | 'walk' | 'cheer'; // 대기 / 걷는 중 / 도착·기쁨

// 캐릭터 그림 하나를 그려요.
// 그림 우선순위: ① 상태 그림(<id>_walk*.png, <id>_cheer.png) → ② 대기 그림(<id>.png) → ③ 기본 거북이는 상태별 SVG 자세 → ④ 이모지
export function CharacterImage({ id, size = 40, color = '#F26B1D', state = 'idle' }: { id: string; size?: number; color?: string; state?: CharState }) {
  const art = CHARACTER_ART[id];
  const frames = art?.walk;
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (state !== 'walk') { setFrame(0); return; }
    const n = frames && frames.length >= 2 ? frames.length : 2; // 걷기 그림이 여러 장이면 번갈아, 아니면 거북이 자세 2개를 번갈아
    const t = setInterval(() => setFrame((f) => (f + 1) % n), frames && frames.length >= 2 ? 220 : 260);
    return () => clearInterval(t);
  }, [state, frames]);

  const src = state === 'cheer' ? art?.cheer ?? art?.idle : state === 'walk' ? frames?.[frame % (frames.length || 1)] ?? art?.idle : art?.idle;
  if (src) return <Image source={src} style={{ width: size, height: size }} resizeMode="contain" />;

  const c = CHARACTERS.find((x) => x.id === id) ?? CHARACTERS[0];
  if (c.id === 'turtle') {
    const pose: Pose = state === 'cheer' ? 'cheer' : state === 'walk' ? (frame % 2 ? 'walk2' : 'walk1') : 'idle';
    return (
      <Svg width={size} height={size * 0.97} viewBox="-34 -46 68 66">
        <Turtle x={0} y={0} color={color} pose={pose} />
      </Svg>
    );
  }
  return <Text style={{ fontSize: size * 0.8 }}>{c.emoji}</Text>;
}

// 이 상태 전용 그림이 있는지 (없으면 코드로 움직임을 줘요)
export const hasStateArt = (id: string, state: CharState) => {
  const a = CHARACTER_ART[id];
  return state === 'walk' ? !!a?.walk?.length : state === 'cheer' ? !!a?.cheer : !!a?.idle;
};
