import { validateSpotifyUrl } from "./validators";

export interface SpotifyPreview {
  url: string;
  title: string;
  artist: string | null;
  artworkUrl: string | null;
  embedUrl: string | null;
  provider: "spotify";
}

export async function resolveSpotifyUrl(input: string): Promise<SpotifyPreview> {
  const url = validateSpotifyUrl(input);
  if (!url) throw new Error("Use a valid Spotify track, album, playlist, or episode link.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, {
      signal: controller.signal,
      next: { revalidate: 86400 },
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Spotify could not resolve this link.");
    const body = await response.json() as { title?: string; thumbnail_url?: string };
    return {
      url,
      title: String(body.title ?? "Spotify content").slice(0, 200),
      artist: null,
      artworkUrl: body.thumbnail_url?.startsWith("https://") ? body.thumbnail_url : null,
      embedUrl: url.includes("open.spotify.com/") ? `https://open.spotify.com/embed/${new URL(url).pathname.split("/").filter(Boolean).join("/")}` : null,
      provider: "spotify",
    };
  } finally {
    clearTimeout(timeout);
  }
}
