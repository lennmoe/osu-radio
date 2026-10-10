import { Song, SortKey } from '@/types';

export const FALLBACK_COVER =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Osu%21_Logo_2016.svg/240px-Osu%21_Logo_2016.svg.png';

export type CoverKind = 'list' | 'list@2x' | 'card' | 'card@2x' | 'cover' | 'cover@2x' | 'raw';

export function coverUrl(beatmapSetID: string, kind: CoverKind = 'list@2x'): string {
  return `https://assets.ppy.sh/beatmaps/${beatmapSetID}/covers/${kind}.jpg`;
}

export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const collator = new Intl.Collator(undefined, { sensitivity: 'base' });

export function sortSongs(list: Song[], key: SortKey): Song[] {
  const copy = [...list];
  copy.sort((a, b) => {
    switch (key) {
      case 'title':
        return collator.compare(a.title, b.title);
      case 'bpm':
        return b.bpm - a.bpm || collator.compare(a.title, b.title);
      case 'added':
        return b.dateAdded - a.dateAdded;
      default:
        return collator.compare(a.artist, b.artist) || collator.compare(a.title, b.title);
    }
  });
  return copy;
}

export function matchesQuery(song: Song, q: string): boolean {
  return (
    song.title.toLowerCase().includes(q) ||
    song.artist.toLowerCase().includes(q) ||
    song.creator.toLowerCase().includes(q)
  );
}

export function shuffled<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
