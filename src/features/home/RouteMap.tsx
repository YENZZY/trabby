import React from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Circle, Rect, Text as SvgText } from 'react-native-svg';
import type { LineData } from '../../data';
import { locate } from '../../lib/progress';
import type { CharState } from '../../shared/CharacterImage';
import { Marker } from './Marker';

const W = 340;
const ROW = 84;
const CHUNK = 2800; // 역이 80개인 노선도 안 깨지게 지도를 세로로 나눠 그려요 (SVG 한 장이 너무 길면 기기에서 안 그려져요)
export const mapHeight = (n: number) => 90 + n * ROW;
const layout = (d: LineData) => d.stations.map((_, i) => ({ x: W / 2 + Math.sin(i * 1.1) * 70, y: 60 + i * ROW }));

export const yAt = (d: LineData, m: number) => {
  const p = layout(d);
  const { seg, t } = locate(d, m);
  return p[seg].y + (p[seg + 1].y - p[seg].y) * t;
};

const Tree = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <>
    <Rect x={x - 2 * s} y={y} width={4 * s} height={10 * s} rx={2} fill="#B98B5E" />
    <Circle cx={x} cy={y - 4 * s} r={13 * s} fill="#8FD18B" />
    <Circle cx={x - 8 * s} cy={y + 2 * s} r={9 * s} fill="#7CC47F" />
    <Circle cx={x + 8 * s} cy={y + 2 * s} r={9 * s} fill="#7CC47F" />
  </>
);

export function RouteMap({ data, meters, characterId = 'turtle', state = 'idle' }: { data: LineData; meters: number; characterId?: string; state?: CharState }) {
  const { stations, line } = data;
  const pts = React.useMemo(() => layout(data), [data]);
  const { seg, t } = locate(data, meters);
  const a = pts[seg];
  const b = pts[seg + 1];
  const me = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  const done = [...pts.slice(0, seg + 1), me];
  const str = (p: { x: number; y: number }[]) => p.map((q) => `${q.x},${q.y}`).join(' ');
  const bx = Math.min(W - 70, Math.max(70, me.x));
  const H = mapHeight(stations.length);
  const chunks = Math.ceil(H / CHUNK);

  return (
    <View style={{ width: W, height: H }}>
      {Array.from({ length: chunks }, (_, k) => {
        const y0 = k * CHUNK;
        const h = Math.min(CHUNK, H - y0);
        const inView = (y: number, pad = 60) => y >= y0 - pad && y <= y0 + h + pad;
        return (
          <Svg key={k} width={W} height={h} viewBox={`0 ${y0} ${W} ${h}`}>
            {pts.map((p, i) => inView(p.y, 40) && (
              <Tree key={`t${i}`} x={p.x > W / 2 ? 34 + (i % 3) * 14 : W - 34 - (i % 3) * 14} y={p.y - 10 + (i % 2) * 22} s={0.9 + (i % 3) * 0.15} />
            ))}
            <Polyline points={str(pts)} stroke="#fff" strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Polyline points={str(pts)} stroke="#E8DFD4" strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Polyline points={str(done)} stroke={line.color} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, i) => {
              if (!inView(p.y)) return null;
              const reached = i <= seg || (i === seg + 1 && t >= 1);
              const right = p.x <= W / 2;
              return (
                <React.Fragment key={`${i}-${stations[i].name}`}>
                  <Circle cx={p.x} cy={p.y} r={11} fill="#fff" stroke={reached ? line.color : '#CFC6BC'} strokeWidth={5} />
                  <Rect x={right ? p.x + 20 : p.x - 72} y={p.y - 12} width={52} height={24} rx={12} fill="#fff" opacity={0.92} />
                  <SvgText x={right ? p.x + 46 : p.x - 46} y={p.y + 5} fontSize={12} fontWeight="700" fill="#4A3F35" textAnchor="middle">
                    {stations[i].name}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        );
      })}
      {/* 캐릭터와 말풍선은 지도 위에 따로 얹어서, 움직여도 지도를 다시 그리지 않아요 */}
      <Marker x={me.x} y={me.y} bx={bx} started={meters > 0} characterId={characterId} state={state} color={line.color} />
    </View>
  );
}
