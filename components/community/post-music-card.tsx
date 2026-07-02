import { ExternalLink, Music2 } from "lucide-react";

type PostMusic = {
  spotify_url?: string | null;
  title?: string | null;
  artist_name?: string | null;
  artwork_url?: string | null;
  embed_url?: string | null;
};

export type SpotifyContentType =
  | "track"
  | "album"
  | "playlist"
  | "episode"
  | "show";

const SPOTIFY_CONTENT_TYPES = new Set<SpotifyContentType>([
  "track",
  "album",
  "playlist",
  "episode",
  "show",
]);

function isSpotifyContentType(
  value: string,
): value is SpotifyContentType {
  return SPOTIFY_CONTENT_TYPES.has(value as SpotifyContentType);
}

export function getSpotifyEmbedUrl(
  value?: string | null,
): string | undefined {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "open.spotify.com"
    ) {
      return undefined;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    const offset = parts[0] === "embed" ? 1 : 0;
    const contentType = parts[offset];
    const contentId = parts[offset + 1];

    if (
      parts.length !== offset + 2 ||
      !isSpotifyContentType(contentType) ||
      !/^[a-zA-Z0-9]+$/.test(contentId ?? "")
    ) {
      return undefined;
    }

    return `https://open.spotify.com/embed/${contentType}/${contentId}`;
  } catch {
    return undefined;
  }
}

function safeSpotifyUrl(value?: string | null) {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    const allowedHosts = new Set([
      "open.spotify.com",
      "spotify.link",
    ]);

    return url.protocol === "https:" &&
      allowedHosts.has(url.hostname)
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function safeArtworkUrl(value?: string | null) {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function PostMusicCard({ music }: { music: PostMusic }) {
  const embedUrl =
    getSpotifyEmbedUrl(music.embed_url) ??
    getSpotifyEmbedUrl(music.spotify_url);
  const spotifyUrl = safeSpotifyUrl(music.spotify_url);
  const artworkUrl = safeArtworkUrl(music.artwork_url);

  if (embedUrl) {
    return (
      <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f0c]">
        <iframe
          src={embedUrl}
          width="100%"
          height="152"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title={`Spotify: ${music.title?.trim() || "Music"}`}
          className="block h-[152px] w-full max-w-full border-0"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[.08] bg-white/[.035] p-3">
      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#1ed760]/10">
        {artworkUrl ? (
          <img
            src={artworkUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <Music2 size={20} className="text-[#1ed760]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {music.title?.trim() || "Spotify content"}
        </p>
        <p className="truncate text-xs text-muted">
          {music.artist_name?.trim() || "Spotify"}
        </p>
      </div>
      {spotifyUrl && (
        <a
          href={spotifyUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Open on Spotify"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#1ed760]/30 px-3 py-1.5 text-xs font-semibold text-[#1ed760]"
        >
          <ExternalLink size={13} />
          <span className="hidden sm:inline">Spotify</span>
        </a>
      )}
    </div>
  );
}
