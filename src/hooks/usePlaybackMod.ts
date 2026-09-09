'use client';

import { RefObject, useEffect, useRef } from 'react';
import { MOD_RATE, PlaybackMod } from '@/types';
import { NightcoreBeat } from '@/lib/nightcore';

interface Options {
  audioRef: RefObject<HTMLAudioElement>;
  mod: PlaybackMod;
  isPlaying: boolean;
  bpm: number;
  /** Bump this whenever the track changes so the rate/pitch get re-applied. */
  trackKey: string | number;
}

/**
 * Applies the osu!-style rate mods to the <audio> element:
 *  - DT / NC  -> playbackRate 1.5 with pitch shifted up (preservesPitch = false)
 *  - NC also layers a synthesised beat locked to the (rate-adjusted) map BPM.
 */
export function usePlaybackMod({ audioRef, mod, isPlaying, bpm, trackKey }: Options): void {
  const beatRef = useRef<NightcoreBeat | null>(null);

  // Rate + pitch on the audio element (also re-applied once metadata loads).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const rate = MOD_RATE[mod];
    // Only Nightcore shifts the pitch up; DT is a plain tempo speed-up.
    const keepPitch = mod !== 'nc';

    const apply = (): void => {
      audio.playbackRate = rate;
      audio.preservesPitch = keepPitch;
      (audio as unknown as { mozPreservesPitch?: boolean }).mozPreservesPitch = keepPitch;
      (audio as unknown as { webkitPreservesPitch?: boolean }).webkitPreservesPitch = keepPitch;
    };

    apply();
    audio.addEventListener('loadedmetadata', apply);
    return () => audio.removeEventListener('loadedmetadata', apply);
  }, [audioRef, mod, trackKey]);

  // Nightcore beat layer — runs only for NC while playing.
  useEffect(() => {
    if (mod !== 'nc' || !isPlaying) {
      beatRef.current?.stop();
      return;
    }

    const effectiveBpm = (bpm > 0 ? bpm : 180) * MOD_RATE.nc;
    if (!beatRef.current) beatRef.current = new NightcoreBeat(effectiveBpm);
    beatRef.current.setBpm(effectiveBpm);
    beatRef.current.start();

    return () => beatRef.current?.stop();
  }, [mod, isPlaying, bpm]);

  useEffect(() => () => beatRef.current?.stop(), []);
}
