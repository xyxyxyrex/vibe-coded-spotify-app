
export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  playedAt: string;
  previewUrl?: string;
}

export enum StoryGenre {
  ROMANTIC = 'Romantic',
  TRAGIC = 'Tragic',
  CYBERPUNK = 'Cyberpunk',
  FANTASY = 'Fantasy',
  NOIR = 'Noir',
  ADVENTURE = 'Adventure',
  HORROR = 'Horror'
}

export interface GenerationState {
  isGenerating: boolean;
  story: string;
  error?: string;
}
