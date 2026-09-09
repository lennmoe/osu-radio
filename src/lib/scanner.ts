import * as fs from 'fs/promises';
import * as path from 'path';
import { Song } from '@/types';

export const OSU_PATH = process.env.OSU_PATH || 'C:/Osu!';

/** Read the first uninherited timing point to derive the map BPM. */
function parseBpm(content: string): number {
  const lines = content.split('\n');
  let inTimingPoints = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('[')) {
      inTimingPoints = line === '[TimingPoints]';
      continue;
    }
    if (!inTimingPoints || !line) continue;

    const parts = line.split(',');
    const beatLength = parseFloat(parts[1]);
    // Uninherited timing points have a positive beatLength (ms per beat).
    if (Number.isFinite(beatLength) && beatLength > 0) {
      return Math.round(60000 / beatLength);
    }
  }

  return 0;
}

export async function scanOsuFolder(osuPath: string = OSU_PATH): Promise<Song[]> {
  const songs: Song[] = [];
  const songsPath = path.join(osuPath, 'Songs');

  try {
    const folders = await fs.readdir(songsPath);

    for (const folder of folders) {
      const folderPath = path.join(songsPath, folder);
      const stats = await fs.stat(folderPath);

      if (!stats.isDirectory()) continue;

      const files = await fs.readdir(folderPath);
      const osuFile = files.find((f) => f.endsWith('.osu'));
      const audioFile = files.find((f) => f.endsWith('.mp3') || f.endsWith('.ogg'));

      if (!osuFile || !audioFile) continue;

      const content = await fs.readFile(path.join(folderPath, osuFile), 'utf-8');
      const lines = content.split('\n');

      let title = '';
      let artist = '';
      let creator = '';
      let beatmapSetID = '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('Title:')) title = trimmed.substring(6).trim();
        if (trimmed.startsWith('Artist:')) artist = trimmed.substring(7).trim();
        if (trimmed.startsWith('Creator:')) creator = trimmed.substring(8).trim();
        if (trimmed.startsWith('BeatmapSetID:')) beatmapSetID = trimmed.substring(13).trim();
      }

      if (!title || !artist) continue;

      songs.push({
        id: folder,
        beatmapSetID: beatmapSetID || folder.split(' ')[0],
        title,
        artist,
        creator,
        audioPath: path.join(folderPath, audioFile),
        folderPath,
        bpm: parseBpm(content),
        dateAdded: stats.mtimeMs,
      });
    }
  } catch (error) {
    console.error('Error scanning osu folder:', error);
  }

  songs.sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title));
  return songs;
}
