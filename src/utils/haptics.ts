import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CockpitSounds } from './sounds';

export const CockpitHaptics = {
  /** Subtle mechanical detent (passing 0° steering center, rotary step, retarder step) */
  tick() {
    CockpitSounds.play('detent', 32);
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(8);
      }
      return;
    }
    Haptics.selectionAsync().catch(() => {});
  },

  /** Crisp automotive rocker switch click */
  switchClick() {
    CockpitSounds.play('rocker', 25);
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(15);
      }
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },

  /** Heavy mechanical latch (Diff Lock, Shifter R/N/D, Full Lock Stop) */
  heavyClunk() {
    CockpitSounds.play('clunk', 45);
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(30);
      }
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  },

  /** Pneumatic Parking Brake Valve release / engage hiss */
  airBrakeValve() {
    CockpitSounds.play('airBrake', 80);
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(35);
      }
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  },

  /** Alert pulse (Engine start, Trailer couple/uncouple, Reverse gear engage) */
  warningPulse() {
    CockpitSounds.play('clunk', 45);
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([20, 40, 25]);
      }
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },
};
