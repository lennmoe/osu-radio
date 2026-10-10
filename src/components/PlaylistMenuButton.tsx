'use client';

import { MouseEvent, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IoAdd, IoCheckmark } from 'react-icons/io5';
import { usePlayer } from './PlayerProvider';
import { NameInput } from './NameInput';

interface PlaylistMenuButtonProps {
  songId: string;
  children: ReactNode;
  className?: string;
  title?: string;
  tone?: 'dark' | 'light';
}

const MENU_WIDTH = 232;
const MENU_MAX_HEIGHT = 320;

const TONES = {
  dark: {
    panel: 'bg-neutral-900/95 text-white border-white/10 shadow-black/60',
    item: 'hover:bg-white/10',
    muted: 'text-white/45',
    input: 'bg-white/10 border-white/15 placeholder-white/40 focus:border-primary',
  },
  light: {
    panel: 'bg-[#fbf8f1] text-neutral-900 border-black/15 shadow-black/20',
    item: 'hover:bg-black/5',
    muted: 'text-neutral-500',
    input: 'bg-white border-black/20 placeholder-neutral-400 focus:border-neutral-900',
  },
} as const;

/**
 * "Add to playlist" trigger. The menu is portalled + fixed-positioned so it
 * isn't clipped by scroll containers (virtualized lists).
 */
export function PlaylistMenuButton({
  songId,
  children,
  className,
  title = 'Add to playlist',
  tone = 'dark',
}: PlaylistMenuButtonProps): JSX.Element {
  const { playlists, addToPlaylist, removeFromPlaylist, createPlaylist } = usePlayer();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number } | null>(null);
  const [creating, setCreating] = useState(false);
  const t = TONES[tone];

  const close = useCallback((): void => {
    setPos(null);
    setCreating(false);
  }, []);

  const toggle = (e: MouseEvent): void => {
    e.stopPropagation();
    if (pos) {
      close();
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8));
    const openUp = rect.bottom + MENU_MAX_HEIGHT > window.innerHeight;
    setPos(openUp ? { left, bottom: window.innerHeight - rect.top + 6 } : { left, top: rect.bottom + 6 });
  };

  useEffect(() => {
    if (!pos) return;
    const inside = (target: EventTarget | null): boolean =>
      Boolean(
        target instanceof Node && (menuRef.current?.contains(target) || buttonRef.current?.contains(target)),
      );
    const onDown = (e: globalThis.MouseEvent): void => {
      if (!inside(e.target)) close();
    };
    const onScroll = (e: Event): void => {
      if (!inside(e.target)) close();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [pos, close]);

  return (
    <>
      <button ref={buttonRef} onClick={toggle} title={title} aria-label={title} className={className}>
        {children}
      </button>
      {pos &&
        createPortal(
          <div
            ref={menuRef}
            // Portals still bubble React events to the row underneath — don't let a click "play" it.
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'fixed', width: MENU_WIDTH, ...pos }}
            className={`z-[200] rounded-xl border backdrop-blur-xl shadow-2xl text-sm overflow-hidden ${t.panel}`}
          >
            <div className={`px-3 pt-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider ${t.muted}`}>
              Add to playlist
            </div>
            <div className="max-h-56 overflow-y-auto px-1">
              {playlists.length === 0 && <div className={`px-2 py-2 text-xs ${t.muted}`}>No playlists yet</div>}
              {playlists.map((p) => {
                const has = p.songIds.includes(songId);
                return (
                  <button
                    key={p.id}
                    onClick={() => (has ? removeFromPlaylist(p.id, songId) : addToPlaylist(p.id, songId))}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition ${t.item}`}
                  >
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className={`text-xs tabular-nums ${t.muted}`}>{p.songIds.length}</span>
                    <span className="w-4">{has && <IoCheckmark className="w-4 h-4 text-primary" />}</span>
                  </button>
                );
              })}
            </div>
            <div className={`p-1.5 mt-1 border-t ${tone === 'dark' ? 'border-white/10' : 'border-black/10'}`}>
              {creating ? (
                <NameInput
                  placeholder="Playlist name"
                  onSubmit={(name) => {
                    createPlaylist(name, [songId]);
                    close();
                  }}
                  onCancel={() => setCreating(false)}
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-sm outline-none ${t.input}`}
                />
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition ${t.item}`}
                >
                  <IoAdd className="w-4 h-4" />
                  New playlist
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
