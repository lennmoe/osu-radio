'use client';

import { useCallback, useEffect, useState } from 'react';
import { Playlist } from '@/types';

const PLAYLISTS_KEY = 'osu-radio-playlists';

function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(PLAYLISTS_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) setPlaylists(parsed);
    } catch (error) {
      console.error('Failed to parse playlists:', error);
    }
  }, []);

  const update = useCallback((fn: (prev: Playlist[]) => Playlist[]): void => {
    setPlaylists((prev) => {
      const next = fn(prev);
      localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const createPlaylist = useCallback(
    (name: string, songIds: string[] = []): string => {
      const id = newId();
      update((prev) => [...prev, { id, name, songIds: Array.from(new Set(songIds)), createdAt: Date.now() }]);
      return id;
    },
    [update],
  );

  const renamePlaylist = useCallback(
    (id: string, name: string): void => {
      update((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
    },
    [update],
  );

  const deletePlaylist = useCallback(
    (id: string): void => {
      update((prev) => prev.filter((p) => p.id !== id));
    },
    [update],
  );

  const addToPlaylist = useCallback(
    (id: string, songId: string): void => {
      update((prev) =>
        prev.map((p) =>
          p.id === id && !p.songIds.includes(songId) ? { ...p, songIds: [...p.songIds, songId] } : p,
        ),
      );
    },
    [update],
  );

  const removeFromPlaylist = useCallback(
    (id: string, songId: string): void => {
      update((prev) =>
        prev.map((p) => (p.id === id ? { ...p, songIds: p.songIds.filter((s) => s !== songId) } : p)),
      );
    },
    [update],
  );

  return { playlists, createPlaylist, renamePlaylist, deletePlaylist, addToPlaylist, removeFromPlaylist };
}
