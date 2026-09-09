# osu!radio

A music player for your osu! beatmap collection — Discord Rich Presence, OS media
keys, a play queue, speed mods and a UI that tints itself to the current map.

## Features

- **Auto-scan on launch** — reads your osu! `Songs` folder on startup and caches
  the result; a rescan button lives in the top bar
- **Library** — search by title / artist / mapper, sort by Artist, Title, BPM or
  Newest (folder date), All / Liked / Queue tabs
- **Play queue** — hover a track to *Play next* or *Add to queue*; the queue is
  consumed before linear playback
- **Repeat modes** — off / all / one (persisted)
- **Speed mod** — `DT` plays at 1.5x with the pitch preserved (plain tempo
  speed-up); `1.0x` is normal
- **Discord Rich Presence** — title, artist, cover, map button and a progress bar
  whose timestamps follow the playback rate (DT finishes sooner)
- **OS media integration** — hardware media keys and the Windows / macOS
  "now playing" overlay via the Media Session API
- **Dynamic accent colour** — a vivid colour is pulled from the cover art and
  drives the whole UI theme
- **Blurred beatmap background** — the map's raw background image, full-bleed
- **Likes**, **shuffle**, seekable progress bar (HTTP Range), keyboard shortcuts

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Space` | Play / pause |
| `←` / `→` | Previous / next track |
| `S` | Shuffle |
| `R` | Cycle repeat mode |
| `L` | Like / unlike current track |

## Prerequisites

- [Bun](https://bun.sh/) (or Node 18+)
- osu! installed with beatmaps
- [Discord Desktop](https://discord.com/download) — optional, for Rich Presence

## Installation

```bash
git clone https://github.com/L3ne/osu-radio.git
cd osu-radio
bun install
```

Create a `.env` file:

```env
# Path to your osu! install (the folder containing "Songs"). Defaults to C:/Osu!
OSU_PATH=C:/Osu!

# Discord application id — only needed for Rich Presence
DISCORD_CLIENT_ID=your_discord_client_id
```

## Usage

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). The library scans itself on
first load — pick a track to start. Use the rescan button in the top bar after
adding new beatmaps.

## Discord Rich Presence setup

1. Create an application at the
   [Discord Developer Portal](https://discord.com/developers/applications)
2. Copy the **Application ID** into `.env` as `DISCORD_CLIENT_ID`
3. (Optional) upload a Rich Presence asset named `logo` for the idle image
4. Keep Discord Desktop running

## Troubleshooting

**Songs not loading** — check `OSU_PATH` points at the folder that contains
`Songs`, and that beatmaps have valid `.osu` files.

**Discord presence not updating** — make sure Discord Desktop is running and
`DISCORD_CLIENT_ID` matches an existing application; check the terminal logs.

**Audio won't seek** — the dev server must serve Range requests (it does by
default); a hard refresh usually clears a stuck `<audio>` element.

## Development

```bash
bun run dev      # dev server
bun run build    # production build
bun run start    # production server
bun run lint     # eslint
```

## Tech

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · framer-motion ·
`@xhayper/discord-rpc`
