import React, { useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// NOTE: Reanimated 4.1.x entering/exiting animations (FadeIn, FadeInUp,
// FadeOut, ...) crash on Android + Fabric with "String translate must be a
// percentage" — a Reanimated-side validator bug. Props are omitted until the
// dev client is rebuilt with a fixed Reanimated; the EQ bars and spinning
// disc still animate because they use numeric-only useAnimatedStyle hooks.
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudio } from '../audio/useAudio';
import { FS, GLASS_BORDER, RAD, SP } from '../utils/theme';
import type { Track } from '../audio/tracks';

/**
 * Persistent, floating audio controller. Collapsed: glassmorphic pill with
 * play/pause + next. Tap to expand into a full-screen now-playing sheet with
 * prev/next/shuffle and a scrollable queue.
 *
 * Mounted once at the root layout so music survives navigation.
 */
export function MiniPlayer() {
  const { state, togglePlay, next, previous, toggleShuffle, stop, playTrack, toggleExpanded, setExpanded } = useAudio();
  const insets = useSafeAreaInsets();

  // Mini-player only appears once something is loaded — no music, no clutter.
  if (!state.currentTrack) return null;

  if (state.expanded) {
    return (
      <ExpandedPlayer
        onCollapse={() => setExpanded(false)}
        onTogglePlay={togglePlay}
        onNext={next}
        onPrev={previous}
        onShuffle={toggleShuffle}
        onStop={stop}
        onPickTrack={playTrack}
        insetsBottom={insets.bottom}
      />
    );
  }

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) + 76 }]}
    >
      <Pressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          toggleExpanded();
        }}
        style={styles.pillOuter}
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 60 : 90}
          tint="dark"
          style={[StyleSheet.absoluteFill, styles.blurRadius]}
        />
        <LinearGradient
          colors={['rgba(255,46,147,0.15)', 'rgba(176,38,255,0.18)', 'rgba(0,229,255,0.12)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.blurRadius]}
        />
        <View style={styles.pillRow}>
          <VisualizerEQ playing={state.isPlaying} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              {state.currentTrack.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {state.isBuffering
                ? 'Loading…'
                : state.currentTrack.artist ?? 'MixMate Lounge'}
            </Text>
          </View>
          <PillBtn
            icon={state.isPlaying ? 'pause' : 'play'}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              togglePlay();
            }}
          />
          <PillBtn
            icon="play-skip-forward"
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              next();
            }}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Animated little EQ bars, synced with playing/paused state ─────────────

function VisualizerEQ({ playing }: { playing: boolean }) {
  return (
    <View style={styles.eq}>
      <EqBar playing={playing} delay={0} />
      <EqBar playing={playing} delay={140} />
      <EqBar playing={playing} delay={280} />
    </View>
  );
}

function EqBar({ playing, delay }: { playing: boolean; delay: number }) {
  const v = useSharedValue(0.3);
  useEffect(() => {
    if (playing) {
      v.value = withRepeat(
        withTiming(1, { duration: 520 + delay, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
    } else {
      cancelAnimation(v);
      v.value = withTiming(0.25, { duration: 200 });
    }
    return () => cancelAnimation(v);
  }, [playing, delay, v]);
  const style = useAnimatedStyle(() => ({
    height: interpolate(v.value, [0, 1], [4, 18]),
    opacity: interpolate(v.value, [0, 1], [0.55, 1]),
  }));
  return <Animated.View style={[styles.eqBar, style]} />;
}

function PillBtn({
  icon,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPressIn={() => (scale.value = withSpring(0.9, { damping: 14 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 14 }))}
      onPress={onPress}
      hitSlop={8}
    >
      <Animated.View style={[styles.pillBtn, style]}>
        <Ionicons name={icon} size={18} color="#fff" />
      </Animated.View>
    </Pressable>
  );
}

// ─── Expanded now-playing sheet ────────────────────────────────────────────

function ExpandedPlayer({
  onCollapse,
  onTogglePlay,
  onNext,
  onPrev,
  onShuffle,
  onStop,
  onPickTrack,
  insetsBottom,
}: {
  onCollapse: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onShuffle: () => void;
  onStop: () => void;
  onPickTrack: (id: string | number) => void;
  insetsBottom: number;
}) {
  const { state, tracks } = useAudio();
  const track = state.currentTrack;

  const discSpin = useSharedValue(0);
  useEffect(() => {
    if (state.isPlaying) {
      discSpin.value = withRepeat(
        withTiming(360, { duration: 14000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(discSpin);
    }
    return () => cancelAnimation(discSpin);
  }, [state.isPlaying, discSpin]);

  const discStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${discSpin.value}deg` }],
  }));

  return (
    <Animated.View
      style={StyleSheet.absoluteFill}
      pointerEvents="auto"
    >
      <BlurView
        intensity={Platform.OS === 'ios' ? 80 : 110}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(122,0,255,0.55)', 'rgba(7,2,15,0.9)']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.sheet, { paddingBottom: insetsBottom + SP.md }]}>
        <View style={styles.sheetHeader}>
          <Pressable hitSlop={12} onPress={onCollapse} style={styles.iconBtn}>
            <Ionicons name="chevron-down" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.nowPlayingKicker}>NOW PLAYING</Text>
          <Pressable hitSlop={12} onPress={onStop} style={styles.iconBtn}>
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.discWrap}>
          <Animated.View style={[styles.disc, discStyle]}>
            <LinearGradient
              colors={['#FF2E93', '#B026FF', '#00E5FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.discInner}>
              <Ionicons name="musical-notes" size={64} color="rgba(255,255,255,0.95)" />
            </View>
            <View style={styles.discHole} />
          </Animated.View>
        </View>

        <View style={{ alignItems: 'center', paddingHorizontal: SP.lg }}>
          <Text style={styles.nowTitle} numberOfLines={1}>
            {track?.title}
          </Text>
          <Text style={styles.nowArtist} numberOfLines={1}>
            {track?.artist ?? 'MixMate Lounge'}
          </Text>
        </View>

        <Progress position={state.positionMs} duration={state.durationMs} />

        <View style={styles.controlsRow}>
          <BigBtn
            icon="shuffle"
            active={state.shuffle}
            onPress={onShuffle}
            size={22}
          />
          <BigBtn icon="play-skip-back" onPress={onPrev} size={28} />
          <BigBtn
            icon={state.isPlaying ? 'pause' : 'play'}
            onPress={onTogglePlay}
            primary
            size={36}
          />
          <BigBtn icon="play-skip-forward" onPress={onNext} size={28} />
          <BigBtn
            icon="list"
            onPress={() => {
              /* scroll into view handled below */
            }}
            size={22}
          />
        </View>

        <Text style={styles.queueLbl}>QUEUE · {tracks.length} TRACKS</Text>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: SP.lg }}
          showsVerticalScrollIndicator={false}
        >
          {tracks.map((t, idx) => (
            <TrackRow
              key={t.id}
              track={t}
              active={state.currentIndex === idx}
              onPress={() => onPickTrack(idx)}
            />
          ))}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

function BigBtn({
  icon,
  onPress,
  primary,
  active,
  size = 24,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  primary?: boolean;
  active?: boolean;
  size?: number;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      hitSlop={10}
      onPressIn={() => (scale.value = withSpring(0.88, { damping: 14 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 14 }))}
      onPress={() => {
        Haptics.impactAsync(
          primary ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light
        ).catch(() => {});
        onPress();
      }}
    >
      <Animated.View
        style={[
          styles.ctrlBtn,
          primary && styles.ctrlBtnPrimary,
          active && styles.ctrlBtnActive,
          style,
        ]}
      >
        {primary && (
          <LinearGradient
            colors={['#FF2E93', '#FF7A00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <Ionicons
          name={icon}
          size={size}
          color={primary ? '#07020F' : active ? '#00E5FF' : '#fff'}
        />
      </Animated.View>
    </Pressable>
  );
}

function Progress({ position, duration }: { position: number; duration: number }) {
  const pct = duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0;
  return (
    <View style={{ paddingHorizontal: SP.lg, marginTop: SP.md }}>
      <View style={styles.progressTrack}>
        <LinearGradient
          colors={['#00E5FF', '#FF2E93']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${pct * 100}%` }]}
        />
      </View>
      <View style={styles.timeRow}>
        <Text style={styles.time}>{formatMs(position)}</Text>
        <Text style={styles.time}>{formatMs(duration)}</Text>
      </View>
    </View>
  );
}

function TrackRow({
  track,
  active,
  onPress,
}: {
  track: Track;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.row, active && styles.rowActive]}>
      <Ionicons
        name={active ? 'volume-high' : 'musical-note'}
        size={16}
        color={active ? '#00E5FF' : 'rgba(255,255,255,0.6)'}
      />
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.rowTitle, active && { color: '#fff' }]}
          numberOfLines={1}
        >
          {track.title}
        </Text>
        {track.artist ? (
          <Text style={styles.rowArtist} numberOfLines={1}>
            {track.artist}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${ss.toString().padStart(2, '0')}`;
}

// ─── styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: SP.md,
    right: SP.md,
    zIndex: 40,
  },
  pillOuter: {
    borderRadius: RAD.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: GLASS_BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  blurRadius: { borderRadius: RAD.xl },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  eq: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    width: 28,
    height: 22,
    justifyContent: 'center',
  },
  eqBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#00E5FF',
  },
  title: {
    color: 'white',
    fontSize: FS.sm,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  artist: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: FS.xs,
    fontWeight: '600',
  },
  pillBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },

  // expanded sheet
  sheet: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: SP.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SP.md,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER,
  },
  nowPlayingKicker: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    letterSpacing: 2.4,
    fontWeight: '900',
  },
  discWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SP.md,
  },
  disc: {
    width: 220,
    height: 220,
    borderRadius: 110,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.14)',
    shadowColor: '#FF2E93',
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 18,
  },
  discInner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discHole: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#07020F',
    top: '50%',
    left: '50%',
    marginTop: -14,
    marginLeft: -14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  nowTitle: {
    color: 'white',
    fontSize: FS.xl,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: SP.sm,
  },
  nowArtist: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FS.sm,
    fontWeight: '600',
    marginTop: 4,
  },

  // controls
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SP.md,
    marginTop: SP.md,
    marginBottom: SP.sm,
  },
  ctrlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GLASS_BORDER,
    overflow: 'hidden',
  },
  ctrlBtnActive: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0,229,255,0.1)',
  },
  ctrlBtnPrimary: {
    width: 68,
    height: 68,
    borderRadius: 34,
    shadowColor: '#FF2E93',
    shadowOpacity: 0.8,
    shadowRadius: 18,
    elevation: 14,
  },

  // progress
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%' },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  time: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FS.xs,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  // queue
  queueLbl: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    paddingHorizontal: SP.sm,
    marginTop: SP.md,
    marginBottom: SP.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: SP.sm,
    paddingVertical: 10,
    borderRadius: RAD.md,
  },
  rowActive: {
    backgroundColor: 'rgba(0,229,255,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,229,255,0.35)',
  },
  rowTitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: FS.sm,
    fontWeight: '700',
  },
  rowArtist: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FS.xs,
    marginTop: 1,
  },
});
