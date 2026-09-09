'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MOD_LABEL, MOD_RATE, PlaybackMod, RepeatMode, Song } from '@/types';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { TopBar } from '@/components/TopBar';
import { PlayerStage } from '@/components/PlayerStage';
import { PlayerControls } from '@/components/PlayerControls';
import { LibraryPanel } from '@/components/LibraryPanel';
import { useLikes } from '@/hooks/useLikes';
import { usePlaybackMod } from '@/hooks/usePlaybackMod';
import { useAccentColor } from '@/hooks/useAccentColor';
import { useMediaSession } from '@/hooks/useMediaSession';

const REPEAT_KEY = 'osu-radio-repeat';

export default function Home(): JSX.Element {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [mod, setMod] = useState<PlaybackMod>('none');
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [queue, setQueue] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [libraryOpen, setLibraryOpen] = useState(true);

  const audioRef = useRef<HTMLAudioElement>(null);
  const { likedSongs, toggleLike, isLiked } = useLikes();

  const currentSong = songs[currentIndex];
  const rate = MOD_RATE[mod];

  const songsById = useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs]);
  const queueSongs = useMemo(
    () => queue.map((id) => songsById.get(id)).filter((s): s is Song => Boolean(s)),
    [queue, songsById],
  );

  const coverUrl = currentSong
    ? `https://assets.ppy.sh/beatmaps/${currentSong.beatmapSetID}/covers/list@2x.jpg`
    : '';

  usePlaybackMod({
    audioRef,
    mod,
    isPlaying,
    bpm: currentSong?.bpm ?? 0,
    trackKey: currentSong?.id ?? '',
  });
  useAccentColor(coverUrl);

  // --- Repeat mode persistence -------------------------------------------
  useEffect(() => {
    const stored = localStorage.getItem(REPEAT_KEY) as RepeatMode | null;
    if (stored === 'off' || stored === 'all' || stored === 'one') setRepeat(stored);
  }, []);

  const cycleRepeat = useCallback((): void => {
    setRepeat((r) => {
      const next: RepeatMode = r === 'off' ? 'all' : r === 'all' ? 'one' : 'off';
      localStorage.setItem(REPEAT_KEY, next);
      return next;
    });
  }, []);

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
  const toggleLibrary = useCallback(() => setLibraryOpen((v) => !v), []);
  const closeLibrary = useCallback(() => setLibraryOpen(false), []);

  // --- Playback controls --------------------------------------------------
  const playByIndex = useCallback(
    (index: number): void => {
      if (index < 0 || index >= songs.length) return;
      setCurrentIndex(index);
      setIsPlaying(true);
      setTimeout(() => {
        audioRef.current?.play().catch(console.error);
      }, 100);
    },
    [songs.length],
  );

  const consumeQueue = useCallback((): boolean => {
    if (queue.length === 0) return false;
    const [nextId, ...rest] = queue;
    setQueue(rest);
    const idx = songs.findIndex((s) => s.id === nextId);
    if (idx >= 0) {
      playByIndex(idx);
      return true;
    }
    return false;
  }, [queue, songs, playByIndex]);

  const handleShuffle = useCallback((): void => {
    if (songs.length === 0) return;
    playByIndex(Math.floor(Math.random() * songs.length));
  }, [songs.length, playByIndex]);

  const handlePrevious = useCallback((): void => {
    if (songs.length === 0) return;
    playByIndex(currentIndex > 0 ? currentIndex - 1 : songs.length - 1);
  }, [currentIndex, songs.length, playByIndex]);

  const handleNext = useCallback((): void => {
    if (songs.length === 0) return;
    if (consumeQueue()) return;
    playByIndex(currentIndex < songs.length - 1 ? currentIndex + 1 : 0);
  }, [songs.length, currentIndex, consumeQueue, playByIndex]);

  const play = useCallback((): void => {
    audioRef.current?.play().catch(console.error);
    setIsPlaying(true);
  }, []);

  const pause = useCallback((): void => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback((): void => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const handleSeek = useCallback((time: number): void => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const handleToggleLike = useCallback((): void => {
    if (currentSong) toggleLike(currentSong.id);
  }, [currentSong, toggleLike]);

  // --- Queue mutators ---------------------------------------------------
  const enqueue = useCallback((id: string): void => {
    setQueue((q) => (q.includes(id) ? q : [...q, id]));
  }, []);

  const playNextInQueue = useCallback((id: string): void => {
    setQueue((q) => [id, ...q.filter((x) => x !== id)]);
  }, []);

  const removeFromQueue = useCallback((pos: number): void => {
    setQueue((q) => q.filter((_, i) => i !== pos));
  }, []);

  const clearQueue = useCallback((): void => setQueue([]), []);

  const playFromQueue = useCallback(
    (pos: number): void => {
      const id = queue[pos];
      if (!id) return;
      const idx = songs.findIndex((s) => s.id === id);
      setQueue((q) => q.filter((_, i) => i !== pos));
      if (idx >= 0) playByIndex(idx);
    },
    [queue, songs, playByIndex],
  );

  // --- Audio element wiring --------------------------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;

    const updateTime = (): void => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };

    const handleEnded = (): void => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play().catch(console.error);
        return;
      }
      if (consumeQueue()) return;
      if (repeat === 'off' && currentIndex >= songs.length - 1) {
        setIsPlaying(false);
        return;
      }
      playByIndex(currentIndex < songs.length - 1 ? currentIndex + 1 : 0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [volume, currentIndex, repeat, songs.length, consumeQueue, playByIndex]);

  // --- Discord Rich Presence -------------------------------------------
  // Debounced so rapid track-skipping only sends the final state. Re-runs
  // once `duration` lands (0 -> N) so the presence gets a progress bar.
  useEffect(() => {
    const song = songs[currentIndex];
    const audio = audioRef.current;
    if (!song || !audio) return;

    const timer = setTimeout(() => {
      fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          song,
          isPlaying,
          currentTime: audio.currentTime,
          duration: audio.duration,
          rate,
          modLabel: MOD_LABEL[mod],
        }),
      }).catch(console.error);
    }, 300);

    return () => clearTimeout(timer);
  }, [songs, currentIndex, isPlaying, mod, rate, duration]);

  useMediaSession({
    song: currentSong,
    isPlaying,
    rate,
    audioRef,
    onPlay: play,
    onPause: pause,
    onPrevious: handlePrevious,
    onNext: handleNext,
    onSeek: handleSeek,
  });

  // --- Keyboard shortcuts -------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key.toLowerCase() === 'l') {
        handleToggleLike();
      } else if (e.key.toLowerCase() === 'r') {
        cycleRepeat();
      } else if (e.key.toLowerCase() === 's') {
        handleShuffle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, handleNext, handlePrevious, handleToggleLike, cycleRepeat, handleShuffle]);

  const backgroundImage = currentSong
    ? `https://assets.ppy.sh/beatmaps/${currentSong.beatmapSetID}/covers/raw.jpg`
    : '';

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {backgroundImage && <AnimatedBackground imageUrl={backgroundImage} />}

      <div className="relative z-10 flex flex-col h-full">
        <TopBar
          songCount={songs.length}
          isScanning={isScanning}
          libraryOpen={libraryOpen}
          onRescan={rescan}
          onToggleLibrary={toggleLibrary}
        />

        <div className="flex-1 flex min-h-0">
          <main className="flex-1 flex flex-col items-center justify-center gap-10 px-8 min-w-0">
            <PlayerStage currentSong={currentSong} isPlaying={isPlaying} />

            {currentSong && (
              <PlayerControls
                currentSong={currentSong}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                rate={rate}
                volume={volume}
                mod={mod}
                repeat={repeat}
                queueCount={queueSongs.length}
                audioRef={audioRef}
                isLiked={isLiked(currentSong.id)}
                onTogglePlay={togglePlay}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onShuffle={handleShuffle}
                onSeek={handleSeek}
                onVolumeChange={setVolume}
                onModChange={setMod}
                onCycleRepeat={cycleRepeat}
                onToggleLike={handleToggleLike}
              />
            )}
          </main>

          <AnimatePresence>
            {libraryOpen && (
              <LibraryPanel
                songs={songs}
                currentIndex={currentIndex}
                likedSongs={likedSongs}
                isScanning={isScanning}
                queueSongs={queueSongs}
                onSongSelect={playByIndex}
                onEnqueue={enqueue}
                onPlayNext={playNextInQueue}
                onPlayFromQueue={playFromQueue}
                onRemoveFromQueue={removeFromQueue}
                onClearQueue={clearQueue}
                onClose={closeLibrary}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
