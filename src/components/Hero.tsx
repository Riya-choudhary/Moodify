import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Music, Sparkles, Heart, X, Play, Share2 } from "lucide-react";

interface HeroProps {
  onStart: () => void;
  user: string | null;
  onLogout: () => void;
}

interface PlaylistItem {
  title: string;
  url: string;
}

const Hero: React.FC<HeroProps> = ({ onStart, user, onLogout }) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<PlaylistItem[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<PlaylistItem[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const initial = username ? username.charAt(0).toUpperCase() : "";

  useEffect(() => {
    if (user) {
      const storedUser = localStorage.getItem("username");
      if (storedUser) setUsername(storedUser);
    } else {
      setUsername(null);
      setShowSidebar(false);
    }
  }, [user]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!username) return;
      try {
        const [favRes, recentRes, historyRes] = await Promise.all([
          fetch(`http://127.0.0.1:8000/api/favorites/${username}`),
          fetch(`http://127.0.0.1:8000/api/recent/${username}`),
          fetch(`http://127.0.0.1:8000/api/history/${username}`),
        ]);

        const favData = await favRes.json();
        const recentData = await recentRes.json();
        const historyData = await historyRes.json();

        setFavorites(favData.favorites || []);
        setRecentlyPlayed(recentData.recent || []);
        setHistory(historyData.history || []);
      } catch (err) {
        console.error("❌ Failed to fetch user data:", err);
      }
    };
    if (showSidebar) fetchUserData();
  }, [showSidebar, username]);

  const handlePasswordUpdate = async () => {
    if (!newPassword.trim()) return;
    try {
      const res = await fetch("http://127.0.0.1:8000/api/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, new_password: newPassword }),
      });
      if (res.ok) {
        alert("✅ Password updated successfully!");
        setNewPassword("");
      } else {
        alert("❌ Failed to update password.");
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Server error updating password.");
    }
  };

  const demoPlaylists = [
    { emoji: "🌙", title: "Chill Vibes", description: "Unwind after a long day with lo-fi beats." },
    { emoji: "☀️", title: "Morning Boost", description: "Start your day with positive pop hits." },
    { emoji: "🎧", title: "Focus Flow", description: "Stay focused with smooth instrumental tunes." },
    { emoji: "💪", title: "Workout Beats", description: "Power up your workout with energetic beats." },
    { emoji: "🌧️", title: "Rainy Day Mood", description: "Relax to soothing piano and indie tracks." },
    { emoji: "🔥", title: "Party Starter", description: "Turn up the energy with dance bangers." },
    { emoji: "🧘‍♀️", title: "Meditation Space", description: "Find inner peace with calm melodies." },
    { emoji: "🎬", title: "Cinematic Journey", description: "Experience epic movie soundtracks." },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 bg-gradient-to-b from-[#010409] via-[#0c1b33] to-[#152238] text-white">
      {/* Profile Circle */}
      {username && (
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={() => setShowSidebar(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-b from-[#0a0f1f] via-[#0c1b33] to-[#152238] text-cyan-400 font-bold text-lg shadow-lg hover:scale-110 transition-transform duration-200 border border-cyan-700"
          >
            {initial}
          </button>
        </div>
      )}

      {/* Logout */}
      {user && (
        <button
          onClick={() => {
            onLogout();
            setShowSidebar(false);
          }}
          className="absolute top-6 right-6 bg-gradient-to-r from-[#0a0f1f] to-[#0f274a] text-cyan-300 px-4 py-2 rounded-md shadow-md hover:opacity-90 transition border border-cyan-700"
        >
          Logout
        </button>
      )}

      {/* Sidebar */}
      {showSidebar && (
        <div className="fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-[#010409] via-[#0c1b33] to-[#152238] text-white shadow-[0_0_30px_rgba(0,255,255,0.25)] border-r border-cyan-800 z-40 p-6 overflow-y-auto rounded-r-3xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-cyan-300">Your Profile</h2>
            <button onClick={() => setShowSidebar(false)}>
              <X className="w-6 h-6 text-cyan-400 hover:text-white transition" />
            </button>
          </div>

          <p className="mb-2">
            <strong className="text-cyan-400">Username:</strong> {username}
          </p>
          <p>
            <strong className="text-cyan-400">Password:</strong> ••••••••
          </p>

          {/* Update Password */}
          <div className="mt-4">
            <label className="block text-cyan-400 font-semibold mb-1">Update Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-cyan-800 bg-[#0b1220]/60 rounded-lg px-3 py-2 mb-2 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <Button
              onClick={handlePasswordUpdate}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white w-full py-2 rounded-lg hover:opacity-90 transition"
            >
              Update
            </Button>
          </div>

          {/* Recently Played */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-cyan-300 mb-2">🎧 Recently Played</h3>
            <div className="max-h-36 overflow-y-auto border border-cyan-800 rounded-lg p-3 bg-[#0b1220]/50 shadow-inner">
              {recentlyPlayed.length === 0 ? (
                <p className="text-sm text-gray-400">No recent playlists.</p>
              ) : (
                recentlyPlayed.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => p.url && window.open(p.url, "_blank")}
                    className="block w-full text-left text-gray-200 mb-1 hover:text-cyan-400 transition"
                  >
                    • {p.title}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Favorites */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-cyan-300 mb-2">❤️ Favorites</h3>
            <div className="max-h-36 overflow-y-auto border border-cyan-800 rounded-lg p-3 bg-[#0b1220]/50 shadow-inner">
              {favorites.length === 0 ? (
                <p className="text-sm text-gray-400">No favorites yet.</p>
              ) : (
                favorites.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => f.url && window.open(f.url, "_blank")}
                    className="block w-full text-left text-gray-200 mb-1 hover:text-cyan-400 transition"
                  >
                    • {f.title}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Emotion History */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-cyan-300 mb-2">🧠 Emotion History</h3>
            <div className="max-h-60 overflow-y-auto border border-cyan-800 rounded-lg p-3 bg-[#0b1220]/50 shadow-inner">
              {history.length === 0 ? (
                <p className="text-sm text-gray-400">No emotions detected yet.</p>
              ) : (
                history.map((entry, i) => (
                  <div
                    key={i}
                    className="mb-3 p-2 rounded-lg border-b border-cyan-700 bg-[#0b1220]/60 hover:bg-[#0f172a] transition"
                  >
                    <p className="font-medium text-cyan-300">
                      Emotion: <span className="capitalize">{entry.emotion}</span>
                    </p>
                    <p className="text-sm text-gray-300">
                      Playlists: {entry.playlists?.join(", ")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section (unchanged) */}
      <div className="relative z-10 text-center max-w-5xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-8 animate-pulse-slow">
          <Music className="w-12 h-12 text-cyan-400" />
          <Sparkles className="w-8 h-8 text-blue-400" />
          <Heart className="w-10 h-10 text-cyan-400" />
        </div>

        <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent leading-tight">
          Moodify
        </h1>

        <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
          Music That Understands Your Emotions
        </p>
        <p className="text-base md:text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
          Real-time emotion detection powered by AI. Get personalized music recommendations
          that match your mood perfectly.
        </p>

        <Button
          size="lg"
          onClick={onStart}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
        >
          Start Detecting Your Mood
        </Button>
      </div>

      {/* Demo Cards */}
      {!user && (
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-20 max-w-7xl mx-auto">
          {demoPlaylists.map((pl, i) => (
            <div
              key={i}
              className="group bg-gradient-to-b from-[#0b1220]/70 via-[#0c1b33]/50 to-[#010409]/60 border border-cyan-800 backdrop-blur-md rounded-2xl p-6 hover:scale-105 transition-all duration-500"
            >
              <div className="text-5xl mb-4 animate-bounce-slow group-hover:animate-spin-slow text-center">
                {pl.emoji}
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3 text-center">
                {pl.title}
              </h3>
              <p className="text-gray-300 text-sm mb-6 text-center">{pl.description}</p>
              <div className="flex justify-center gap-4">
                <Button className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <Play className="w-4 h-4" /> Play
                </Button>
                <Button className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Share
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Hero;
