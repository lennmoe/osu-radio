'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { MOD_LABEL, MOD_RATE, PlaybackMod, Playlist, RepeatMode, Song } from '@/types';
import { coverUrl, shuffled } from '@/lib/songs';
import { useLikes } from '@/hooks/useLikes';
import { usePlaylists } from '@/hooks/usePlaylists';
import { usePlaybackMod } from '@/hooks/usePlaybackMod';
import { useAccentColor } from '@/hooks/useAccentColor';
import { useMediaSession } from '@/hooks/useMediaSession';

const REPEAT_KEY = 'osu-radio-repeat';

export interface PlayerApi {
  songs: Song[];
  songsById: Map<string, Song>;
  isScanning: boolean;
  rescan: () => void;

  currentSong: Song | undefined;
  isPlaying: boolean;
  volume: number;
  mod: PlaybackMod;
  rate: number;
  repeat: RepeatMode;
  queue: Song[];

  /** Plays `id`; next/previous then walk `context` (defaults to the whole library). */
  playSong: (id: string, context?: string[]) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  shuffle: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setMod: (mod: PlaybackMod) => void;
  cycleRepeat: () => void;

  enqueue: (id: string) => void;
  playNext: (id: string) => void;
  removeFromQueue: (pos: number) => void;
  clearQueue: () => void;
  playFromQueue: (pos: number) => void;

  likedSongs: Set<string>;
  isLiked: (id: string) => boolean;
  toggleLike: (id: string) => void;

  playlists: Playlist[];
  createPlaylist: (name: string, songIds?: string[]) => string;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (id: string, songId: string) => void;
  removeFromPlaylist: (id: string, songId: string) => void;
  playPlaylist: (id: string, shuffle?: boolean) => void;
}

interface PlaybackTime {
  currentTime: number;
  duration: number;
}

const PlayerContext = createContext<PlayerApi | null>(null);
// Split out so the 4Hz `timeupdate` only re-renders progress UI, not every consumer.
const TimeContext = createContext<PlaybackTime>({ currentTime: 0, duration: 0 });

export function usePlayer(): PlayerApi {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside <PlayerProvider>');
  return ctx;
}

export function usePlaybackTime(): PlaybackTime {
  return useContext(TimeContext);
}

function safePlay(audio: HTMLAudioElement | null): void {
  audio?.play().catch((err: unknown) => {
    if (!(err instanceof DOMException && err.name === 'AbortError')) console.error(err);
  });
}

export function PlayerProvider({ children }: { children: ReactNode }): JSX.Element {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [context, setContext] = useState<string[] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playToken, setPlayToken] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [mod, setMod] = useState<PlaybackMod>('none');
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [queueIds, setQueueIds] = useState<string[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const { likedSongs, toggleLike, isLiked } = useLikes();
  const {
    playlists,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
  } = usePlaylists();

  const songsById = useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs]);
  const currentSong = (currentId ? songsById.get(currentId) : undefined) ?? songs[0];
  const rate = MOD_RATE[mod];
  const queue = useMemo(
    () => queueIds.map((id) => songsById.get(id)).filter((s): s is Song => Boolean(s)),
    [queueIds, songsById],
  );

  // Stable callbacks read the freshest state from here instead of closing over it.
  const latest = useRef({ songs, songsById, currentSong, context, queueIds, repeat, isPlaying, playlists });
  latest.current = { songs, songsById, currentSong, context, queueIds, repeat, isPlaying, playlists };

  const contextIds = useCallback((): string[] => {
    const { context: ctx, songs: all } = latest.current;
    return ctx && ctx.length > 0 ? ctx : all.map((s) => s.id);
  }, []);

  const startTrack = useCallback((id: string): void => {
    const audio = audioRef.current;
    if (audio && id === latest.current.currentSong?.id) audio.currentTime = 0;
    setCurrentId(id);
    setIsPlaying(true);
    setPlayToken((t) => t + 1);
  }, []);

  useEffect(() => {
    if (playToken > 0) safePlay(audioRef.current);
  }, [playToken]);

  // --- Library scanning -----------------------------------------------------
  const loadSongs = useCallback(async (refresh: boolean): Promise<void> => {
    setIsScanning(true);
    try {
      const res = await fetch(`/api/scan${refresh ? '?refresh=1' : ''}`);
      const data = await res.json();
      if (data.success) setSongs(data.songs as Song[]);
    } catch (error) {
      console.error('[App] scan failed', error);
    } finally {
      setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    void loadSongs(false);
  }, [loadSongs]);

  const rescan = useCallback(() => void loadSongs(true), [loadSongs]);

  // --- Repeat mode persistence ---------------------------------------------
  useEffect(() => {
    const stored = localStorage.getItem(REPEAT_KEY);
    if (stored === 'off' || stored === 'all' || stored === 'one') setRepeat(stored);
  }, []);

  const cycleRepeat = useCallback((): void => {
    setRepeat((r) => {
      const next: RepeatMode = r === 'off' ? 'all' : r === 'all' ? 'one' : 'off';
      localStorage.setItem(REPEAT_KEY, next);
      return next;
    });
  }, []);

  // --- Transport ------------------------------------------------------------
  const playSong = useCallback(
    (id: string, ctx?: string[]): void => {
      if (ctx) setContext(ctx);
      startTrack(id);
    },
    [startTrack],
  );

  const consumeQueue = useCallback((): boolean => {
    const { queueIds: ids, songsById: byId } = latest.current;
    const idx = ids.findIndex((id) => byId.has(id));
    if (idx < 0) {
      if (ids.length > 0) setQueueIds([]);
      return false;
    }
    setQueueIds(ids.slice(idx + 1));
    startTrack(ids[idx]);
    return true;
  }, [startTrack]);

  const next = useCallback((): void => {
    if (consumeQueue()) return;
    const ids = contextIds();
    if (ids.length === 0) return;
    const i = ids.indexOf(latest.current.currentSong?.id ?? '');
    startTrack(ids[(i + 1) % ids.length]);
  }, [consumeQueue, contextIds, startTrack]);

  const previous = useCallback((): void => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const ids = contextIds();
    if (ids.length === 0) return;
    const i = ids.indexOf(latest.current.currentSong?.id ?? '');
    startTrack(ids[i <= 0 ? ids.length - 1 : i - 1]);
  }, [contextIds, startTrack]);

  const shuffle = useCallback((): void => {
    const ids = contextIds();
    if (ids.length === 0) return;
    const current = latest.current.currentSong?.id;
    let pick = ids[Math.floor(Math.random() * ids.length)];
    while (ids.length > 1 && pick === current) pick = ids[Math.floor(Math.random() * ids.length)];
    startTrack(pick);
  }, [contextIds, startTrack]);

  const play = useCallback((): void => {
    if (!latest.current.currentSong) return;
    safePlay(audioRef.current);
    setIsPlaying(true);
  }, []);

  const pause = useCallback((): void => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback((): void => {
    if (latest.current.isPlaying) pause();
    else play();
  }, [play, pause]);

  const seek = useCallback((time: number): void => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  // --- Queue ----------------------------------------------------------------
  const enqueue = useCallback((id: string): void => {
    setQueueIds((q) => (q.includes(id) ? q : [...q, id]));
  }, []);

  const playNext = useCallback((id: string): void => {
    setQueueIds((q) => [id, ...q.filter((x) => x !== id)]);
  }, []);

  const removeFromQueue = useCallback((pos: number): void => {
    setQueueIds((q) => q.filter((_, i) => i !== pos));
  }, []);

  const clearQueue = useCallback((): void => setQueueIds([]), []);

  const playFromQueue = useCallback(
    (pos: number): void => {
      const id = latest.current.queueIds[pos];
      if (!id) return;
      setQueueIds((q) => q.filter((_, i) => i !== pos));
      startTrack(id);
    },
    [startTrack],
  );

  // --- Playlists ------------------------------------------------------------
  const playPlaylist = useCallback(
    (id: string, shuffle = false): void => {
      const { playlists: all, songsById: byId } = latest.current;
      const playlist = all.find((p) => p.id === id);
      if (!playlist) return;
      const available = playlist.songIds.filter((sid) => byId.has(sid));
      const ids = shuffle ? shuffled(available) : available;
      if (ids.length === 0) return;
      setContext(ids);
      startTrack(ids[0]);
    },
    [startTrack],
  );

  // --- Audio element wiring -------------------------------------------------
  const handleEnded = useCallback((): void => {
    const audio = audioRef.current;
    if (latest.current.repeat === 'one' && audio) {
      audio.currentTime = 0;
      safePlay(audio);
      return;
    }
    if (consumeQueue()) return;
    const ids = contextIds();
    const i = ids.indexOf(latest.current.currentSong?.id ?? '');
    if (ids.length === 0 || (latest.current.repeat === 'off' && i >= ids.length - 1)) {
      setIsPlaying(false);
      return;
    }
    startTrack(ids[(i + 1) % ids.length]);
  }, [consumeQueue, contextIds, startTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const sync = (): void => {
      setCurrentTime(audio.currentTime);
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };

    const events = ['timeupdate', 'loadedmetadata', 'durationchange', 'emptied'] as const;
    events.forEach((e) => audio.addEventListener(e, sync));
    audio.addEventListener('ended', handleEnded);
    return () => {
      events.forEach((e) => audio.removeEventListener(e, sync));
      audio.removeEventListener('ended', handleEnded);
    };
  }, [handleEnded]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  usePlaybackMod({ audioRef, mod, trackKey: currentSong?.id ?? '' });
  useAccentColor(currentSong ? coverUrl(currentSong.beatmapSetID, 'list@2x') : '');

  // --- Discord Rich Presence ------------------------------------------------
  // Debounced so rapid track-skipping only sends the final state. Re-runs
  // once `duration` lands (0 -> N) so the presence gets a progress bar.
  useEffect(() => {
    const audio = audioRef.current;
    if (!currentSong || !audio) return;

    const timer = setTimeout(() => {
      fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          song: currentSong,
          isPlaying,
          currentTime: audio.currentTime,
          duration: audio.duration,
          rate,
          modLabel: MOD_LABEL[mod],
        }),
      }).catch(console.error);
    }, 300);

    return () => clearTimeout(timer);
  }, [currentSong, isPlaying, mod, rate, duration]);

  useMediaSession({
    song: currentSong,
    isPlaying,
    rate,
    audioRef,
    onPlay: play,
    onPause: pause,
    onPrevious: previous,
    onNext: next,
    onSeek: seek,
  });

  // --- Keyboard shortcuts ---------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        next();
      } else if (e.code === 'ArrowLeft') {
        previous();
      } else if (key === 'l') {
        const song = latest.current.currentSong;
        if (song) toggleLike(song.id);
      } else if (key === 'r') {
        cycleRepeat();
      } else if (key === 's') {
        shuffle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, next, previous, toggleLike, cycleRepeat, shuffle]);

  const api = useMemo<PlayerApi>(
    () => ({
      songs,
      songsById,
      isScanning,
      rescan,
      currentSong,
      isPlaying,
      volume,
      mod,
      rate,
      repeat,
      queue,
      playSong,
      play,
      pause,
      togglePlay,
      next,
      previous,
      shuffle,
      seek,
      setVolume,
      setMod,
      cycleRepeat,
      enqueue,
      playNext,
      removeFromQueue,
      clearQueue,
      playFromQueue,
      likedSongs,
      isLiked,
      toggleLike,
      playlists,
      createPlaylist,
      renamePlaylist,
      deletePlaylist,
      addToPlaylist,
      removeFromPlaylist,
      playPlaylist,
    }),
    [
      songs,
      songsById,
      isScanning,
      rescan,
      currentSong,
      isPlaying,
      volume,
      mod,
      rate,
      repeat,
      queue,
      playSong,
      play,
      pause,
      togglePlay,
      next,
      previous,
      shuffle,
      seek,
      cycleRepeat,
      enqueue,
      playNext,
      removeFromQueue,
      clearQueue,
      playFromQueue,
      likedSongs,
      isLiked,
      toggleLike,
      playlists,
      createPlaylist,
      renamePlaylist,
      deletePlaylist,
      addToPlaylist,
      removeFromPlaylist,
      playPlaylist,
    ],
  );

  const time = useMemo(() => ({ currentTime, duration }), [currentTime, duration]);

  return (
    <PlayerContext.Provider value={api}>
      <TimeContext.Provider value={time}>
        <audio
          ref={audioRef}
          src={currentSong ? `/api/audio?path=${encodeURIComponent(currentSong.audioPath)}` : undefined}
          preload="auto"
        />
        {children}
      </TimeContext.Provider>
    </PlayerContext.Provider>
  );
}
