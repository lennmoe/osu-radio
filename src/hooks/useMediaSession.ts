'use client';

import { RefObject, useEffect } from 'react';
import { Song } from '@/types';

interface Options {
  song: Song | undefined;
  isPlaying: boolean;
  rate: number;
  audioRef: RefObject<HTMLAudioElement>;
  onPlay: () => void;
  onPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
}

/**
 * Wires the OS media integration (hardware media keys + the Windows/macOS
 * "now playing" overlay) to the player via the Media Session API.
 */
export function useMediaSession({
  song,
  isPlaying,
  rate,
  audioRef,
  onPlay,
  onPause,
  onPrevious,
  onNext,
  onSeek,
}: Options): void {
  // Metadata + action handlers.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;

    if (song) {
      ms.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: `mapped by ${song.creator}`,
        artwork: [
          {
            src: `https://assets.ppy.sh/beatmaps/${song.beatmapSetID}/covers/list@2x.jpg`,
            sizes: '384x384',
            type: 'image/jpeg',
          },
        ],
      });
    }

    ms.setActionHandler('play', onPlay);
    ms.setActionHandler('pause', onPause);
    ms.setActionHandler('previoustrack', onPrevious);
    ms.setActionHandler('nexttrack', onNext);
    ms.setActionHandler('seekto', (details) => {
      if (details.seekTime != null) onSeek(details.seekTime);
    });

    return () => {
      ms.setActionHandler('play', null);
      ms.setActionHandler('pause', null);
      ms.setActionHandler('previoustrack', null);
      ms.setActionHandler('nexttrack', null);
      ms.setActionHandler('seekto', null);
    };
  }, [song, onPlay, onPause, onPrevious, onNext, onSeek]);

  // Playback state.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // Position (drives the OS scrubber; rate-aware for DT / NC).
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const audio = audioRef.current;
    if (!audio) return;

    const push = (): void => {
      if (!audio.duration || !Number.isFinite(audio.duration)) return;
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          position: Math.min(audio.currentTime, audio.duration),
          playbackRate: rate,
        });
      } catch {
        /* setPositionState throws if values are inconsistent mid-seek */
      }
    };

    push();
    audio.addEventListener('timeupdate', push);
    audio.addEventListener('loadedmetadata', push);
    return () => {
      audio.removeEventListener('timeupdate', push);
      audio.removeEventListener('loadedmetadata', push);
    };
  }, [audioRef, rate, song]);
}
