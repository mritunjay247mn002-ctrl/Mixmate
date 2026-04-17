import { useEffect, useMemo, useState } from 'react';
import { AudioManager, AudioState } from './AudioManager';
import type { SfxKey } from './sfx';
import type { Track } from './tracks';

export interface UseAudio {
  state: AudioState;
  tracks: Track[];
  /** "Lit My Mood" - instantly begin playback with a random pick. */
  litMyMood: () => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  togglePlay: () => Promise<void>;
  stop: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  toggleShuffle: () => void;
  setShuffle: (shuffle: boolean) => void;
  playTrack: (idOrIndex: string | number) => Promise<void>;
  seekTo: (ms: number) => Promise<void>;
  setVolume: (v: number) => Promise<void>;
  toggleExpanded: () => void;
  setExpanded: (v: boolean) => void;
  playSfx: (key: SfxKey) => Promise<void>;
}

/**
 * Subscription-based access to the singleton audio manager. Any change in
 * playback state is pushed to all consumers instantly, so UI elements (mini
 * player, pulse effects, now-playing indicators) react without imperative
 * polling.
 */
export function useAudio(): UseAudio {
  const [state, setState] = useState<AudioState>(() => AudioManager.getState());

  useEffect(() => {
    return AudioManager.subscribe(setState);
  }, []);

  return useMemo<UseAudio>(
    () => ({
      state,
      tracks: AudioManager.tracks,
      litMyMood: () => AudioManager.playRandom(),
      play: () => AudioManager.play(),
      pause: () => AudioManager.pause(),
      resume: () => AudioManager.resume(),
      togglePlay: () => AudioManager.togglePlay(),
      stop: () => AudioManager.stop(),
      next: () => AudioManager.next(),
      previous: () => AudioManager.previous(),
      toggleShuffle: () => AudioManager.toggleShuffle(),
      setShuffle: (s: boolean) => AudioManager.setShuffle(s),
      playTrack: (id) => AudioManager.playTrack(id),
      seekTo: (ms) => AudioManager.seekTo(ms),
      setVolume: (v) => AudioManager.setVolume(v),
      toggleExpanded: () => AudioManager.toggleExpanded(),
      setExpanded: (v: boolean) => AudioManager.setExpanded(v),
      playSfx: (key) => AudioManager.playSfx(key),
    }),
    [state]
  );
}

export { AudioManager };
