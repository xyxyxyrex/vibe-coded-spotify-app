
import { GoogleGenAI } from "@google/genai";
import { SpotifyTrack, StoryGenre } from "../types";

export const generateStory = async (tracks: SpotifyTrack[], genre: StoryGenre): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const tracksSummary = tracks
    .reverse() // chronologically from first to last
    .map((t, i) => `${i + 1}. "${t.name}" by ${t.artist}`)
    .join("\n");

  const prompt = `
    I have a list of songs I recently listened to, in chronological order from first to most recent.
    Please write a ${genre} story where each song represents a key plot point, emotional beat, or chapter in the narrative.
    
    The story should feel cohesive and the transitions between tracks should make sense narratively. 
    Incorporate the vibe and titles of the songs into the prose naturally.
    
    Genre: ${genre}
    Sequence of Tracks:
    ${tracksSummary}
    
    Rules:
    - Write in the style of a ${genre} novel.
    - Mention the songs or their themes clearly.
    - End with a satisfying conclusion based on the final song.
    - Use Markdown for bolding and structure.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
      }
    });

    return response.text || "The stars were silent. No story could be told today.";
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to conjure the story. The AI spirits are restless.");
  }
};
