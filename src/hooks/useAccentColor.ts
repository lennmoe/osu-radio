'use client';

import { useEffect } from 'react';

const DEFAULT_PRIMARY = '333 90% 62%'; // osu! pink

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}

/**
 * Pulls a vivid accent colour out of the current cover art and writes it to
 * the `--primary` CSS variable, so the whole UI tints to match the song.
 * Falls back to the osu! pink on any failure (e.g. CORS-tainted canvas).
 */
export function useAccentColor(imageUrl: string): void {
  useEffect(() => {
    const root = document.documentElement;

    if (!imageUrl) {
      root.style.setProperty('--primary', DEFAULT_PRIMARY);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      if (cancelled) return;
      try {
        const size = 48;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let r = 0;
        let g = 0;
        let b = 0;
        let weight = 0;

        for (let i = 0; i < data.length; i += 4) {
          const pr = data[i];
          const pg = data[i + 1];
          const pb = data[i + 2];
          const [, s, l] = rgbToHsl(pr, pg, pb);
          if (l < 12 || l > 92) continue; // skip near-black / near-white
          const w = (s / 100) ** 2 + 0.05; // favour saturated pixels
          r += pr * w;
          g += pg * w;
          b += pb * w;
          weight += w;
        }

        if (weight === 0) {
          root.style.setProperty('--primary', DEFAULT_PRIMARY);
          return;
        }

        const [h, s] = rgbToHsl(r / weight, g / weight, b / weight);
        const sat = Math.min(92, Math.max(55, s));
        const light = 60;
        root.style.setProperty('--primary', `${Math.round(h)} ${Math.round(sat)}% ${light}%`);
      } catch {
        root.style.setProperty('--primary', DEFAULT_PRIMARY);
      }
    };

    img.onerror = () => {
      if (!cancelled) root.style.setProperty('--primary', DEFAULT_PRIMARY);
    };

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);
}
