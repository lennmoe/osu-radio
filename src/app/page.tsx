'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MOD_LABEL, MOD_RATE, PlaybackMod, Song } from '@/types';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { TopBar } from '@/components/TopBar';
import { PlayerStage } from '@/components/PlayerStage';
import { PlayerControls } from '@/components/PlayerControls';
import { LibraryPanel } from '@/components/LibraryPanel';
import { useLikes } from '@/hooks/useLikes';
import { usePlaybackMod } from '@/hooks/usePlaybackMod';

export default function Home(): JSX.Element {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [mod, setMod] = useState<PlaybackMod>('none');
  const [isScanning, setIsScanning] = useState(true);
  const [libraryOpen, setLibraryOpen] = useState(true);

  const audioRef = useRef<HTMLAudioElement>(null);
  const { likedSongs, toggleLike, isLiked } = useLikes();

  const currentSong = songs[currentIndex];
  const rate = MOD_RATE[mod];

  usePlaybackMod({
    audioRef,
    mod,
    isPlaying,
    bpm: currentSong?.bpm ?? 0,
    trackKey: currentSong?.id ?? '',
  });

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

  // --- Playback controls --------------------------------------------------
  const playSong = useCallback(
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

  const handleShuffle = useCallback((): void => {
    if (songs.length === 0) return;
    playSong(Math.floor(Math.random() * songs.length));
  }, [songs.length, playSong]);

  const handlePrevious = useCallback((): void => {
    if (songs.length === 0) return;
    playSong(currentIndex > 0 ? currentIndex - 1 : songs.length - 1);
  }, [currentIndex, songs.length, playSong]);

  const handleNext = useCallback((): void => {
    if (songs.length === 0) return;
    playSong(currentIndex < songs.length - 1 ? currentIndex + 1 : 0);
  }, [currentIndex, songs.length, playSong]);

  const togglePlay = useCallback((): void => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(console.error);
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleSeek = useCallback((time: number): void => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const handleToggleLike = useCallback((): void => {
    if (currentSong) toggleLike(currentSong.id);
  }, [currentSong, toggleLike]);

  // --- Audio element wiring --------------------------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;

    const updateTime = (): void => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };
    const handleEnded = (): void => handleNext();

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [volume, currentIndex, handleNext]);

  // --- Discord Rich Presence ---------------------------------------------
  useEffect(() => {
    const song = songs[currentIndex];
    const audio = audioRef.current;
    if (!song || !audio) return;

    let cancelled = false;

    const push = (): void => {
      if (cancelled) return;
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
    };

    if (audio.duration > 0) {
      push();
      return;
    }

    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      if (audio.duration > 0 || attempts >= 10) {
        clearInterval(interval);
        push();
      }
    }, 500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [songs, currentIndex, isPlaying, mod, rate]);

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
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, handleNext, handlePrevious, handleToggleLike]);

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
          onRescan={() => void loadSongs(true)}
          onToggleLibrary={() => setLibraryOpen((v) => !v)}
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
                audioRef={audioRef}
                isLiked={isLiked(currentSong.id)}
                onTogglePlay={togglePlay}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onShuffle={handleShuffle}
                onSeek={handleSeek}
                onVolumeChange={setVolume}
                onModChange={setMod}
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
                onSongSelect={playSong}
                onClose={() => setLibraryOpen(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
