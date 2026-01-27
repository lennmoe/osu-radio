import { Client, SetActivity } from '@xhayper/discord-rpc';

const catchDiscordActivityError = (err: unknown): void => {
  console.error('[Discord] Activity error:', err);
};

const defaultPresence: SetActivity = {
  details: 'Idle',
  largeImageKey: 'logo',
  type: 2,
 // buttons: [{ label: 'Check out osu!radio', url: 'https://github.com/L3ne/osu-radio' }],
};

let client: Client | null = null;
let isConnected = false;

export async function connectDiscord(): Promise<void> {
  if (isConnected && client) {
    console.warn('[Discord] Already connected');
    return;
  }

  client = new Client({ clientId: process.env.DISCORD_CLIENT_ID || '1037879885772890232' });

  client.on('ready', () => {
    isConnected = true;
    console.warn('[Discord] Connected!');
    client?.user?.setActivity(defaultPresence).catch(catchDiscordActivityError);
  });

  client.on('disconnected', () => {
    isConnected = false;
    console.warn('[Discord] Disconnected');
  });

  try {
    await client.login();
    console.log('[Discord] Login initiated');
  } catch (error) {
    console.error('[Discord] Login failed:', error);
  }
}

export async function updateDiscordPlaying(title: string, artist: string, beatmapSetID: string, currentTime: number = 0, duration: number = 0): Promise<void> {
  console.log('[Discord] updateDiscordPlaying called:', { title, artist, beatmapSetID, isConnected, hasClient: !!client });
  
  if (!client) {
    console.warn('[Discord] Client null, attempting to connect...');
    await connectDiscord();
  }
  
  if (!isConnected) {
    console.warn('[Discord] Not connected, waiting for connection...');
    let attempts = 0;
    while (!isConnected && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    if (!isConnected) {
      console.error('[Discord] Failed to connect after 10 attempts');
      return;
    }
  }

  const response = await fetch(
    `https://assets.ppy.sh/beatmaps/${beatmapSetID}/covers/list@2x.jpg`,
    { method: 'HEAD' }
  );

  let largeImageKey = `https://assets.ppy.sh/beatmaps/${beatmapSetID}/covers/list@2x.jpg`;
  if (response.status === 404) {
    largeImageKey = 'logo';
  }

  // Calculate timestamps for song progress
  console.log('[Discord] Timestamp calculation:', { currentTime, duration });
  
  // Handle null/undefined values
  const safeDuration = duration && duration > 0 ? duration : 0;
  const safeCurrentTime = currentTime && currentTime > 0 ? currentTime : 0;
  
  // Only set timestamps if we have valid duration
  let startTimestamp: number | undefined;
  let endTimestamp: number | undefined;
  
  if (safeDuration > 0) {
    endTimestamp = Math.floor(Date.now() / 1000) + Math.floor(safeDuration - safeCurrentTime);
    startTimestamp = endTimestamp - Math.floor(safeDuration);
  }
  
  console.log('[Discord] Calculated timestamps:', { startTimestamp, endTimestamp, safeDuration, safeCurrentTime });

  const presence: SetActivity = {
    details: title,
    state: artist,
    type: 2,
    largeImageKey: largeImageKey,
    buttons: [],
  };

  // Only add timestamps if they're valid
  if (startTimestamp && endTimestamp) {
    presence.startTimestamp = startTimestamp;
    presence.endTimestamp = endTimestamp;
  }

  if (beatmapSetID) {
    presence.buttons?.push({
      label: 'Go to this map on osu!',
      url: `https://osu.ppy.sh/beatmapsets/${beatmapSetID}`,
    });
  }

  console.log('[Discord] Setting activity:', presence);
  client?.user?.setActivity(presence).catch(catchDiscordActivityError);
  console.log('[Discord] Activity set command sent');
}

export async function updateDiscordPaused(title: string, artist: string, beatmapSetID: string, currentTime: number = 0, duration: number = 0): Promise<void> {
  if (!client) {
    console.warn('[Discord] Client null, attempting to connect...');
    await connectDiscord();
  }
  
  if (!isConnected) {
    console.warn('[Discord] Not connected, waiting for connection...');
    let attempts = 0;
    while (!isConnected && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    if (!isConnected) {
      console.error('[Discord] Failed to connect after 10 attempts');
      return;
    }
  }

  const response = await fetch(
    `https://assets.ppy.sh/beatmaps/${beatmapSetID}/covers/list@2x.jpg`,
    { method: 'HEAD' }
  );

  let largeImageKey = `https://assets.ppy.sh/beatmaps/${beatmapSetID}/covers/list@2x.jpg`;
  if (response.status === 404) {
    largeImageKey = 'logo';
  }

  // Calculate timestamps for song progress (paused state doesn't show elapsed time)
  console.log('[Discord] Timestamp calculation (paused):', { currentTime, duration });
  
  // Handle null/undefined values
  const safeDuration = duration && duration > 0 ? duration : 0;
  const safeCurrentTime = currentTime && currentTime > 0 ? currentTime : 0;
  
  // Only set timestamps if we have valid duration
  let startTimestamp: number | undefined;
  let endTimestamp: number | undefined;
  
  if (safeDuration > 0) {
    endTimestamp = Math.floor(Date.now() / 1000) + Math.floor(safeDuration - safeCurrentTime);
    startTimestamp = endTimestamp - Math.floor(safeDuration);
  }
  
  console.log('[Discord] Calculated timestamps (paused):', { startTimestamp, endTimestamp, safeDuration, safeCurrentTime });

  const presence: SetActivity = {
    details: title,
    state: artist,
    type: 2,
    largeImageKey: largeImageKey,
    largeImageText: 'Paused',
    buttons: [],
  };

  // Only add timestamps if they're valid
  if (startTimestamp && endTimestamp) {
    presence.startTimestamp = startTimestamp;
    presence.endTimestamp = endTimestamp;
  }

  if (beatmapSetID) {
    presence.buttons?.push({
      label: 'Go to this map on osu!',
      url: `https://osu.ppy.sh/beatmapsets/${beatmapSetID}`,
    });
  }

  client?.user?.setActivity(presence).catch(catchDiscordActivityError);
}

// Auto-connect on import
connectDiscord();
