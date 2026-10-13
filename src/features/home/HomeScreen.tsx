import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Animated, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { RouteMap, mapHeight, yAt } from './RouteMap';
import { useTrabby } from '../../store/useTrabby';
import { useActive } from '../../store/useActive';
import { usePedometer } from './usePedometer';
import { DAILY_GOAL, metrics, locate, STRIDE_M } from '../../lib/progress';
import NextLineSheet from '../lines/NextLineSheet';
import { themeBg } from '../settings/themes';
import { LINE_DATA, LINE_GROUPS, lineLabel } from '../../data';
import { CHARACTERS } from '../../data/rewards';
import { useCharacter } from '../../store/useCharacter';
import { CharacterImage, type CharState } from '../../shared/CharacterImage';
import { feedback } from '../../shared/feedback';
import { streakOf } from '../../lib/streak';
import { Onboarding } from '../onboarding/Onboarding';

export default function Home() {
  const { todaySteps, cleared: clearedMap, addSteps, claim, settings, legendUnlocked, onboarded, finishOnboarding, dayLog } = useTrabby();
  const { status } = usePedometer(onboarded);
  const [sheet, setSheet] = useState(false);
  const { data, line, meters, progress, total, fullyDone, extension, newStations } = useActive();
  const leftKm = ((total - Math.min(meters, total)) / 1000).toFixed(1);
  const showClear = progress >= 1 && !fullyDone;
  const { cum } = metrics(data);
  const reached = cum.filter((c) => c <= meters).length; // 지나온 역 개수
  const nextIdx = Math.min(locate(data, meters).seg + 1, data.stations.length - 1);
  const nextStation = data.stations[nextIdx];
  const toNext = Math.max(0, Math.ceil((cum[nextIdx] - meters) / STRIDE_M)); // 다음 역까지 남은 걸음
  const prev = useRef({ id: line.id, n: reached });
  const [toast, setToast] = useState<string | null>(null);
  // 캐릭터 상태: 역 도착(toast 표시 중) → cheer / 최근 걸음 있음 → walk / 그 외 idle
  const [moving, setMoving] = useState(false);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    setMoving(true);
    const id = setTimeout(() => setMoving(false), 2500);
    return () => clearTimeout(id);
  }, [meters]);
  const markerState: CharState = toast ? 'cheer' : moving ? 'walk' : 'idle';
  useEffect(() => {
    const p = prev.current;
    prev.current = { id: line.id, n: reached };
    if (p.id === line.id && reached > p.n && settings.arrivalAlert) {
      const name = data.stations[reached - 1].name;
      setToast(`${name.endsWith('역') ? name : name + '역'} 도착!`);
      feedback('arrive');
      const id = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(id);
    }
  }, [reached, line.id]);
  const character = useCharacter();
  useEffect(() => { if (showClear) feedback('clear'); }, [showClear]);
  // 연속 걷기: 하루 목표를 채운 날이 이어진 일수. 오늘 목표를 처음 채우는 순간 축하해요
  const streak = streakOf(dayLog ?? {}, DAILY_GOAL);
  const prevToday = useRef(todaySteps);
  useEffect(() => {
    const was = prevToday.current;
    prevToday.current = todaySteps;
    if (was < DAILY_GOAL && todaySteps >= DAILY_GOAL) {
      setToast(`오늘 목표 달성! 🔥 연속 ${Math.max(1, streak)}일`);
      feedback('goal');
      const id = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(id);
    }
  }, [todaySteps]);
  // 보상: 본선 완주 → 노선 컬러 테마 / 그 노선의 마지막 코스까지 완주 → 캐릭터 + 전 코스 뱃지 / 뱃지는 코스마다
  const group = line.group ?? line.name;
  const grp = LINE_GROUPS.find((g) => g.name === group);
  const completesGroup = !!grp && grp.ids.length > 1 && grp.ids.every((id) => id === line.id || clearedMap[id]);
  const ch = CHARACTERS.find((c) => c.group === group);
  const completesAll = !legendUnlocked && Object.keys(LINE_DATA).map(Number).every((id) => id === line.id || clearedMap[id]);
  const legend = CHARACTERS.find((c) => c.legendary);
  const rewards: [string, string, string?][] = [
    ...(line.kind !== 'extra' ? ([['🎨', `${group} 컬러 테마`]] as [string, string][]) : []),
    ...(completesGroup && ch ? ([[ch.emoji, ch.name, ch.id]] as [string, string, string?][]) : []),
    ...(completesGroup ? ([['🎖️', `${group} 전 코스 뱃지`]] as [string, string][]) : []),
    ...(completesAll && legend ? ([[legend.emoji, legend.name, legend.id], ['🏆', '전 코스 정복 뱃지']] as [string, string, string?][]) : []),
    ['🏅', `${line.name} 완주 뱃지`],
  ];
  const next = Object.keys(LINE_DATA).map(Number).find((id) => id !== line.id && !clearedMap[id]);
  const router = useRouter();
  const sc = useRef<ScrollView>(null);
  const center = (m: number) => sc.current?.scrollTo({ y: Math.max(0, yAt(data, m) - 230), animated: true });
  useEffect(() => { center(meters); }, [meters]);

  const anim = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = anim.addListener(({ value }) => setShown((prev) => (Math.abs(prev - value) >= 4 || value === meters ? value : prev)));
    Animated.timing(anim, { toValue: meters, duration: 600, useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [meters]);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: themeBg(settings.theme) }]}>
      <View style={[s.row, { justifyContent: 'space-between', paddingRight: 16 }]}>
        <Text style={s.logo}>🐢 Trabby</Text>
        <View style={s.bell}><Text style={{ fontSize: 18 }}>🔔</Text><View style={s.reddot} /></View>
      </View>

      <View style={s.card} onTouchEnd={() => router.push('/line')}>
        <View style={s.row}>
          <View style={[s.badge, { backgroundColor: line.color }]}><Text style={s.badgeTxt}>{line.id}</Text></View>
          <View style={{ flex: 1 }}>
            <View style={s.row}>
              <Text style={s.title}>{line.name}</Text>
              <View style={s.pill}><Text style={s.pillTxt}>진행중</Text></View>
            </View>
            <Text style={s.sub}>{line.from} → {line.to}</Text>
          </View>
          <Text style={[s.pct, { color: line.color }]}>{Math.floor(progress * 100)}%</Text>
        </View>
        <View style={s.bar}><View style={[s.fill, { width: `${progress * 100}%`, backgroundColor: line.color }]} /></View>
      </View>

      {onboarded && (status === 'denied' || status === 'unavailable') && (
        <View style={s.sensor}>
          <Text style={s.sensorTxt}>
            {status === 'denied' ? '걸음 센서 권한이 꺼져 있어요. 설정에서 "신체 활동(동작 및 피트니스)" 권한을 켜 주세요.' : '이 기기에서는 걸음 센서를 쓸 수 없어요.' + (__DEV__ ? ' (에뮬레이터는 아래 +300 걸음 버튼으로 테스트하세요)' : '')}
          </Text>
          {status === 'denied' && (
            <Pressable onPress={() => Linking.openSettings()} style={{ marginTop: 8 }}>
              <Text style={[s.sensorTxt, { color: '#F26B1D' }]}>설정 열기 ›</Text>
            </Pressable>
          )}
        </View>
      )}
      <View style={s.map}>
        <ScrollView ref={sc} contentContainerStyle={{ alignItems: 'center', minHeight: mapHeight(data.stations.length) }}>
          <RouteMap data={data} meters={shown} characterId={character.id} state={markerState} />
        </ScrollView>
        <Pressable style={s.nav} onPress={() => center(meters)}><Text style={{ fontSize: 18, color: '#F26B1D' }}>➤</Text></Pressable>
      </View>

      {extension && settings.extAlert && (
        <View style={s.next}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>🆕 새 구간이 열렸어요!</Text>
            <Text style={s.sub}>{line.name}에 역 {newStations}개가 늘었어요. 이어서 걸어보세요</Text>
          </View>
        </View>
      )}
      {fullyDone && (
        <View style={s.next}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>🎉 {line.name} 완주!</Text>
            <Text style={s.sub}>{next ? `${lineLabel(next)}에 도전해볼까요?` : '다른 노선은 곧 열려요!'}</Text>
          </View>
          {next ? (
            <Pressable style={[s.nextBtn, { backgroundColor: line.color }]} onPress={() => setSheet(true)}>
              <Text style={[s.btnTxt, { fontSize: 14 }]}>노선 고르기</Text>
            </Pressable>
          ) : null}
        </View>
      )}
      <View style={s.footer}>
        <View style={[s.card, s.half]}>
          <View style={s.row}>
            <Text style={{ fontSize: 26 }}>👣</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>오늘의 걸음 수{streak > 0 ? `  🔥 연속 ${streak}일` : ''}</Text>
              <Text style={s.big}>{todaySteps.toLocaleString()} <Text style={s.sub}>/ {DAILY_GOAL.toLocaleString()}</Text></Text>
            </View>
          </View>
          <View style={s.bar}><View style={[s.fill, { width: `${Math.min(1, todaySteps / DAILY_GOAL) * 100}%`, backgroundColor: '#3DBE6B' }]} /></View>
        </View>
        <View style={[s.card, s.half]}>
          <View style={s.row}>
            <Text style={{ fontSize: 26 }}>📍</Text>
            <View>
              <Text style={s.label}>남은 거리</Text>
              <Text style={s.big}>{leftKm} km</Text>
              <Text style={[s.sub, { fontSize: 11 }]}>{progress >= 1 ? '종점에 도착했어요!' : `다음 ${nextStation.name}까지 ${toNext.toLocaleString()}걸음`}</Text>
            </View>
          </View>
        </View>
      </View>

      {__DEV__ && (
        <View style={s.devRow}>
          {[300, 8000, 50000].map((n) => (
            <Pressable key={n} style={s.dev} onPress={() => addSteps(n)}><Text style={s.devTxt}>+{n.toLocaleString()} 걸음 (DEV)</Text></Pressable>
          ))}
        </View>
      )}

      {toast && (
        <View style={s.toast}><Text style={s.toastTxt}>🐢 {toast}</Text></View>
      )}
      {showClear && (
        <View style={s.overlay}>
          {[['#F26B1D',30,60],['#3DBE6B',80,140],['#2F9BD8',270,90],['#E5468C',320,50],['#C9A227',50,220],['#8A4FC9',330,200],['#F26B1D',150,40],['#3DBE6B',240,30],['#E5468C',20,300],['#2F9BD8',340,320]].map(([c, x, y], i) => (
            <View key={i} style={{ position: 'absolute', left: x as number, top: y as number, width: 10, height: 10, borderRadius: i % 2 ? 5 : 2, backgroundColor: c as string, transform: [{ rotate: `${i * 35}deg` }] }} />
          ))}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Text style={{ fontSize: 40 }}>🎉</Text><CharacterImage id={character.id} size={96} state="cheer" color={line.color} /><Text style={{ fontSize: 40 }}>🎉</Text></View>
          <Text style={[s.clear, { color: line.color }]}>🌿 CLEAR! 🌿</Text>
          <Text style={s.title}>{line.name} 완주!</Text>
          <Text style={s.sub}>수고했어요, 트라비! 멋진 여행이었어요!</Text>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 16, marginTop: 10, width: 300 }}>
            <Text style={[s.title, { textAlign: 'center', fontSize: 15 }]}>획득한 보상</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', marginTop: 12 }}>
              {rewards.map(([e, n, cid]) => (
                <View key={n} style={{ alignItems: 'center', width: 84 }}>
                  <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFE8D6', alignItems: 'center', justifyContent: 'center' }}>{cid ? <CharacterImage id={cid} size={40} state="cheer" /> : <Text style={{ fontSize: 28 }}>{e}</Text>}</View>
                  <Text style={[s.sub, { marginTop: 6, textAlign: 'center' }]}>{n}</Text>
                </View>
              ))}
            </View>
          </View>
          <Pressable style={[s.btn, { backgroundColor: line.color }]} onPress={() => { claim(); setSheet(true); }}>
            <Text style={s.btnTxt}>확인하기</Text>
          </Pressable>
        </View>
      )}
      <Onboarding visible={!onboarded} onDone={finishOnboarding} />
      <NextLineSheet visible={sheet} onClose={() => setSheet(false)} />
    </SafeAreaView>
  );
}

const shadow = { shadowColor: '#C9A98A', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 };
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EAF5FB' },
  logo: { fontSize: 24, fontWeight: '900', color: '#F26B1D', paddingHorizontal: 18, paddingTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 14, marginHorizontal: 14, marginTop: 10, ...shadow },
  half: { flex: 1, marginHorizontal: 0, marginTop: 0 },
  badge: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { color: '#fff', fontSize: 24, fontWeight: '900' },
  title: { fontSize: 19, fontWeight: '800', color: '#3A2F26' },
  pill: { backgroundColor: '#FFE8D6', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  pillTxt: { color: '#F26B1D', fontSize: 11, fontWeight: '800' },
  sub: { fontSize: 13, fontWeight: '500', color: '#8A7B6D' },
  pct: { fontSize: 22, fontWeight: '900' },
  bar: { height: 12, borderRadius: 6, backgroundColor: '#F1E6DA', marginTop: 10, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6 },
  map: { flex: 1, marginTop: 6 },
  toast: { position: 'absolute', top: 110, alignSelf: 'center', backgroundColor: '#3A2F26', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10 },
  sensor: { marginHorizontal: 14, marginTop: 8, backgroundColor: '#FFF1CC', borderRadius: 16, padding: 12 },
  sensorTxt: { fontSize: 12, fontWeight: '700', color: '#7A5B00', lineHeight: 18 },
  toastTxt: { color: '#fff', fontWeight: '800' },
  next: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 14, marginTop: 6, backgroundColor: '#fff', borderRadius: 20, padding: 14, ...shadow },
  nextBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  nav: { position: 'absolute', right: 16, bottom: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow },
  bell: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  reddot: { position: 'absolute', top: 7, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#F26B1D' },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  label: { fontSize: 12, color: '#8A7B6D', fontWeight: '600' },
  big: { fontSize: 20, fontWeight: '900', color: '#3A2F26' },
  devRow: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  dev: { alignSelf: 'center', paddingBottom: 6 },
  devTxt: { color: '#8A7B6D', fontSize: 12 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,248,239,0.97)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  clear: { fontSize: 58, fontWeight: '900' },
  btn: { paddingHorizontal: 44, paddingVertical: 15, borderRadius: 28, marginTop: 14 },
  btnTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
