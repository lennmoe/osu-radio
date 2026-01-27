'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Song } from '@/types';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { SongSidebar } from '@/components/SongSidebar';
import { MediaPlayer } from '@/components/MediaPlayer';
import { NowPlaying } from '@/components/NowPlaying';
import { useLikes } from '@/hooks/useLikes';

export default function Home(): JSX.Element {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastDiscordUpdate = useRef<{ title: string; artist: string; isPlaying: boolean } | null>(null);
  const discordUpdateTimeout = useRef<NodeJS.Timeout | null>(null);
  const { likedSongs, toggleLike, isLiked } = useLikes();

  const currentSong = songs[currentIndex];

  const playSong = useCallback((index: number): void => {
    if (index < 0 || index >= songs.length) return;
    
    // Reset Discord update tracking when manually selecting a new song
    lastDiscordUpdate.current = null;
    
    setCurrentIndex(index);
    setIsPlaying(true);
    setTimeout(() => {
      audioRef.current?.play().catch(console.error);
    }, 100);
  }, [songs.length]);

  const handleShuffle = useCallback((): void => {
    if (songs.length === 0) return;
    const randomIndex = Math.floor(Math.random() * songs.length);
    playSong(randomIndex);
  }, [songs.length, playSong]);

  const handleToggleLike = useCallback((): void => {
    if (currentSong) {
      toggleLike(currentSong.id);
    }
  }, [currentSong, toggleLike]);

  const handlePrevious = useCallback((): void => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : songs.length - 1;
    playSong(newIndex);
  }, [currentIndex, songs.length, playSong]);

  const handleNext = useCallback((): void => {
    const newIndex = currentIndex < songs.length - 1 ? currentIndex + 1 : 0;
    playSong(newIndex);
  }, [currentIndex, songs.length, playSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;

    const updateTime = (): void => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };

    const handleEnded = (): void => {
      handleNext();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [volume, currentIndex, songs.length]);

  // Update Discord RPC when song changes or play state changes
  useEffect(() => {
    const song = songs[currentIndex];
    if (!song) return;

    const audio = audioRef.current;
    if (!audio) return;

    // Wait for audio metadata to load with timeout
    const updateDiscord = () => {
      const currentPos = audio.currentTime;
      const totalDuration = audio.duration;

      console.log('[App] Discord update:', { currentPos, totalDuration, isPlaying });

      fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song, isPlaying, currentTime: currentPos, duration: totalDuration }),
      }).catch(console.error);
    };

    // Try immediately if duration is available
    if (audio.duration > 0) {
      updateDiscord();
    } else {
      // Wait for metadata with timeout
      let attempts = 0;
      const maxAttempts = 10;
      const checkInterval = setInterval(() => {
        attempts++;
        console.log(`[App] Checking audio metadata (attempt ${attempts}):`, audio.duration);
        
        if (audio.duration > 0 || attempts >= maxAttempts) {
          clearInterval(checkInterval);
          updateDiscord();
        }
      }, 500);
    }
  }, [songs, currentIndex, isPlaying]);

  const handleScan = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/scan', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSongs(data.songs);
        console.warn(`[App] Loaded ${data.songs.length} songs`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = useCallback((): void => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback((time: number): void => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const handleVolumeChange = useCallback((newVolume: number): void => {
    setVolume(newVolume);
  }, []);

  const backgroundImage = currentSong 
    ? `https://assets.ppy.sh/beatmaps/${currentSong.beatmapSetID}/covers/raw.jpg` 
    : '';

  return (
    <div className="h-screen flex overflow-hidden">
      {backgroundImage && <AnimatedBackground imageUrl={backgroundImage} />}

      <div className="relative z-10 flex w-full">
        <SongSidebar
          songs={songs}
          currentIndex={currentIndex}
          onSongSelect={playSong}
          isLoading={isLoading}
          onScan={handleScan}
          likedSongs={likedSongs}
          onShuffle={handleShuffle}
        />

        <div className="flex-1 flex flex-col min-h-0">
          <NowPlaying currentSong={currentSong} />

          <MediaPlayer
            currentSong={currentSong}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            audioRef={audioRef}
            onTogglePlay={togglePlay}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onVolumeChange={setVolume}
            onSeek={handleSeek}
            isLiked={currentSong ? isLiked(currentSong.id) : false}
            onToggleLike={handleToggleLike}
          />
        </div>
      </div>
    </div>
  );
}
