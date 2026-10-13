import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useTrabby } from '../store/useTrabby';

// 효과음은 assets/sounds/ 의 같은 이름 파일로 바꾸면 돼요 (arrive: 역 도착, goal: 하루 목표, clear: 노선 완주)
const SOUNDS = {
  arrive: require('../../assets/sounds/arrive.wav'),
  goal: require('../../assets/sounds/goal.wav'),
  clear: require('../../assets/sounds/clear.wav'),
};
export type FeedbackKind = keyof typeof SOUNDS;

// 역 도착·목표 달성·완주 때 진동과 효과음 (설정에서 각각 끌 수 있어요)
export async function feedback(kind: FeedbackKind) {
  const { settings } = useTrabby.getState();
  if (settings.haptic !== false) {
    try {
      if (kind === 'arrive') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  }
  if (settings.sound !== false) {
    try {
      const { sound } = await Audio.Sound.createAsync(SOUNDS[kind]);
      sound.setOnPlaybackStatusUpdate((st: { didJustFinish?: boolean }) => {
        if (st.didJustFinish) sound.unloadAsync();
      });
      await sound.playAsync();
    } catch {}
  }
}
