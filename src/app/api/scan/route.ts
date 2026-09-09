import { NextRequest, NextResponse } from 'next/server';
import { scanOsuFolder } from '@/lib/scanner';
import { Song } from '@/types';

let cache: Song[] | null = null;
let scanning: Promise<Song[]> | null = null;

async function getSongs(refresh: boolean): Promise<Song[]> {
  if (!refresh && cache) return cache;
  if (!refresh && scanning) return scanning;

  scanning = scanOsuFolder().then((songs) => {
    cache = songs;
    scanning = null;
    return songs;
  });

  return scanning;
}

async function handle(refresh: boolean): Promise<NextResponse> {
  try {
    const songs = await getSongs(refresh);
    return NextResponse.json({ success: true, songs, cached: !refresh && cache === songs });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handle(request.nextUrl.searchParams.get('refresh') === '1');
}

export async function POST(): Promise<NextResponse> {
  return handle(true);
}

export const dynamic = 'force-dynamic';
