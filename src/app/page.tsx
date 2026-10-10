'use client';

import { ReactNode, useState } from 'react';
import {
  IoPlaySharp,
  IoPauseSharp,
  IoPlaySkipBackSharp,
  IoPlaySkipForwardSharp,
  IoShuffle,
  IoRepeat,
  IoHeart,
  IoHeartOutline,
  IoAdd,
  IoRefresh,
  IoTrashOutline,
  IoAddCircleOutline,
  IoRemoveCircleOutline,
  IoPlayForwardOutline,
  IoList,
  IoLibrary,
  IoAlbums,
  IoSearch,
  IoVolumeHigh,
  IoVolumeMute,
  IoMusicalNotes,
} from 'react-icons/io5';
import { usePlaybackTime, usePlayer } from '@/components/PlayerProvider';
import { VirtualList } from '@/components/VirtualList';
import { NameInput } from '@/components/NameInput';
import { PlaylistMenuButton } from '@/components/PlaylistMenuButton';
import { playlistView, SORT_OPTIONS, useLibraryView } from '@/hooks/useLibraryView';
import { coverUrl, FALLBACK_COVER, formatTime, shuffled } from '@/lib/songs';
import { Playlist, Song, SortKey, SORT_LABEL } from '@/types';

type Lib = ReturnType<typeof useLibraryView>;

const MUTED = 'text-[#a7a7a7]';

function Mosaic({ playlist, className }: { playlist: Playlist; className: string }): JSX.Element {
  const { songsById } = usePlayer();
  const sets = playlist.songIds
    .map((id) => songsById.get(id)?.beatmapSetID)
    .filter((s): s is string => Boolean(s))
    .slice(0, 4);

  if (sets.length >= 4) {
    return (
      <div className={`${className} grid grid-cols-2 overflow-hidden`}>
        {sets.map((id, i) => (
          <img key={i} src={coverUrl(id, 'list')} alt="" loading="lazy" className="w-full h-full object-cover" />
        ))}
      </div>
    );
  }
  return sets[0] ? (
    <img src={coverUrl(sets[0], 'list@2x')} alt="" loading="lazy" className={`${className} object-cover`} />
  ) : (
    <div className={`${className} bg-[#282828] flex items-center justify-center`}>
      <IoMusicalNotes className="w-1/3 h-1/3 text-[#7a7a7a]" />
    </div>
  );
}

function EqBars({ playing }: { playing: boolean }): JSX.Element {
  return (
    <span className="inline-flex items-end gap-[2px] h-3.5">
      {[0, 0.25, 0.5].map((delay) => (
        <span
          key={delay}
          className="w-[3px] h-full bg-primary origin-bottom rounded-sm"
          style={{
            animation: `eq-bar 0.9s ease-in-out ${delay}s infinite`,
            animationPlayState: playing ? 'running' : 'paused',
          }}
        />
      ))}
    </span>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
  count,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-3 py-2 rounded-md font-semibold transition ${
        active ? 'text-white bg-[#232323]' : `${MUTED} hover:text-white`
      }`}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && count > 0 && <span className="text-xs font-normal tabular-nums">{count}</span>}
    </button>
  );
}

function Sidebar({ lib }: { lib: Lib }): JSX.Element {
  const p = usePlayer();
  const [creating, setCreating] = useState(false);

  return (
    <aside className="w-72 flex-shrink-0 flex flex-col gap-2 min-h-0">
      <div className="rounded-lg bg-[#121212] p-3 space-y-1">
        <div className="px-3 pt-1 pb-3 text-xl font-extrabold tracking-tight">
          osu<span className="text-primary">!</span>radio
        </div>
        <NavItem
          icon={<IoLibrary className="w-5 h-5" />}
          label="Library"
          active={lib.view === 'all'}
          onClick={() => lib.setView('all')}
          count={p.songs.length}
        />
        <NavItem
          icon={<IoHeart className="w-5 h-5" />}
          label="Liked Songs"
          active={lib.view === 'liked'}
          onClick={() => lib.setView('liked')}
          count={p.likedSongs.size}
        />
        <NavItem
          icon={<IoList className="w-5 h-5" />}
          label="Queue"
          active={lib.view === 'queue'}
          onClick={() => lib.setView('queue')}
          count={p.queue.length}
        />
      </div>

      <div className="rounded-lg bg-[#121212] flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button
            onClick={() => lib.setView('playlists')}
            className={`flex items-center gap-3 font-semibold transition ${
              lib.view === 'playlists' ? 'text-white' : `${MUTED} hover:text-white`
            }`}
          >
            <IoAlbums className="w-5 h-5" /> Your Playlists
          </button>
          <button
            onClick={() => setCreating(true)}
            className={`p-1.5 rounded-full ${MUTED} hover:text-white hover:bg-[#1f1f1f]`}
            title="Create playlist"
          >
            <IoAdd className="w-5 h-5" />
          </button>
        </div>
        {creating && (
          <div className="px-3 pb-2">
            <NameInput
              placeholder="My playlist #1"
              onSubmit={(name) => {
                setCreating(false);
                lib.setView(playlistView(p.createPlaylist(name)));
              }}
              onCancel={() => setCreating(false)}
              className="w-full px-3 py-2 rounded-md bg-[#2a2a2a] text-sm outline-none ring-1 ring-transparent focus:ring-white/40 placeholder-[#7a7a7a]"
            />
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {p.playlists.length === 0 && !creating && (
            <div className="m-2 p-4 rounded-lg bg-[#1f1f1f] space-y-3">
              <div className="font-semibold text-sm">Create your first playlist</div>
              <div className={`text-xs ${MUTED}`}>It&apos;s easy, we&apos;ll help you.</div>
              <button
                onClick={() => setCreating(true)}
                className="px-4 py-1.5 rounded-full bg-white text-black text-sm font-bold hover:scale-105 transition"
              >
                Create playlist
              </button>
            </div>
          )}
          {p.playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => lib.setView(playlistView(pl.id))}
              className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition ${
                lib.playlist?.id === pl.id ? 'bg-[#232323]' : 'hover:bg-[#1a1a1a]'
              }`}
            >
              <Mosaic playlist={pl} className="w-12 h-12 rounded" />
              <div className="min-w-0">
                <div className={`truncate ${lib.playlist?.id === pl.id ? 'text-primary' : ''}`}>{pl.name}</div>
                <div className={`text-xs ${MUTED}`}>Playlist · {pl.songIds.length} tracks</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function Hero({ lib }: { lib: Lib }): JSX.Element {
  const p = usePlayer();
  const [renaming, setRenaming] = useState(false);
  const pl = lib.playlist;

  let tile: ReactNode;
  let kind: string;
  let title: ReactNode;
  let meta: string;

  if (pl) {
    tile = <Mosaic playlist={pl} className="w-44 h-44 rounded-md shadow-[0_8px_40px_rgba(0,0,0,.6)]" />;
    kind = 'Playlist';
    title = renaming ? (
      <NameInput
        initial={pl.name}
        onSubmit={(name) => {
          p.renamePlaylist(pl.id, name);
          setRenaming(false);
        }}
        onCancel={() => setRenaming(false)}
        className="w-full bg-transparent text-6xl font-black tracking-tight outline-none border-b border-white/30"
      />
    ) : (
      <button onClick={() => setRenaming(true)} className="text-left hover:underline decoration-2" title="Rename">
        {pl.name}
      </button>
    );
    meta = `${pl.songIds.length} tracks`;
  } else {
    const gradient =
      lib.view === 'liked' ? 'from-[#450af5] to-primary' : lib.view === 'queue' ? 'from-[#1e3264] to-[#27856a]' : 'from-primary to-[#7c3aed]';
    const icon =
      lib.view === 'liked' ? (
        <IoHeart className="w-16 h-16" />
      ) : lib.view === 'queue' ? (
        <IoList className="w-16 h-16" />
      ) : lib.view === 'playlists' ? (
        <IoAlbums className="w-16 h-16" />
      ) : (
        <IoLibrary className="w-16 h-16" />
      );
    tile = (
      <div className={`w-44 h-44 rounded-md bg-gradient-to-br ${gradient} flex items-center justify-center shadow-[0_8px_40px_rgba(0,0,0,.6)]`}>
        {icon}
      </div>
    );
    kind = lib.view === 'playlists' ? 'Collection' : lib.view === 'queue' ? 'Up next' : 'Library';
    title =
      lib.view === 'liked' ? 'Liked Songs' : lib.view === 'queue' ? 'Queue' : lib.view === 'playlists' ? 'Your Playlists' : 'All tracks';
    meta =
      lib.view === 'playlists'
        ? `${p.playlists.length} playlists`
        : lib.view === 'queue'
          ? `${p.queue.length} tracks`
          : `${lib.items.length} tracks`;
  }

  return (
    <div className="relative px-8 pt-16 pb-6 flex items-end gap-6">
      {tile}
      <div className="min-w-0 flex-1 pb-1">
        <div className="text-sm font-semibold">{kind}</div>
        <h1 className="text-6xl font-black tracking-tight truncate py-2">{title}</h1>
        <div className={`text-sm ${MUTED} flex items-center gap-2`}>
          <span className="font-semibold text-white">osu!radio</span> · {meta}
          {lib.view === 'all' && (
            <button onClick={p.rescan} disabled={p.isScanning} className="ml-1 hover:text-white" title="Rescan library">
              <IoRefresh className={`w-4 h-4 ${p.isScanning ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionBar({ lib }: { lib: Lib }): JSX.Element {
  const p = usePlayer();
  const pl = lib.playlist;
  const ids = lib.items.map((s) => s.id);

  const playAll = (): void => {
    if (pl) p.playPlaylist(pl.id);
    else lib.playAt(0);
  };
  const shuffleAll = (): void => {
    if (pl) {
      p.playPlaylist(pl.id, true);
      return;
    }
    const order = shuffled(ids);
    if (order[0]) p.playSong(order[0], order);
  };

  return (
    <div className="relative px-8 pb-4 flex items-center gap-5">
      {lib.view !== 'playlists' && (
        <>
          <button
            onClick={playAll}
            disabled={lib.items.length === 0}
            className="w-14 h-14 rounded-full bg-primary text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg disabled:opacity-40"
            aria-label="Play"
          >
            <IoPlaySharp className="w-6 h-6 ml-0.5" />
          </button>
          {lib.view !== 'queue' && (
            <button onClick={shuffleAll} className={`${MUTED} hover:text-white`} title="Shuffle play">
              <IoShuffle className="w-8 h-8" />
            </button>
          )}
        </>
      )}
      {pl && (
        <button
          onClick={() => {
            if (confirm(`Delete playlist "${pl.name}"?`)) p.deletePlaylist(pl.id);
          }}
          className={`${MUTED} hover:text-red-400`}
          title="Delete playlist"
        >
          <IoTrashOutline className="w-6 h-6" />
        </button>
      )}
      {lib.view === 'queue' && p.queue.length > 0 && (
        <button onClick={p.clearQueue} className={`text-sm font-semibold ${MUTED} hover:text-white`}>
          Clear queue
        </button>
      )}

      <div className="ml-auto flex items-center gap-3">
        {lib.isSearchable && (
          <div className="relative">
            <IoSearch className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${MUTED}`} />
            <input
              value={lib.query}
              onChange={(e) => lib.setQuery(e.target.value)}
              placeholder={pl ? 'Search in playlist' : 'Search tracks'}
              className="w-64 pl-9 pr-3 py-2 rounded-md bg-white/10 text-sm outline-none focus:bg-white/15 placeholder-[#8a8a8a]"
            />
          </div>
        )}
        {lib.isSortable && (
          <select
            value={lib.sortKey}
            onChange={(e) => lib.setSortKey(e.target.value as SortKey)}
            className={`bg-transparent text-sm ${MUTED} hover:text-white outline-none cursor-pointer`}
          >
            {SORT_OPTIONS.map((k) => (
              <option key={k} value={k} className="bg-[#282828] text-white">
                {SORT_LABEL[k]}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

const TABLE_COLS = 'grid grid-cols-[40px_minmax(0,5fr)_minmax(0,2fr)_64px_112px] gap-4 items-center';

function TrackRow({
  song,
  index,
  active,
  onPlay,
  onRemove,
}: {
  song: Song;
  index: number;
  active: boolean;
  onPlay: (i: number) => void;
  onRemove?: () => void;
}): JSX.Element {
  const p = usePlayer();
  const liked = p.isLiked(song.id);
  const btn = `p-1.5 rounded-full ${MUTED} hover:text-white`;

  return (
    <div
      onClick={() => onPlay(index)}
      className={`${TABLE_COLS} mx-4 px-4 h-14 rounded-md cursor-pointer group transition ${
        active ? 'bg-white/[0.07]' : 'hover:bg-white/10'
      }`}
    >
      <div className={`text-sm tabular-nums text-right ${active ? 'text-primary' : MUTED}`}>
        {active ? (
          <EqBars playing={p.isPlaying} />
        ) : (
          <>
            <span className="group-hover:hidden">{index + 1}</span>
            <IoPlaySharp className="w-4 h-4 hidden group-hover:inline text-white" />
          </>
        )}
      </div>
      <div className="flex items-center gap-3 min-w-0">
        <img
          src={coverUrl(song.beatmapSetID, 'list')}
          alt=""
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_COVER;
          }}
          className="w-10 h-10 rounded object-cover flex-shrink-0 bg-[#282828]"
        />
        <div className="min-w-0">
          <div className={`truncate ${active ? 'text-primary' : 'text-white'}`}>{song.title}</div>
          <div className={`text-sm truncate ${MUTED}`}>{song.artist}</div>
        </div>
      </div>
      <div className={`text-sm truncate ${MUTED}`}>{song.creator}</div>
      <div className={`text-sm tabular-nums ${MUTED}`}>{song.bpm > 0 ? song.bpm : '—'}</div>
      <div className="flex items-center justify-end gap-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            p.toggleLike(song.id);
          }}
          className={`${btn} ${liked ? '!text-primary' : 'opacity-0 group-hover:opacity-100'}`}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          {liked ? <IoHeart className="w-4 h-4" /> : <IoHeartOutline className="w-4 h-4" />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            p.playNext(song.id);
          }}
          className={`${btn} opacity-0 group-hover:opacity-100`}
          title="Play next"
        >
          <IoPlayForwardOutline className="w-4 h-4" />
        </button>
        {onRemove ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className={`${btn} opacity-0 group-hover:opacity-100`}
            title="Remove"
          >
            <IoRemoveCircleOutline className="w-4 h-4" />
          </button>
        ) : (
          <PlaylistMenuButton songId={song.id} className={`${btn} opacity-0 group-hover:opacity-100`}>
            <IoAddCircleOutline className="w-4 h-4" />
          </PlaylistMenuButton>
        )}
      </div>
    </div>
  );
}

function PlaylistGrid({ lib }: { lib: Lib }): JSX.Element {
  const p = usePlayer();
  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6">
      {p.playlists.length === 0 ? (
        <div className={`py-16 text-center ${MUTED}`}>No playlists yet — hit + in the sidebar.</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2">
          {p.playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => lib.setView(playlistView(pl.id))}
              className="relative p-3 rounded-md hover:bg-[#1f1f1f] cursor-pointer group transition"
            >
              <div className="relative">
                <Mosaic playlist={pl} className="w-full aspect-square rounded-md shadow-[0_8px_24px_rgba(0,0,0,.5)]" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    p.playPlaylist(pl.id);
                  }}
                  className="absolute right-2 bottom-2 w-12 h-12 rounded-full bg-primary text-black flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition"
                  aria-label={`Play ${pl.name}`}
                >
                  <IoPlaySharp className="w-5 h-5 ml-0.5" />
                </button>
              </div>
              <div className="mt-3 font-semibold truncate">{pl.name}</div>
              <div className={`text-sm ${MUTED}`}>{pl.songIds.length} tracks</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MainView({ lib }: { lib: Lib }): JSX.Element {
  const p = usePlayer();
  const pl = lib.playlist;

  return (
    <main className="flex-1 min-w-0 rounded-lg bg-[#121212] overflow-hidden flex flex-col relative">
      <div
        className="absolute inset-x-0 top-0 h-[340px] pointer-events-none transition-colors duration-700"
        style={{ background: 'linear-gradient(to bottom, hsl(var(--primary) / 0.38), transparent)' }}
      />
      <Hero lib={lib} />
      <ActionBar lib={lib} />

      {lib.view === 'playlists' ? (
        <PlaylistGrid lib={lib} />
      ) : (
        <>
          <div className={`${TABLE_COLS} relative mx-4 px-4 h-9 border-b border-white/10 text-xs uppercase tracking-wider ${MUTED}`}>
            <span className="text-right">#</span>
            <span>Title</span>
            <span>Mapper</span>
            <span>BPM</span>
            <span />
          </div>
          {lib.items.length === 0 ? (
            <div className={`flex-1 flex items-center justify-center ${MUTED}`}>
              {lib.view === 'queue'
                ? 'Your queue is empty.'
                : pl
                  ? 'Let’s find something for your playlist — hover a track and hit ⊕.'
                  : p.isScanning
                    ? 'Scanning your osu! Songs folder…'
                    : 'Nothing here.'}
            </div>
          ) : (
            <VirtualList
              items={lib.items}
              estimateSize={56}
              getKey={(s, i) => (lib.view === 'queue' ? `${s.id}-${i}` : s.id)}
              resetKey={lib.view}
              paddingStart={8}
              paddingEnd={16}
              className="relative flex-1 overflow-y-auto"
              renderItem={(song, i) => (
                <TrackRow
                  song={song}
                  index={i}
                  active={song.id === p.currentSong?.id}
                  onPlay={lib.playAt}
                  {...(lib.view === 'queue'
                    ? { onRemove: () => p.removeFromQueue(i) }
                    : pl
                      ? { onRemove: () => p.removeFromPlaylist(pl.id, song.id) }
                      : {})}
                />
              )}
            />
          )}
        </>
      )}
    </main>
  );
}

function SeekRow(): JSX.Element {
  const { seek, rate } = usePlayer();
  const { currentTime, duration } = usePlaybackTime();
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  return (
    <div className={`w-full flex items-center gap-2 text-xs tabular-nums ${MUTED}`}>
      <span className="w-10 text-right">{formatTime(currentTime / rate)}</span>
      <div className="relative flex-1 h-4 flex items-center group">
        <div className="h-1 w-full rounded-full bg-white/20 overflow-hidden">
          <div className="h-full bg-white group-hover:bg-primary" style={{ width: `${progress}%` }} />
        </div>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={(e) => seek(parseFloat(e.target.value))}
          className="radio-range absolute inset-0 opacity-0 group-hover:opacity-100"
          aria-label="Seek"
        />
      </div>
      <span className="w-10">{formatTime(duration / rate)}</span>
    </div>
  );
}

function PlayerBar({ lib }: { lib: Lib }): JSX.Element {
  const p = usePlayer();
  const song = p.currentSong;
  const liked = song ? p.isLiked(song.id) : false;
  const ctrl = `p-2 ${MUTED} hover:text-white transition`;
  const goQueue = (): void => lib.setView(lib.view === 'queue' ? 'all' : 'queue');

  return (
    <footer className="h-[76px] flex-shrink-0 flex items-center px-2 gap-4">
      <div className="w-[30%] min-w-0 flex items-center gap-3">
        {song && (
          <>
            <img
              src={coverUrl(song.beatmapSetID, 'list')}
              alt=""
              onError={(e) => {
                e.currentTarget.src = FALLBACK_COVER;
              }}
              className="w-14 h-14 rounded object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="text-sm truncate">{song.title}</div>
              <div className={`text-xs truncate ${MUTED}`}>{song.artist}</div>
            </div>
            <button
              onClick={() => p.toggleLike(song.id)}
              className={`${ctrl} ${liked ? '!text-primary' : ''}`}
              aria-label={liked ? 'Unlike' : 'Like'}
            >
              {liked ? <IoHeart className="w-4 h-4" /> : <IoHeartOutline className="w-4 h-4" />}
            </button>
            <PlaylistMenuButton songId={song.id} className={ctrl}>
              <IoAddCircleOutline className="w-[18px] h-[18px]" />
            </PlaylistMenuButton>
          </>
        )}
      </div>

      <div className="flex-1 max-w-[680px] flex flex-col items-center gap-1">
        <div className="flex items-center gap-4">
          <button onClick={p.shuffle} className={ctrl} aria-label="Shuffle">
            <IoShuffle className="w-[18px] h-[18px]" />
          </button>
          <button onClick={p.previous} className={ctrl} aria-label="Previous">
            <IoPlaySkipBackSharp className="w-5 h-5" />
          </button>
          <button
            onClick={p.togglePlay}
            className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition"
            aria-label={p.isPlaying ? 'Pause' : 'Play'}
          >
            {p.isPlaying ? <IoPauseSharp className="w-[18px] h-[18px]" /> : <IoPlaySharp className="w-[18px] h-[18px] ml-0.5" />}
          </button>
          <button onClick={p.next} className={ctrl} aria-label="Next">
            <IoPlaySkipForwardSharp className="w-5 h-5" />
          </button>
          <button
            onClick={p.cycleRepeat}
            className={`${ctrl} relative ${p.repeat !== 'off' ? '!text-primary' : ''}`}
            aria-label={`Repeat: ${p.repeat}`}
            title={`Repeat: ${p.repeat}`}
          >
            <IoRepeat className="w-[18px] h-[18px]" />
            {p.repeat === 'one' && <span className="absolute top-0.5 right-0.5 text-[8px] font-bold">1</span>}
          </button>
        </div>
        <SeekRow />
      </div>

      <div className="w-[30%] flex items-center justify-end gap-3 pr-2">
        <button
          onClick={() => p.setMod(p.mod === 'dt' ? 'none' : 'dt')}
          className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
            p.mod === 'dt' ? 'bg-primary border-primary text-black' : `border-white/20 ${MUTED} hover:text-white`
          }`}
          title="Double Time · 1.5x"
        >
          DT
        </button>
        <button onClick={goQueue} className={`${ctrl} ${lib.view === 'queue' ? '!text-primary' : ''}`} title="Queue">
          <IoList className="w-[18px] h-[18px]" />
        </button>
        <button onClick={() => p.setVolume(p.volume === 0 ? 0.7 : 0)} className={ctrl} aria-label="Mute">
          {p.volume === 0 ? <IoVolumeMute className="w-[18px] h-[18px]" /> : <IoVolumeHigh className="w-[18px] h-[18px]" />}
        </button>
        <div className="relative w-28 h-4 flex items-center group">
          <div className="h-1 w-full rounded-full bg-white/20 overflow-hidden">
            <div className="h-full bg-white group-hover:bg-primary" style={{ width: `${p.volume * 100}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={p.volume}
            onChange={(e) => p.setVolume(parseFloat(e.target.value))}
            className="radio-range absolute inset-0 opacity-0 group-hover:opacity-100"
            aria-label="Volume"
          />
        </div>
      </div>
    </footer>
  );
}

export default function Home(): JSX.Element {
  const lib = useLibraryView();

  return (
    <div className="h-screen flex flex-col bg-black text-white p-2 gap-2 overflow-hidden">
      <div className="flex-1 flex gap-2 min-h-0">
        <Sidebar lib={lib} />
        <MainView lib={lib} />
      </div>
      <PlayerBar lib={lib} />
    </div>
  );
}
