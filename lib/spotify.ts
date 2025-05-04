// ENV vars (set in Vercel)
const { SPOTIFY_CLIENT_ID: client_id, SPOTIFY_CLIENT_SECRET: client_secret, SPOTIFY_REFRESH_TOKEN: refresh_token } =
  process.env as Record<string, string>;

const credsAvailable = client_id && client_secret && refresh_token;

const BASIC = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

async function getAccessToken(): Promise<string> {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${BASIC}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token }),
    next: { revalidate: 300 }, // 5 min cache
  });

  if (!res.ok) throw new Error('Failed to refresh token');
  const json = await res.json();
  return json.access_token as string;
}

export async function getNowPlaying() {
  if (!credsAvailable) return null;
  const access_token = await getAccessToken();
  const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (res.status === 204 || res.status > 400) return null;
  const data = await res.json();
  if (!data?.item) return null;

  return {
    isPlaying: data.is_playing,
    title: data.item.name,
    artist: data.item.artists.map((a: any) => a.name).join(', '),
    albumArt: data.item.album.images[0]?.url as string,
    songUrl: data.item.external_urls.spotify as string,
  };
}

// (API route defined in app/api/spotify/route.ts) 