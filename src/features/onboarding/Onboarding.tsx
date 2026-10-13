import React, { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { CharacterImage } from '../../shared/CharacterImage';

// 처음 실행했을 때 한 번만 보여주는 안내. 마지막 쪽에서 "시작하기"를 누르면 그때 걸음 센서 권한을 물어봐요.
const PAGES = [
  { title: '걸은 만큼, 더 멀리', body: '걸음 수만큼 거북이가 지하철 노선 위를 걸어가요.\n한 걸음 한 걸음이 노선도에 쌓여요.', emoji: '' },
  { title: '코스를 완주해요', body: '한 번에 한 코스를 걸어요.\n노선을 완주하면 그 노선 색 테마를,\n갈래가 있는 노선의 전 코스를 완주하면 캐릭터를 받아요.', emoji: '🗺️' },
  { title: '걸음 센서가 필요해요', body: '걸음 수를 세려면 "신체 활동(동작 및 피트니스)" 권한이 필요해요.\n위치 정보는 쓰지 않아요.', emoji: '👣' },
];

export function Onboarding({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const [page, setPage] = useState(0);
  const p = PAGES[page];
  const last = page === PAGES.length - 1;
  return (
    <Modal visible={visible} animationType="fade" onRequestClose={() => {}}>
      <View style={s.root}>
        <View style={s.art}>{p.emoji ? <Text style={{ fontSize: 96 }}>{p.emoji}</Text> : <CharacterImage id="turtle" size={150} state="cheer" />}</View>
        <Text style={s.title}>{p.title}</Text>
        <Text style={s.body}>{p.body}</Text>
        <View style={s.dots}>{PAGES.map((_, i) => <View key={i} style={[s.dot, i === page && s.dotOn]} />)}</View>
        <Pressable style={s.btn} onPress={() => (last ? onDone() : setPage(page + 1))}>
          <Text style={s.btnT}>{last ? '시작하기' : '다음'}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF3E3', alignItems: 'center', justifyContent: 'center', padding: 28 },
  art: { height: 170, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '900', color: '#3A2F26', marginBottom: 12 },
  body: { fontSize: 15, color: '#6F6459', textAlign: 'center', lineHeight: 24 },
  dots: { flexDirection: 'row', gap: 8, marginTop: 28 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E3D6C7' },
  dotOn: { width: 22, backgroundColor: '#F26B1D' },
  btn: { marginTop: 28, backgroundColor: '#F26B1D', borderRadius: 28, paddingVertical: 15, paddingHorizontal: 56 },
  btnT: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
