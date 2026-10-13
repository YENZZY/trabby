import React from 'react';
import { G, Ellipse, Circle, Path } from 'react-native-svg';

// 거북이 트라비 자세: idle(서 있기) / walk1·walk2(다리 번갈아 걷기) / cheer(두 팔 들고 활짝 웃기)
export type Pose = 'idle' | 'walk1' | 'walk2' | 'cheer';

export function Turtle({ x, y, color, pose = 'idle' }: { x: number; y: number; color: string; pose?: Pose }) {
  const skin = '#9BDB8E';
  const legL = pose === 'walk1' ? { cx: -15, cy: 15 } : pose === 'walk2' ? { cx: -11, cy: 11 } : { cx: -13, cy: 14 };
  const legR = pose === 'walk1' ? { cx: 11, cy: 11 } : pose === 'walk2' ? { cx: 15, cy: 15 } : { cx: 13, cy: 14 };
  const cheer = pose === 'cheer';
  return (
    <G transform={`translate(${x},${y})`}>
      {cheer && (
        <>
          <Ellipse cx={-25} cy={-1} rx={6.5} ry={3.6} fill={skin} transform="rotate(-40 -25 -1)" />
          <Ellipse cx={25} cy={-1} rx={6.5} ry={3.6} fill={skin} transform="rotate(40 25 -1)" />
        </>
      )}
      <Ellipse cx={legL.cx} cy={legL.cy} rx={7} ry={5} fill={skin} />
      <Ellipse cx={legR.cx} cy={legR.cy} rx={7} ry={5} fill={skin} />
      <Ellipse cx={0} cy={4} rx={21} ry={17} fill={color} stroke="#fff" strokeWidth={3} />
      <Path d="M-8 -2 L0 -8 L8 -2 L5 8 L-5 8 Z" fill="#fff" opacity={0.35} />
      <Circle cx={0} cy={-19} r={13} fill={skin} stroke="#fff" strokeWidth={3} />
      {cheer ? (
        <>
          <Path d="M-8.5 -19 Q-5 -24 -1.5 -19" stroke="#3A2F26" strokeWidth={2} fill="none" strokeLinecap="round" />
          <Path d="M1.5 -19 Q5 -24 8.5 -19" stroke="#3A2F26" strokeWidth={2} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <Circle cx={-5} cy={-20} r={2.4} fill="#3A2F26" />
          <Circle cx={5} cy={-20} r={2.4} fill="#3A2F26" />
          <Circle cx={-4.4} cy={-20.8} r={0.8} fill="#fff" />
          <Circle cx={5.6} cy={-20.8} r={0.8} fill="#fff" />
        </>
      )}
      <Circle cx={-9} cy={-15} r={2.6} fill="#FFB3A7" opacity={0.8} />
      <Circle cx={9} cy={-15} r={2.6} fill="#FFB3A7" opacity={0.8} />
      {cheer ? (
        <Path d="M-4.5 -14 Q0 -7 4.5 -14 Z" fill="#E5484D" />
      ) : (
        <Path d="M-3 -14.5 Q0 -11.5 3 -14.5" stroke="#3A2F26" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      )}
      <Path d="M0 -32 Q-7 -40 -1 -42 Q4 -38 0 -32 Z" fill="#3DBE6B" />
    </G>
  );
}
