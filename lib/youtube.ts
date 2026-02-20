const YT_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export function parseYouTubeVideoId(input: string): string {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("Invalid URL");
  }

  const hostname = url.hostname.replace(/^www\./, "").toLowerCase();
  const hasPlaylist = url.searchParams.has("list");
  if (hasPlaylist) throw new Error("Playlist URLs are not allowed");

  let videoId: string | null = null;

  if (hostname === "youtube.com" || hostname === "m.youtube.com") {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v");
    }
  }

  if (hostname === "youtu.be") {
    const fromPath = url.pathname.split("/").filter(Boolean)[0];
    videoId = fromPath ?? null;
  }

  if (!videoId || !YT_ID_REGEX.test(videoId)) {
    throw new Error("Unsupported or invalid YouTube URL");
  }

  if (url.pathname.includes("/live")) {
    throw new Error("Live URLs are not allowed");
  }

  return videoId;
}
