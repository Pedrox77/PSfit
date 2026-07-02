interface SpotifyToken { access_token: string; expires_in: number }
export interface SpotifySearchItem {
  id: string; title: string; artist: string; album: string;
  artworkUrl: string | null; durationMs: number; url: string;
}

async function getToken() {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Spotify authorization unavailable.");
    return (await response.json() as SpotifyToken).access_token;
  } finally { clearTimeout(timeout) }
}

export async function searchSpotify(query: string): Promise<SpotifySearchItem[] | null> {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) return null;
  const token = await getToken();
  if (!token) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(`https://api.spotify.com/v1/search?type=track&limit=8&q=${encodeURIComponent(query.slice(0, 100))}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
      next: { revalidate: 300 },
    });
    if (response.status === 429) {
      const retry = Math.min(Number(response.headers.get("retry-after") ?? 1), 10);
      throw new Error(`Spotify rate limited this request. Retry in ${retry} seconds.`);
    }
    if (!response.ok) throw new Error("Spotify search unavailable.");
    const body = await response.json() as { tracks?: { items?: Array<{
      id:string;name:string;duration_ms:number;external_urls:{spotify:string};
      artists:Array<{name:string}>;album:{name:string;images:Array<{url:string}>};
    }> } };
    return (body.tracks?.items ?? []).map(track => ({
      id: track.id, title: track.name, artist: track.artists.map(x=>x.name).join(", "),
      album: track.album.name, artworkUrl: track.album.images[0]?.url ?? null,
      durationMs: track.duration_ms, url: track.external_urls.spotify,
    }));
  } finally { clearTimeout(timeout) }
}
