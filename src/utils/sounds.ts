import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

type SoundKey =
  | 'rocker'
  | 'detent'
  | 'clunk'
  | 'airBrake'
  | 'relayTick'
  | 'relayTock'
  | 'elecHorn'
  | 'airHorn';

const SOUND_SOURCES: Record<SoundKey, number> = {
  rocker: require('../../assets/sounds/rocker_click.wav'),
  detent: require('../../assets/sounds/rotary_detent.wav'),
  clunk: require('../../assets/sounds/shifter_clunk.wav'),
  airBrake: require('../../assets/sounds/air_brake.wav'),
  relayTick: require('../../assets/sounds/relay_tick.wav'),
  relayTock: require('../../assets/sounds/relay_tock.wav'),
  elecHorn: require('../../assets/sounds/elec_horn.wav'),
  airHorn: require('../../assets/sounds/air_horn.wav'),
};

class SoundManager {
  private enabled = true;
  private initialized = false;
  private players: Partial<Record<SoundKey, AudioPlayer>> = {};
  private lastPlayMs: Partial<Record<SoundKey, number>> = {};

  private ensureInit() {
    if (this.initialized) return;
    this.initialized = true;
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    }).catch(() => {});
  }

  private getPlayer(key: SoundKey): AudioPlayer | null {
    try {
      this.ensureInit();
      if (!this.players[key]) {
        const p = createAudioPlayer(SOUND_SOURCES[key]);
        p.volume = key === 'relayTick' || key === 'relayTock' ? 0.55 : 0.85;
        this.players[key] = p;
      }
      return this.players[key] ?? null;
    } catch {
      return null;
    }
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on) {
      this.setHorn(false, false);
      this.setHorn(false, true);
    }
  }

  isEnabled() {
    return this.enabled;
  }

  play(key: SoundKey, minIntervalMs = 28) {
    if (!this.enabled) return;
    const now = Date.now();
    const prev = this.lastPlayMs[key] ?? 0;
    if (now - prev < minIntervalMs) return;
    this.lastPlayMs[key] = now;

    const player = this.getPlayer(key);
    if (!player) return;
    try {
      player.seekTo(0).catch(() => {});
      player.play();
    } catch {
      // Ignore transient playback state errors
    }
  }

  setHorn(down: boolean, isAirHorn: boolean) {
    const key: SoundKey = isAirHorn ? 'airHorn' : 'elecHorn';
    const player = this.getPlayer(key);
    if (!player) return;
    try {
      if (down && this.enabled) {
        player.loop = true;
        player.seekTo(0).catch(() => {});
        player.play();
      } else {
        player.pause();
      }
    } catch {
      // Ignore
    }
  }
}

export const CockpitSounds = new SoundManager();
