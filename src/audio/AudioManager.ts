import {
  Audio,
  AVPlaybackStatus,
  AVPlaybackStatusSuccess,
  InterruptionModeAndroid,
  InterruptionModeIOS,
} from 'expo-av';
import { TRACKS, Track } from './tracks';
import { resolveSfx, SfxKey } from './sfx';

/**
 * Shape of the state observable published to every UI subscriber. Every time
 * anything about playback changes, a fresh snapshot is fan-outed to listeners
 * so hooks re-render without imperative polling.
 */
export interface AudioState {
  isPlaying: boolean;
  isBuffering: boolean;
  isLoading: boolean;
  shuffle: boolean;
  expanded: boolean;
  currentIndex: number | null;
  currentTrack: Track | null;
  positionMs: number;
  durationMs: number;
  volume: number;
  error: string | null;
}

type Listener = (state: AudioState) => void;

const INITIAL: AudioState = {
  isPlaying: false,
  isBuffering: false,
  isLoading: false,
  shuffle: true,
  expanded: false,
  currentIndex: null,
  currentTrack: null,
  positionMs: 0,
  durationMs: 0,
  volume: 1,
  error: null,
};

/**
 * Centralized, singleton audio manager.
 *
 *  - Guarantees exactly one music `Sound` instance is loaded at a time. Every
 *    `load()` unloads whatever was playing before.
 *  - Maintains a separate transient SFX channel so UI cues never step on the
 *    music track.
 *  - Publishes state changes through a tiny subscribe/notify bus. React
 *    surface lives in `useAudio`.
 *  - Works fully offline — all sources are local `require()`s.
 */
class AudioManagerImpl {
  private state: AudioState = { ...INITIAL };
  private listeners = new Set<Listener>();
  private sound: Audio.Sound | null = null;
  private sfxSound: Audio.Sound | null = null;
  private playlist: Track[] = TRACKS;
  private history: number[] = [];
  private audioModeReady = false;

  // ─── Subscription bus ────────────────────────────────────────────────────

  getState(): AudioState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(patch: Partial<AudioState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l(this.state));
  }

  // ─── Audio mode (one-shot) ──────────────────────────────────────────────

  private async ensureAudioMode(): Promise<void> {
    if (this.audioModeReady) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        playThroughEarpieceAndroid: false,
      });
      this.audioModeReady = true;
    } catch (err) {
      // Non-fatal — playback still works on most devices, we just log.
      console.warn('[AudioManager] Failed to configure audio mode', err);
    }
  }

  // ─── Playlist access ────────────────────────────────────────────────────

  get tracks(): Track[] {
    return this.playlist;
  }

  setShuffle(shuffle: boolean): void {
    this.emit({ shuffle });
  }

  toggleShuffle(): void {
    this.emit({ shuffle: !this.state.shuffle });
  }

  setExpanded(expanded: boolean): void {
    this.emit({ expanded });
  }

  toggleExpanded(): void {
    this.emit({ expanded: !this.state.expanded });
  }

  // ─── Core loading (single Sound invariant) ──────────────────────────────

  /** Avoid uncaught "Player does not exist" when unload races status callbacks. */
  private async safeUnloadSoundInstance(s: Audio.Sound | null): Promise<void> {
    if (!s) return;
    try {
      try {
        s.setOnPlaybackStatusUpdate(null);
      } catch {
        /* ignore */
      }
      await s.unloadAsync();
    } catch {
      /* already unloaded / native player torn down */
    }
  }

  private async unloadSound(): Promise<void> {
    if (!this.sound) return;
    const s = this.sound;
    this.sound = null;
    await this.safeUnloadSoundInstance(s);
  }

  private async loadAt(index: number, autoPlay = true): Promise<void> {
    await this.ensureAudioMode();
    const track = this.playlist[index];
    if (!track) return;

    await this.unloadSound();

    this.emit({
      isLoading: true,
      isBuffering: true,
      error: null,
      currentIndex: index,
      currentTrack: track,
      positionMs: 0,
      durationMs: 0,
    });

    try {
      const { sound } = await Audio.Sound.createAsync(
        track.source,
        { shouldPlay: autoPlay, volume: this.state.volume },
        this.onStatus
      );
      this.sound = sound;
      this.emit({ isLoading: false, isPlaying: autoPlay });
    } catch (err) {
      console.warn('[AudioManager] load failed', track.id, err);
      this.emit({
        isLoading: false,
        isBuffering: false,
        isPlaying: false,
        error: `Could not load "${track.title}"`,
      });
    }
  }

  private onStatus = (status: AVPlaybackStatus): void => {
    if (!status.isLoaded) {
      if ('error' in status && status.error) {
        this.emit({ error: String(status.error), isPlaying: false });
      }
      return;
    }
    const s = status as AVPlaybackStatusSuccess;
    this.emit({
      isPlaying: s.isPlaying,
      isBuffering: s.isBuffering ?? false,
      positionMs: s.positionMillis ?? 0,
      durationMs: s.durationMillis ?? this.state.durationMs,
    });
    if (s.didJustFinish && !s.isLooping) {
      void this.next();
    }
  };

  // ─── Public controls ────────────────────────────────────────────────────

  /** Start/resume playback. Loads a random track if nothing is queued. */
  async play(): Promise<void> {
    if (!this.sound) {
      await this.playRandom();
      return;
    }
    try {
      await this.sound.playAsync();
      this.emit({ isPlaying: true });
    } catch (err) {
      console.warn('[AudioManager] play failed', err);
    }
  }

  async pause(): Promise<void> {
    if (!this.sound) return;
    try {
      await this.sound.pauseAsync();
      this.emit({ isPlaying: false });
    } catch (err) {
      console.warn('[AudioManager] pause failed', err);
    }
  }

  async resume(): Promise<void> {
    await this.play();
  }

  async togglePlay(): Promise<void> {
    if (this.state.isPlaying) await this.pause();
    else await this.play();
  }

  async stop(): Promise<void> {
    await this.unloadSound();
    this.emit({
      isPlaying: false,
      isBuffering: false,
      isLoading: false,
      currentIndex: null,
      currentTrack: null,
      positionMs: 0,
      durationMs: 0,
      expanded: false,
    });
  }

  /**
   * "Lit My Mood" — pick a random track and start playing instantly.
   * Keeps track of recent picks so shuffle isn't repetitive.
   */
  async playRandom(): Promise<void> {
    const n = this.playlist.length;
    if (n === 0) return;
    let pick: number;
    if (n === 1) {
      pick = 0;
    } else {
      const recent = new Set(this.history.slice(-Math.min(5, n - 1)));
      do {
        pick = Math.floor(Math.random() * n);
      } while (recent.has(pick));
    }
    this.history.push(pick);
    if (this.history.length > 50) this.history.shift();
    await this.loadAt(pick, true);
  }

  async playTrack(idOrIndex: string | number): Promise<void> {
    const idx =
      typeof idOrIndex === 'number'
        ? idOrIndex
        : this.playlist.findIndex((t) => t.id === idOrIndex);
    if (idx < 0 || idx >= this.playlist.length) return;
    this.history.push(idx);
    await this.loadAt(idx, true);
  }

  async next(): Promise<void> {
    const n = this.playlist.length;
    if (n === 0) return;
    if (this.state.shuffle) {
      await this.playRandom();
      return;
    }
    const current = this.state.currentIndex ?? -1;
    const nextIdx = (current + 1) % n;
    this.history.push(nextIdx);
    await this.loadAt(nextIdx, true);
  }

  async previous(): Promise<void> {
    const n = this.playlist.length;
    if (n === 0) return;

    // Seek-to-start when we've played > 3s into the track.
    if (this.sound && this.state.positionMs > 3000) {
      try {
        await this.sound.setPositionAsync(0);
        return;
      } catch {
        /* fall through to index-based prev */
      }
    }

    if (this.state.shuffle && this.history.length > 1) {
      this.history.pop(); // drop current
      const prev = this.history[this.history.length - 1];
      await this.loadAt(prev, true);
      return;
    }

    const current = this.state.currentIndex ?? 0;
    const prevIdx = (current - 1 + n) % n;
    this.history.push(prevIdx);
    await this.loadAt(prevIdx, true);
  }

  async seekTo(ms: number): Promise<void> {
    if (!this.sound) return;
    try {
      await this.sound.setPositionAsync(Math.max(0, ms));
    } catch {
      /* ignore */
    }
  }

  async setVolume(v: number): Promise<void> {
    const volume = Math.max(0, Math.min(1, v));
    this.emit({ volume });
    if (this.sound) {
      try {
        await this.sound.setVolumeAsync(volume);
      } catch {
        /* ignore */
      }
    }
  }

  // ─── Separate, non-interrupting SFX channel ─────────────────────────────

  /**
   * Fire-and-forget short sound effect. Completely isolated from the music
   * channel — playing an SFX never touches `this.sound`, and the SFX Sound
   * object is fully unloaded once playback finishes.
   */
  async playSfx(key: SfxKey): Promise<void> {
    try {
      const source = resolveSfx(key);
      if (source == null) return; // unregistered — silently no-op

      await this.ensureAudioMode();

      // Always unload any previous SFX that might still be in flight.
      if (this.sfxSound) {
        const prev = this.sfxSound;
        this.sfxSound = null;
        await this.safeUnloadSoundInstance(prev);
      }

      try {
        const { sound } = await Audio.Sound.createAsync(source, {
          shouldPlay: true,
          volume: 0.9,
        });
        this.sfxSound = sound;
        sound.setOnPlaybackStatusUpdate((st) => {
          if (!st.isLoaded) return;
          if ((st as AVPlaybackStatusSuccess).didJustFinish) {
            void this.safeUnloadSoundInstance(sound).finally(() => {
              if (this.sfxSound === sound) this.sfxSound = null;
            });
          }
        });
      } catch (err) {
        console.warn('[AudioManager] sfx load failed', key, err);
      }
    } catch (err) {
      console.warn('[AudioManager] playSfx failed', key, err);
    }
  }

  // ─── Cleanup ────────────────────────────────────────────────────────────

  async dispose(): Promise<void> {
    await this.unloadSound();
    const sfx = this.sfxSound;
    this.sfxSound = null;
    await this.safeUnloadSoundInstance(sfx);
    this.listeners.clear();
  }
}

export const AudioManager = new AudioManagerImpl();
export type { Track };
