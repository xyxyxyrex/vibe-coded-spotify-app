
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Music, 
  BookOpen, 
  Sparkles, 
  RefreshCw, 
  LogOut, 
  Settings, 
  ChevronRight,
  Play,
  History,
  Info
} from 'lucide-react';
import { SpotifyTrack, StoryGenre, GenerationState } from './types';
import { getAuthUrl, fetchRecentlyPlayed } from './services/spotifyService';
import { generateStory } from './services/geminiService';

const CLIENT_ID_STORAGE_KEY = "sonorous_spotify_client_id";
const TOKEN_STORAGE_KEY = "sonorous_spotify_token";

const App: React.FC = () => {
  const [clientId, setClientId] = useState<string>(localStorage.getItem(CLIENT_ID_STORAGE_KEY) || "");
  const [token, setToken] = useState<string>(localStorage.getItem(TOKEN_STORAGE_KEY) || "");
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [genre, setGenre] = useState<StoryGenre>(StoryGenre.FANTASY);
  const [loading, setLoading] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(!clientId);
  const [generation, setGeneration] = useState<GenerationState>({
    isGenerating: false,
    story: "",
  });

  // Handle Spotify Redirect
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const tokenMatch = hash.match(/access_token=([^&]*)/);
      if (tokenMatch) {
        const newToken = tokenMatch[1];
        setToken(newToken);
        localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
        window.location.hash = "";
      }
    }
  }, []);

  const handleLogout = () => {
    setToken("");
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId);
    setShowSettings(false);
  };

  const loadTracks = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchRecentlyPlayed(token);
      setTracks(data);
    } catch (err: any) {
      if (err.message === "EXPIRED_TOKEN") {
        handleLogout();
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadTracks();
    }
  }, [token, loadTracks]);

  const handleGenerateStory = async () => {
    if (tracks.length === 0) return;
    setGeneration({ isGenerating: true, story: "" });
    try {
      const story = await generateStory(tracks, genre);
      setGeneration({ isGenerating: false, story });
    } catch (err: any) {
      setGeneration({ isGenerating: false, story: "", error: err.message });
    }
  };

  const loginWithSpotify = () => {
    if (!clientId) {
      alert("Please provide a Spotify Client ID first!");
      setShowSettings(true);
      return;
    }
    const redirectUri = window.location.origin + window.location.pathname;
    window.location.href = getAuthUrl(clientId, redirectUri);
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-spotify-green p-2 rounded-full">
            <Music className="text-black" size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">SONOROUS STORIES</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Settings"
          >
            <Settings size={20} />
          </button>
          {token && (
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-red-400"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto p-6 space-y-8">
        {!token ? (
          <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-6">
            <div className="max-w-md space-y-4">
              <Sparkles className="mx-auto spotify-green w-12 h-12 mb-4 animate-pulse" />
              <h2 className="text-4xl font-extrabold text-white">Your music is a myth waiting to be written.</h2>
              <p className="text-gray-400">We analyze your recent Spotify listening journey and transform it into a cinematic story. Ready to meet your soundtrack's story?</p>
              
              {showSettings ? (
                <form onSubmit={handleSaveSettings} className="glass-card p-6 rounded-2xl text-left space-y-4 mt-8">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Spotify Client ID</label>
                    <input 
                      type="text" 
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="Enter your Client ID"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-spotify-green transition-colors"
                      required
                    />
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-400 bg-white/5 p-3 rounded-lg">
                    <Info size={16} className="shrink-0 text-spotify-green" />
                    <p>You can get a Client ID by creating an app on the <a href="https://developer.spotify.com/dashboard" target="_blank" className="text-spotify-green underline">Spotify Developer Dashboard</a>. Add <span className="font-mono text-white">{window.location.origin + window.location.pathname}</span> to your Redirect URIs.</p>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-2 bg-spotify-green text-black font-bold rounded-lg hover:brightness-110 transition-all"
                  >
                    Save & Proceed
                  </button>
                </form>
              ) : (
                <button 
                  onClick={loginWithSpotify}
                  className="flex items-center gap-3 px-8 py-4 bg-spotify-green text-black font-bold rounded-full hover:scale-105 transition-transform shadow-xl shadow-spotify-green/20"
                >
                  <Music size={20} />
                  Connect with Spotify
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: History & Setup */}
            <div className="lg:col-span-4 space-y-6">
              <section className="glass-card rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History size={18} className="spotify-green" />
                    <h3 className="font-semibold">Recent Soundtracks</h3>
                  </div>
                  <button 
                    onClick={loadTracks}
                    disabled={loading}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  </button>
                </div>
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-2">
                  {tracks.length > 0 ? (
                    tracks.map((track) => (
                      <div key={track.id + track.playedAt} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors group">
                        <img src={track.albumArt} alt={track.name} className="w-12 h-12 rounded-lg shadow-lg" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-spotify-green transition-colors">{track.name}</p>
                          <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500 text-sm italic">
                      No recent tracks found. Go listen to some music!
                    </div>
                  )}
                </div>
              </section>

              <section className="glass-card rounded-2xl p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Choose Genre</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(StoryGenre).map((g) => (
                      <button
                        key={g}
                        onClick={() => setGenre(g)}
                        className={`text-xs py-2 px-3 rounded-lg border transition-all ${
                          genre === g 
                          ? 'bg-spotify-green/10 border-spotify-green text-spotify-green' 
                          : 'border-white/10 hover:border-white/30 text-gray-400'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={handleGenerateStory}
                  disabled={tracks.length === 0 || generation.isGenerating}
                  className="w-full py-4 bg-white text-black font-bold rounded-full flex items-center justify-center gap-2 hover:bg-spotify-green hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generation.isGenerating ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Weaving the tale...
                    </>
                  ) : (
                    <>
                      <BookOpen size={18} />
                      Generate Narrative
                    </>
                  )}
                </button>
              </section>
            </div>

            {/* Right Column: The Story Output */}
            <div className="lg:col-span-8 space-y-6">
              {generation.story || generation.isGenerating ? (
                <div className="glass-card rounded-2xl p-8 min-h-[600px] relative overflow-hidden">
                  {generation.isGenerating && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center space-y-4">
                       <div className="w-12 h-12 border-4 border-spotify-green border-t-transparent rounded-full animate-spin"></div>
                       <p className="text-spotify-green font-medium animate-pulse">Consulting the muse of music...</p>
                    </div>
                  )}
                  <article className="prose prose-invert max-w-none">
                    <div className="mb-8 flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-spotify-green">
                      <span className="w-8 h-[1px] bg-spotify-green"></span>
                      A {genre} Tale inspired by your journey
                      <span className="w-8 h-[1px] bg-spotify-green"></span>
                    </div>
                    
                    <div className="text-gray-100 leading-relaxed space-y-6 whitespace-pre-line text-lg">
                      {generation.story ? (
                        generation.story.split('\n').map((para, i) => (
                          <p key={i} className={para.startsWith('#') ? 'text-2xl font-bold text-white' : ''}>
                            {para}
                          </p>
                        ))
                      ) : (
                        <div className="space-y-4">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-4 bg-white/5 rounded-full w-full animate-pulse" style={{ animationDelay: `${i * 150}ms` }}></div>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-6 border-dashed border-2 border-white/10">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                    <BookOpen size={40} className="text-gray-600" />
                  </div>
                  <div className="max-w-sm">
                    <h3 className="text-xl font-semibold mb-2">No story yet</h3>
                    <p className="text-gray-500 text-sm">Select a genre and click the generate button to turn your recent tracks into a legendary chronicle.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="p-6 text-center text-xs text-gray-600 border-t border-white/5">
        &copy; {new Date().getFullYear()} Sonorous Stories. Powered by Gemini AI & Spotify API.
      </footer>
    </div>
  );
};

export default App;
