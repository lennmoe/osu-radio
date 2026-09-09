'use client';

import { useEffect, useRef, useState, memo } from 'react';

interface AnimatedBackgroundProps {
  /** osu! beatmapset id — used to build the background image URLs. */
  beatmapSetID: string;
}

// raw.jpg is the actual map background; fall back to the generated cover, then the thumb.
function sources(id: string): string[] {
  return [
    `https://assets.ppy.sh/beatmaps/${id}/covers/raw.jpg`,
    `https://assets.ppy.sh/beatmaps/${id}/covers/cover@2x.jpg`,
    `https://assets.ppy.sh/beatmaps/${id}/covers/list@2x.jpg`,
  ];
}

const LAYER_STYLE = {
  filter: 'blur(22px) brightness(0.45)',
  transform: 'translate3d(0,0,0) scale(1.15)',
  willChange: 'opacity',
} as const;

function Layer({ id, fading }: { id: string; fading: boolean }): JSX.Element {
  const [srcIndex, setSrcIndex] = useState(0);
  const urls = sources(id);

  return (
    <img
      src={urls[Math.min(srcIndex, urls.length - 1)]}
      alt=""
      aria-hidden
      onError={() => setSrcIndex((i) => i + 1)}
      className="fixed inset-0 w-full h-full object-cover transition-opacity duration-700"
      style={{ ...LAYER_STYLE, opacity: fading ? 0 : 1 }}
    />
  );
}

function AnimatedBackgroundComponent({ beatmapSetID }: AnimatedBackgroundProps): JSX.Element {
  const [current, setCurrent] = useState(beatmapSetID);
  const [previous, setPrevious] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (beatmapSetID === current) return;
    setPrevious(current);
    setCurrent(beatmapSetID);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setPrevious(null), 900);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [beatmapSetID, current]);

  return (
    <>
      {previous && <Layer key={previous} id={previous} fading />}
      <Layer key={current} id={current} fading={false} />
      <div className="fixed inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/55 pointer-events-none" />
    </>
  );
}

export const AnimatedBackground = memo(AnimatedBackgroundComponent);
