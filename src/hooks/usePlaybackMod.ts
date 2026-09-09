'use client';

import { RefObject, useEffect } from 'react';
import { MOD_RATE, PlaybackMod } from '@/types';

interface Options {
  audioRef: RefObject<HTMLAudioElement>;
  mod: PlaybackMod;
  /** Bump this whenever the track changes so the rate gets re-applied. */
  trackKey: string | number;
}

/**
 * Applies the DT rate mod to the <audio> element: playbackRate 1.5 with the
 * pitch preserved (a plain tempo speed-up, no added effects).
 */
export function usePlaybackMod({ audioRef, mod, trackKey }: Options): void {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const rate = MOD_RATE[mod];

    const apply = (): void => {
      audio.playbackRate = rate;
      audio.preservesPitch = true;
      (audio as unknown as { mozPreservesPitch?: boolean }).mozPreservesPitch = true;
      (audio as unknown as { webkitPreservesPitch?: boolean }).webkitPreservesPitch = true;
    };

    apply();
    audio.addEventListener('loadedmetadata', apply);
    return () => audio.removeEventListener('loadedmetadata', apply);
  }, [audioRef, mod, trackKey]);
}
