'use client';

import { Song, SortKey, SORT_LABEL } from '@/types';
import { memo, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BiSearch, BiMusic } from 'react-icons/bi';
import {
  IoMusicalNotes,
  IoHeart,
  IoClose,
  IoList,
  IoAddOutline,
  IoPlayForwardOutline,
} from 'react-icons/io5';

const FALLBACK_COVER =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Osu%21_Logo_2016.svg/240px-Osu%21_Logo_2016.svg.png';
const SORT_KEY = 'osu-radio-sort';
const SORT_OPTIONS: SortKey[] = ['artist', 'title', 'bpm', 'added'];

type Tab = 'all' | 'liked' | 'queue';

interface LibraryPanelProps {
  songs: Song[];
  currentIndex: number;
  likedSongs: Set<string>;
  isScanning: boolean;
  queueSongs: Song[];
  onSongSelect: (index: number) => void;
  onEnqueue: (id: string) => void;
  onPlayNext: (id: string) => void;
  onPlayFromQueue: (pos: number) => void;
  onRemoveFromQueue: (pos: number) => void;
  onClearQueue: () => void;
  onClose: () => void;
}

function Cover({ song, size }: { song: Song; size: string }): JSX.Element {
  return (
    <img
      src={`https://assets.ppy.sh/beatmaps/${song.beatmapSetID}/covers/list.jpg`}
      alt=""
      loading="lazy"
      onError={(e) => {
        e.currentTarget.src = FALLBACK_COVER;
      }}
      className={`${size} rounded-md object-cover flex-shrink-0`}
    />
  );
}

interface SongRowProps {
  song: Song;
  index: number;
  isActive: boolean;
  showBpm: boolean;
  onSelect: (index: number) => void;
  onEnqueue: (id: string) => void;
  onPlayNext: (id: string) => void;
}

const SongRow = memo(function SongRow({
  song,
  index,
  isActive,
  showBpm,
  onSelect,
  onEnqueue,
  onPlayNext,
}: SongRowProps): JSX.Element {
  return (
    <div
      onClick={() => onSelect(index)}
      className={`lib-row w-full text-left p-2 rounded-lg transition flex items-center gap-3 group cursor-pointer ${
        isActive ? 'bg-primary/20 ring-1 ring-primary/40' : 'hover:bg-white/5'
      }`}
    >
      <Cover song={song} size="w-11 h-11" />
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-medium truncate ${isActive ? 'text-primary' : 'text-white'}`}>
          {song.title}
        </div>
        <div className="text-xs text-white/50 truncate">
          {song.artist}
          {showBpm && song.bpm > 0 && <span className="text-white/30"> · {song.bpm} BPM</span>}
        </div>
      </div>
      <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlayNext(song.id);
          }}
          title="Play next"
          className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/15"
        >
          <IoPlayForwardOutline className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEnqueue(song.id);
          }}
          title="Add to queue"
          className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/15"
        >
          <IoAddOutline className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

function sortSongs(list: Song[], key: SortKey): Song[] {
  const copy = [...list];
  copy.sort((a, b) => {
    switch (key) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'bpm':
        return b.bpm - a.bpm || a.title.localeCompare(b.title);
      case 'added':
        return b.dateAdded - a.dateAdded;
      default:
        return a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title);
    }
  });
  return copy;
}

function LibraryPanelComponent({
  songs,
  currentIndex,
  likedSongs,
  isScanning,
  queueSongs,
  onSongSelect,
  onEnqueue,
  onPlayNext,
  onPlayFromQueue,
  onRemoveFromQueue,
  onClearQueue,
  onClose,
}: LibraryPanelProps): JSX.Element {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [sortKey, setSortKey] = useState<SortKey>('artist');

  useEffect(() => {
    const stored = localStorage.getItem(SORT_KEY) as SortKey | null;
    if (stored && SORT_OPTIONS.includes(stored)) setSortKey(stored);
  }, []);

  const changeSort = (key: SortKey): void => {
    setSortKey(key);
    localStorage.setItem(SORT_KEY, key);
  };

  const indexById = useMemo(() => {
    const m = new Map<string, number>();
    songs.forEach((s, i) => m.set(s.id, i));
    return m;
  }, [songs]);

  const currentId = songs[currentIndex]?.id;

  const displaySongs = useMemo(() => {
    const base = tab === 'liked' ? songs.filter((s) => likedSongs.has(s.id)) : songs;
    const q = query.trim().toLowerCase();
    const filtered = q
      ? base.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.artist.toLowerCase().includes(q) ||
            s.creator.toLowerCase().includes(q),
        )
      : base;
    return sortSongs(filtered, sortKey);
  }, [songs, likedSongs, tab, query, sortKey]);

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

        <div className="flex gap-1.5">
          {([
            ['all', <IoMusicalNotes key="i" className="w-4 h-4" />, 'All'],
            ['liked', <IoHeart key="i" className="w-4 h-4" />, `Liked (${likedSongs.size})`],
            ['queue', <IoList key="i" className="w-4 h-4" />, `Queue (${queueSongs.length})`],
          ] as const).map(([value, icon, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                tab === value ? 'bg-primary text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {icon}
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        {tab !== 'queue' && (
          <>
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
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <span>Sort</span>
              {SORT_OPTIONS.map((key) => (
                <button
                  key={key}
                  onClick={() => changeSort(key)}
                  className={`px-2 py-0.5 rounded-md transition ${
                    sortKey === key ? 'bg-white/15 text-white' : 'hover:text-white/70'
                  }`}
                >
                  {SORT_LABEL[key]}
                </button>
              ))}
            </div>
          </>
        )}

        {tab === 'queue' && queueSongs.length > 0 && (
          <button
            onClick={onClearQueue}
            className="w-full py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition"
          >
            Clear queue
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'queue' ? (
          queueSongs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40 px-6 text-center gap-3">
              <IoList className="w-10 h-10 opacity-40" />
              <p className="text-sm">Queue is empty. Hover a song and hit + to add it.</p>
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {queueSongs.map((song, pos) => (
                <div
                  key={`${song.id}-${pos}`}
                  onClick={() => onPlayFromQueue(pos)}
                  className="lib-row w-full text-left p-2 rounded-lg transition flex items-center gap-3 hover:bg-white/5 group cursor-pointer"
                >
                  <span className="text-xs text-white/30 w-4 text-center tabular-nums">{pos + 1}</span>
                  <Cover song={song} size="w-9 h-9" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate text-white">{song.title}</div>
                    <div className="text-xs text-white/50 truncate">{song.artist}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFromQueue(pos);
                    }}
                    title="Remove"
                    className="p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/15 opacity-0 group-hover:opacity-100 transition"
                  >
                    <IoClose className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : displaySongs.length === 0 ? (
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
            {displaySongs.map((song) => (
              <SongRow
                key={song.id}
                song={song}
                index={indexById.get(song.id) ?? -1}
                isActive={song.id === currentId}
                showBpm={sortKey === 'bpm'}
                onSelect={onSongSelect}
                onEnqueue={onEnqueue}
                onPlayNext={onPlayNext}
              />
            ))}
          </div>
        )}
      </div>
    </motion.aside>
  );
}

export const LibraryPanel = memo(LibraryPanelComponent);
