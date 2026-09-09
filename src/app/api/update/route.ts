import { NextRequest, NextResponse } from 'next/server';
import { updateDiscordPlaying, updateDiscordPaused } from '@/lib/discordService';
import { Song } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { song, isPlaying, currentTime, duration, rate, modLabel } = await request.json() as {
      song: Song;
      isPlaying: boolean;
      currentTime: number;
      duration: number;
      rate?: number;
      modLabel?: string;
    };

    const safeRate = rate && rate > 0 ? rate : 1;
    const label = modLabel ?? '';

    console.log('[API] Received Discord update:', { song: song.title, isPlaying, currentTime, duration, rate: safeRate, modLabel: label });

    if (isPlaying) {
      await updateDiscordPlaying(song.title, song.artist, song.beatmapSetID, currentTime, duration, safeRate, label);
    } else {
      await updateDiscordPaused(song.title, song.artist, song.beatmapSetID, label);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Discord update error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
