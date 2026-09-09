'use client';

import { RefObject, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IoPlaySharp,
  IoPauseSharp,
  IoPlaySkipBackSharp,
  IoPlaySkipForwardSharp,
  IoShuffle,
  IoRepeat,
  IoHeart,
  IoHeartOutline,
} from 'react-icons/io5';
import { HiVolumeUp, HiVolumeOff } from 'react-icons/hi';
import { Song, PlaybackMod, RepeatMode } from '@/types';
import { ModSelector } from './ModSelector';

interface PlayerControlsProps {
  currentSong: Song;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  rate: number;
  volume: number;
  mod: PlaybackMod;
  repeat: RepeatMode;
  queueCount: number;
  audioRef: RefObject<HTMLAudioElement>;
  isLiked: boolean;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onShuffle: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onModChange: (mod: PlaybackMod) => void;
  onCycleRepeat: () => void;
  onToggleLike: () => void;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function PlayerControls({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  rate,
  volume,
  mod,
  repeat,
  queueCount,
  audioRef,
  isLiked,
  onTogglePlay,
  onPrevious,
  onNext,
  onShuffle,
  onSeek,
  onVolumeChange,
  onModChange,
  onCycleRepeat,
  onToggleLike,
}: PlayerControlsProps): JSX.Element {
  const [likePop, setLikePop] = useState(false);

  const handleLike = useCallback((): void => {
    onToggleLike();
    if (!isLiked) {
      setLikePop(true);
      setTimeout(() => setLikePop(false), 900);
    }
  }, [onToggleLike, isLiked]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
      className="w-full max-w-2xl flex flex-col gap-4"
    >
      <audio ref={audioRef} src={`/api/audio?path=${encodeURIComponent(currentSong.audioPath)}`} />

      {/* Seek bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs tabular-nums text-white/50 w-11 text-right">
          {formatTime(currentTime / rate)}
        </span>
        <div className="flex-1 relative group h-4 flex items-center">
          <div className="h-1 w-full bg-white/15 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="radio-range absolute inset-0"
            aria-label="Seek"
          />
        </div>
        <span className="text-xs tabular-nums text-white/50 w-11">
          {formatTime(duration / rate)}
        </span>
      </div>

      {/* Transport */}
      <div className="flex items-center justify-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onShuffle}
          className="p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition"
          aria-label="Shuffle"
        >
          <IoShuffle className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          onClick={onPrevious}
          className="p-2.5 rounded-xl hover:bg-white/10 transition"
          aria-label="Previous"
        >
          <IoPlaySkipBackSharp className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={onTogglePlay}
          className="p-4 bg-primary hover:bg-primary/90 rounded-full shadow-lg shadow-primary/30 transition"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isPlaying ? 'pause' : 'play'}
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ duration: 0.15 }}
              className="block"
            >
              {isPlaying ? <IoPauseSharp className="w-6 h-6" /> : <IoPlaySharp className="w-6 h-6" />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          onClick={onNext}
          className="p-2.5 rounded-xl hover:bg-white/10 transition"
          aria-label="Next"
        >
          <IoPlaySkipForwardSharp className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onCycleRepeat}
          className={`relative p-2.5 rounded-xl transition ${
            repeat === 'off'
              ? 'text-white/60 hover:text-white hover:bg-white/10'
              : 'text-primary bg-primary/15'
          }`}
          aria-label={`Repeat: ${repeat}`}
          title={`Repeat: ${repeat}`}
        >
          <IoRepeat className="w-5 h-5" />
          {repeat === 'one' && (
            <span className="absolute top-1 right-1 text-[9px] font-bold leading-none">1</span>
          )}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleLike}
          className={`relative p-2.5 rounded-xl transition ${
            isLiked ? 'text-primary bg-primary/15' : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
          aria-label={isLiked ? 'Unlike' : 'Like'}
        >
          {isLiked ? <IoHeart className="w-5 h-5" /> : <IoHeartOutline className="w-5 h-5" />}
          {likePop && (
            <motion.span
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.9 }}
              className="absolute inset-0 rounded-xl bg-primary"
            />
          )}
        </motion.button>
      </div>

      {/* Bottom row: volume + mods */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-40">
          <button
            onClick={() => onVolumeChange(volume === 0 ? 0.7 : 0)}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
            aria-label={volume === 0 ? 'Unmute' : 'Mute'}
          >
            {volume === 0 ? <HiVolumeOff className="w-4 h-4" /> : <HiVolumeUp className="w-4 h-4" />}
          </button>
          <div className="flex-1 relative group h-4 flex items-center">
            <div className="h-1 w-full bg-white/15 rounded-full overflow-hidden">
              <div className="h-full bg-white/70 rounded-full" style={{ width: `${volume * 100}%` }} />
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="radio-range absolute inset-0"
              aria-label="Volume"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {queueCount > 0 && (
            <span className="text-xs text-white/45 tabular-nums">{queueCount} queued</span>
          )}
          <ModSelector mod={mod} onChange={onModChange} />
        </div>
      </div>
    </motion.div>
  );
}
