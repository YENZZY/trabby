import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { CharacterImage, hasStateArt, type CharState } from '../../shared/CharacterImage';

// 노선도 위에서 지금 위치를 보여주는 캐릭터와 말풍선.
// 상태: idle(쉬는 중) / walk(걷는 중: 통통 걷기) / cheer(역 도착: 폴짝). 상태 그림이 있으면 그 그림을 써요.
const SAY: Record<CharState, [string, string]> = {
  idle: ['쉬는 중', '걸으면 다시 움직여요'],
  walk: ['조금만 더!', '도착할 수 있어요!'],
  cheer: ['도착했어요!', '다음 역으로 출발!'],
};

export const Marker = React.memo(function Marker({ x, y, bx, started, characterId, state, color }: {
  x: number; y: number; bx: number; started: boolean; characterId: string; state: CharState; color: string;
}) {
  const bob = useRef(new Animated.Value(0)).current;
  const ownArt = hasStateArt(characterId, state) && state !== 'idle';

  useEffect(() => {
    bob.stopAnimation();
    bob.setValue(0);
    const step = (to: number, ms: number) => Animated.timing(bob, { toValue: to, duration: ms, easing: Easing.inOut(Easing.quad), useNativeDriver: true });
    if (state === 'walk' && !ownArt) {
      const loop = Animated.loop(Animated.sequence([step(1, 260), step(0, 260)]));
      loop.start();
      return () => loop.stop();
    }
    if (state === 'cheer') {
      const jump = Animated.sequence([step(1, 200), step(0, 200), step(1, 200), step(0, 200)]);
      jump.start();
      return () => jump.stop();
    }
  }, [state, ownArt]);

  const lift = state === 'cheer' ? -16 : -5;
  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, lift] });
  const rotate = bob.interpolate({ inputRange: [0, 1], outputRange: state === 'walk' ? ['-3deg', '3deg'] : ['0deg', '0deg'] });
  const [say1, say2] = started ? SAY[state] : ['출발해볼까?', '걸으면 움직여요'];

  return (
    <>
      <View pointerEvents="none" style={{ position: 'absolute', left: bx - 6, top: y - 66, width: 12, height: 12, backgroundColor: '#fff', borderRightWidth: 2, borderBottomWidth: 2, borderColor: '#F3D9C4', transform: [{ rotate: '45deg' }] }} />
      <View pointerEvents="none" style={{ position: 'absolute', left: bx - 62, top: y - 104, width: 124, height: 44, borderRadius: 16, backgroundColor: '#fff', borderWidth: 2, borderColor: '#F3D9C4', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#F26B1D' }}>{say1}</Text>
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#8A7B6D' }}>{say2}</Text>
      </View>
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: x - 28, top: y - 52, width: 56, height: 56, alignItems: 'center', justifyContent: 'flex-end', transform: [{ translateY }, { rotate }] }}>
        <CharacterImage id={characterId} size={52} color={color} state={state} />
      </Animated.View>
      {state === 'cheer' && <Text pointerEvents="none" style={{ position: 'absolute', left: x + 14, top: y - 62, fontSize: 18 }}>✨</Text>}
    </>
  );
});
