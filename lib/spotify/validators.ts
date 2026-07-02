const HOSTS = new Set(["open.spotify.com", "spotify.link"]);
const CONTENT = new Set(["track", "album", "playlist", "episode"]);

export function validateSpotifyUrl(input: string) {
  try {
    const url = new URL(input.trim());
    if (url.protocol !== "https:" || !HOSTS.has(url.hostname)) return null;
    if (url.hostname === "open.spotify.com") {
      const [type, id] = url.pathname.split("/").filter(Boolean);
      if (!CONTENT.has(type) || !/^[a-zA-Z0-9]+$/.test(id ?? "")) return null;
      url.search = "";
      url.hash = "";
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function spotifyEmbedUrl(input: string) {
  const valid = validateSpotifyUrl(input);
  if (!valid) return null;
  const url = new URL(valid);
  if (url.hostname !== "open.spotify.com") return null;
  return `https://open.spotify.com/embed${url.pathname}`;
}
