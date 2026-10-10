'use client';

import { useCallback, useEffect, useState } from 'react';

const LIKES_KEY = 'osu-radio-likes';

export function useLikes() {
  const [likedSongs, setLikedSongs] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const stored = localStorage.getItem(LIKES_KEY);
    if (!stored) return;
    try {
      setLikedSongs(new Set(JSON.parse(stored)));
    } catch (error) {
      console.error('Failed to parse liked songs:', error);
    }
  }, []);

  const toggleLike = useCallback((songId: string): void => {
    setLikedSongs((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      localStorage.setItem(LIKES_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const isLiked = useCallback((songId: string): boolean => likedSongs.has(songId), [likedSongs]);

  return { likedSongs, toggleLike, isLiked };
}
