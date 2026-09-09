'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { IoRefresh, IoLibrary } from 'react-icons/io5';

interface TopBarProps {
  songCount: number;
  isScanning: boolean;
  libraryOpen: boolean;
  onRescan: () => void;
  onToggleLibrary: () => void;
}

function TopBarComponent({ songCount, isScanning, libraryOpen, onRescan, onToggleLibrary }: TopBarProps): JSX.Element {
  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex-shrink-0 h-14 px-5 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-xl"
    >
      <div className="flex items-baseline gap-2 select-none">
        <span className="text-lg font-extrabold tracking-tight">
          osu<span className="text-primary">!</span>radio
        </span>
        <span className="text-xs text-white/40">{songCount} tracks</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onRescan}
          disabled={isScanning}
          title="Rescan library"
          className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition disabled:opacity-40"
        >
          <IoRefresh className={`w-[18px] h-[18px] ${isScanning ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={onToggleLibrary}
          title="Toggle library"
          className={`p-2 rounded-lg transition ${
            libraryOpen ? 'text-primary bg-primary/15' : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <IoLibrary className="w-[18px] h-[18px]" />
        </button>
      </div>
    </motion.header>
  );
}

export const TopBar = memo(TopBarComponent);
