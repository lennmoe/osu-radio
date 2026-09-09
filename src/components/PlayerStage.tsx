'use client';

import { Song } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { BiMusic } from 'react-icons/bi';

const FALLBACK_COVER =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Osu%21_Logo_2016.svg/240px-Osu%21_Logo_2016.svg.png';

interface PlayerStageProps {
  currentSong: Song | undefined;
  isPlaying: boolean;
}

export function PlayerStage({ currentSong, isPlaying }: PlayerStageProps): JSX.Element {
  if (!currentSong) {
    return (
      <div className="flex flex-col items-center gap-5 text-white/50">
        <motion.div
          animate={{ scale: [1, 1.08, 1], rotate: [0, 6, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <BiMusic className="w-20 h-20 opacity-30" />
        </motion.div>
        <p className="text-lg font-medium">Nothing playing</p>
        <p className="text-sm text-white/35">Pick a track from the library</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSong.id}
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative"
        >
          <div
            className={`absolute -inset-6 rounded-[2rem] bg-primary/25 blur-3xl transition-opacity duration-700 ${
              isPlaying ? 'opacity-100' : 'opacity-40'
            }`}
          />
          <img
            src={`https://assets.ppy.sh/beatmaps/${currentSong.beatmapSetID}/covers/list@2x.jpg`}
            alt={currentSong.title}
            onError={(e) => {
              e.currentTarget.src = FALLBACK_COVER;
            }}
            className={`relative w-56 h-56 md:w-64 md:h-64 rounded-2xl object-cover shadow-2xl ring-1 ring-white/10 ${
              isPlaying ? 'animate-radio-float' : ''
            }`}
          />
        </motion.div>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentSong.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="text-center max-w-xl px-4"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg truncate">
            {currentSong.title}
          </h1>
          <p className="text-base md:text-lg text-white/70 mt-1 truncate">{currentSong.artist}</p>
          <p className="text-xs text-white/40 mt-2">
            mapped by {currentSong.creator}
            {currentSong.bpm > 0 && <span> · {currentSong.bpm} BPM</span>}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
