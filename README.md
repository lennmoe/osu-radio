# osu! Radio

A modern music player for your osu! beatmap collection with Discord Rich Presence integration.

## Features

- Play music from your osu! beatmap collection
- Real-time search with autocomplete
- Beautiful UI with beatmap backgrounds
- Volume control with visual slider
- Discord Rich Presence integration
- Progress bar with timestamps
- Beatmap cover images display

## Prerequisites

- [Bun](https://bun.sh/) (JavaScript runtime)
- [Discord Desktop](https://discord.com/download) (for Rich Presence)
- osu! installed with beatmaps

## Installation

1. **Clone the repository**
   ```bash
   git clone this repository
   cd "osu radio"
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Configure environment variables**
   
   Copy the example env file:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your values:
   ```env
   DISCORD_CLIENT_ID=your_discord_client_id
   DISCORD_SHOW_BUTTONS=true
   ```

4. **Configure osu! path**
   
   Edit `src/app/api/scan/route.ts` and change the osu! path:
   ```typescript
   const songs = await scanOsuFolder('D:/Osu!'); // Change this to your osu! path
   ```

## Discord Rich Presence Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Copy the **Application ID**
4. Paste it in your `.env` file as `DISCORD_CLIENT_ID`
5. (Optional) Upload a logo image named `logo` in the Rich Presence assets

## Usage

1. **Start the development server**
   ```bash
   bun run dev
   ```

2. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Scan your beatmaps**
   
   Click the "Scan osu! Folder" button to load your songs

4. **Play music**
   
   - Click on any song to play it
   - Use the search bar to find songs quickly
   - Adjust volume with the slider
   - Your Discord status will update automatically

## Project Structure

```
osu radio/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── audio/      # Audio streaming endpoint
│   │   │   ├── scan/       # Beatmap scanning endpoint
│   │   │   └── update/     # Discord RPC update endpoint
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # App layout
│   │   └── page.tsx        # Main page
│   ├── lib/
│   │   ├── discordService.ts  # Discord RPC service
│   │   └── scanner.ts         # osu! folder scanner
│   └── types/
│       └── index.ts        # TypeScript types
├── .env                    # Environment variables (gitignored)
├── .env.example            # Environment variables example
├── package.json            # Dependencies
└── README.md              # This file
```

## Configuration

### Environment Variables

- `DISCORD_CLIENT_ID`: Your Discord application ID
- `DISCORD_SHOW_BUTTONS`: Show/hide Discord RPC buttons (`true` or `false`)

### Customization

**Change osu! folder path:**
Edit `src/app/api/scan/route.ts`:
```typescript
const songs = await scanOsuFolder('YOUR_OSU_PATH');
```

**Change Discord RPC idle status:**
Edit `src/lib/discordService.ts`:
```typescript
details: 'Your custom message',
```

## Technologies

- **Framework:** Next.js 14 (App Router)
- **Runtime:** Bun
- **Styling:** TailwindCSS
- **Discord RPC:** @xhayper/discord-rpc
- **Language:** TypeScript

## Troubleshooting

### Discord RPC not working

1. Make sure Discord Desktop is running
2. Check that your `DISCORD_CLIENT_ID` is correct
3. Verify that the application exists in Discord Developer Portal
4. Check terminal logs for connection errors

### Songs not loading

1. Verify your osu! path is correct in `src/app/api/scan/route.ts`
2. Make sure you have beatmaps in your Songs folder
3. Check that beatmaps have valid `.osu` files

### Audio not playing

1. Check browser console for errors
2. Verify the audio file path is accessible
3. Try a different song

## Development

**Run development server:**
```bash
bun run dev
```

**Build for production:**
```bash
bun run build
```

**Start production server:**
```bash
bun start
```

## License

MIT

## Credits

- osu! by [ppy](https://osu.ppy.sh/)
- Discord RPC library by [@xhayper](https://github.com/xhayper/discord-rpc)
