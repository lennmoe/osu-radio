import { NextRequest } from 'next/server';
import * as fs from 'fs';
import { stat } from 'fs/promises';
import { extname } from 'path';

const MIME: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.flac': 'audio/flac',
};

export async function GET(request: NextRequest): Promise<Response> {
  const filePath = request.nextUrl.searchParams.get('path');
  if (!filePath) return new Response('Missing path', { status: 400 });
  if (!fs.existsSync(filePath)) return new Response('File not found', { status: 404 });

  const { size } = await stat(filePath);
  const contentType = MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
  const range = request.headers.get('range');

  // Range requests are what make the <audio> element seekable.
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    const start = match?.[1] ? parseInt(match[1], 10) : 0;
    const end = match?.[2] ? parseInt(match[2], 10) : size - 1;

    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
      return new Response('Range Not Satisfiable', {
        status: 416,
        headers: { 'Content-Range': `bytes */${size}`, 'Accept-Ranges': 'bytes' },
      });
    }

    const clampedEnd = Math.min(end, size - 1);
    const stream = fs.createReadStream(filePath, { start, end: clampedEnd });

    return new Response(stream as unknown as ReadableStream, {
      status: 206,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(clampedEnd - start + 1),
        'Content-Range': `bytes ${start}-${clampedEnd}/${size}`,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store',
      },
    });
  }

  const stream = fs.createReadStream(filePath);
  return new Response(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(size),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
    },
  });
}

export const dynamic = 'force-dynamic';
