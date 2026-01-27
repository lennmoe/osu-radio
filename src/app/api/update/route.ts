import { NextRequest, NextResponse } from 'next/server';
import { updateDiscordPlaying, updateDiscordPaused } from '@/lib/discordService';
import { Song } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { song, isPlaying, currentTime, duration } = await request.json() as {
      song: Song;
      isPlaying: boolean;
      currentTime: number;
      duration: number;
    };

    console.log('[API] Received Discord update:', { song: song.title, isPlaying, currentTime, duration });

    if (isPlaying) {
      await updateDiscordPlaying(song.title, song.artist, song.beatmapSetID, currentTime, duration);
    } else {
      await updateDiscordPaused(song.title, song.artist, song.beatmapSetID, currentTime, duration);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Discord update error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
