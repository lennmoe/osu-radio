'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Song, SortKey } from '@/types';
import { usePlayer } from '@/components/PlayerProvider';
import { matchesQuery, sortSongs } from '@/lib/songs';

/** `playlists` is the playlist index; `playlist:<id>` is one playlist's tracks. */
export type LibraryView = 'all' | 'liked' | 'queue' | 'playlists' | `playlist:${string}`;

export const SORT_OPTIONS: SortKey[] = ['artist', 'title', 'bpm', 'added'];
const SORT_KEY = 'osu-radio-sort';

export const playlistView = (id: string): LibraryView => `playlist:${id}`;

export function useLibraryView(initial: LibraryView = 'all') {
  const { songs, songsById, likedSongs, playlists, queue, playSong, playFromQueue } = usePlayer();
  const [view, setView] = useState<LibraryView>(initial);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKeyState] = useState<SortKey>('artist');

  useEffect(() => {
    const stored = localStorage.getItem(SORT_KEY) as SortKey | null;
    if (stored && SORT_OPTIONS.includes(stored)) setSortKeyState(stored);
  }, []);

  const setSortKey = useCallback((key: SortKey): void => {
    setSortKeyState(key);
    localStorage.setItem(SORT_KEY, key);
  }, []);

  const playlistId = view.startsWith('playlist:') ? view.slice('playlist:'.length) : null;
  const playlist = playlistId ? playlists.find((p) => p.id === playlistId) : undefined;

  useEffect(() => {
    if (playlistId && !playlist) setView('playlists');
  }, [playlistId, playlist]);

  const items = useMemo((): Song[] => {
    if (view === 'queue') return queue;
    if (view === 'playlists') return [];

    let base: Song[];
    if (view === 'liked') base = songs.filter((s) => likedSongs.has(s.id));
    else if (playlist) base = playlist.songIds.map((id) => songsById.get(id)).filter((s): s is Song => Boolean(s));
    else base = songs;

    const q = query.trim().toLowerCase();
    const filtered = q ? base.filter((s) => matchesQuery(s, q)) : base;
    // Playlists keep the order tracks were added in.
    return playlist ? filtered : sortSongs(filtered, sortKey);
  }, [view, queue, songs, likedSongs, playlist, songsById, query, sortKey]);

  const ids = useMemo(() => items.map((s) => s.id), [items]);

  const playAt = useCallback(
    (index: number): void => {
      if (view === 'queue') {
        playFromQueue(index);
        return;
      }
      const song = items[index];
      if (song) playSong(song.id, ids);
    },
    [view, items, ids, playSong, playFromQueue],
  );

  return {
    view,
    setView,
    query,
    setQuery,
    sortKey,
    setSortKey,
    items,
    playlist,
    isSortable: view === 'all' || view === 'liked',
    isSearchable: view !== 'queue' && view !== 'playlists',
    playAt,
  };
}
