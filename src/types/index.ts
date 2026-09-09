export interface Song {
  id: string;
  beatmapSetID: string;
  title: string;
  artist: string;
  creator: string;
  audioPath: string;
  folderPath: string;
  bpm: number;
  /** Folder mtime in ms — used for "recently added" sorting. */
  dateAdded: number;
}

export type PlaybackMod = 'none' | 'dt' | 'nc';

export type RepeatMode = 'off' | 'all' | 'one';

export type SortKey = 'artist' | 'title' | 'bpm' | 'added';

export const SORT_LABEL: Record<SortKey, string> = {
  artist: 'Artist',
  title: 'Title',
  bpm: 'BPM',
  added: 'Newest',
};

export const MOD_RATE: Record<PlaybackMod, number> = {
  none: 1,
  dt: 1.5,
  nc: 1.5,
};

export const MOD_LABEL: Record<PlaybackMod, string> = {
  none: '',
  dt: 'Double Time',
  nc: 'Nightcore',
};
