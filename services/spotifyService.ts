
import { SpotifyTrack } from '../types';

const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const SCOPES = ["user-read-recently-played"];

export const getAuthUrl = (clientId: string, redirectUri: string) => {
  return `${AUTH_ENDPOINT}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${SCOPES.join("%20")}&response_type=token&show_dialog=true`;
};

export const fetchRecentlyPlayed = async (token: string): Promise<SpotifyTrack[]> => {
  const response = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=20", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("EXPIRED_TOKEN");
    throw new Error("Failed to fetch listening history");
  }

  const data = await response.json();
  return data.items.map((item: any) => ({
    id: item.track.id,
    name: item.track.name,
    artist: item.track.artists[0].name,
    albumArt: item.track.album.images[0].url,
    playedAt: item.played_at,
    previewUrl: item.track.preview_url,
  }));
};
