'use client';

import { Song } from '@/types';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BiSearch, BiMusic } from 'react-icons/bi';
import { IoMusicalNotes, IoHeart, IoClose } from 'react-icons/io5';

const FALLBACK_COVER =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Osu%21_Logo_2016.svg/240px-Osu%21_Logo_2016.svg.png';

interface LibraryPanelProps {
  songs: Song[];
  currentIndex: number;
  likedSongs: Set<string>;
  isScanning: boolean;
  onSongSelect: (index: number) => void;
  onClose: () => void;
}

export function LibraryPanel({
  songs,
  currentIndex,
  likedSongs,
  isScanning,
  onSongSelect,
  onClose,
}: LibraryPanelProps): JSX.Element {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'all' | 'liked'>('all');

  const displaySongs = useMemo(() => {
    const base = tab === 'liked' ? songs.filter((s) => likedSongs.has(s.id)) : songs;
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.creator.toLowerCase().includes(q),
    );
  }, [songs, likedSongs, tab, query]);

  return (
    <motion.aside
      initial={{ x: 340, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 340, opacity: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      className="w-80 flex-shrink-0 h-full bg-black/40 backdrop-blur-2xl border-l border-white/10 flex flex-col"
    >
      <div className="p-4 border-b border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-white/70">Library</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
            aria-label="Close library"
          >
            <IoClose className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2">
          {(['all', 'liked'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition ${
                tab === t ? 'bg-primary text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {t === 'all' ? <IoMusicalNotes className="w-4 h-4" /> : <IoHeart className="w-4 h-4" />}
              {t === 'all' ? 'All' : `Liked (${likedSongs.size})`}
            </button>
          ))}
        </div>

        <div className="relative">
          <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/15 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-primary transition"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {displaySongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/40 px-6 text-center gap-3">
            <BiMusic className="w-10 h-10 opacity-40" />
            <p className="text-sm">
              {isScanning
                ? 'Scanning your osu! Songs folder…'
                : songs.length === 0
                  ? 'No songs found. Check your OSU_PATH.'
                  : 'No matches'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {displaySongs.map((song) => {
              const actualIndex = songs.indexOf(song);
              const isActive = actualIndex === currentIndex;
              return (
                <button
                  key={song.id}
                  onClick={() => onSongSelect(actualIndex)}
                  className={`w-full text-left p-2 rounded-lg transition flex items-center gap-3 ${
                    isActive ? 'bg-primary/20 ring-1 ring-primary/40' : 'hover:bg-white/5'
                  }`}
                >
                  <img
                    src={`https://assets.ppy.sh/beatmaps/${song.beatmapSetID}/covers/list.jpg`}
                    alt=""
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_COVER;
                    }}
                    className="w-11 h-11 rounded-md object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-sm font-medium truncate ${isActive ? 'text-primary' : 'text-white'}`}
                    >
                      {song.title}
                    </div>
                    <div className="text-xs text-white/50 truncate">{song.artist}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </motion.aside>
  );
}
