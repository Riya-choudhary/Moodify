import React, { useState, useEffect } from "react";
import { Heart, Share2, Play } from "lucide-react";

interface Playlist {
  id: number;
  title: string;
  artist: string;
  cover: string;
  url: string;
}

interface Props {
  mood: string;
}

const MusicRecommendations: React.FC<Props> = ({ mood }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<string[]>([]);
  const username = localStorage.getItem("username");

  // Load favorites/recentlyPlayed from localStorage on mount
  useEffect(() => {
    setFavorites(JSON.parse(localStorage.getItem("favorites") || "[]"));
    setRecentlyPlayed(JSON.parse(localStorage.getItem("recentlyPlayed") || "[]"));
  }, []);

  // 🔹 Example playlists (replace with real API data)
  const playlists: Playlist[] = [
    {
      id: 1,
      title: `${mood} Vibes Mix`,
      artist: "Various Artists",
      cover: "/images/playlist1.jpg",
      url: "https://open.spotify.com/playlist/37i9dQZF1EIdpo5I50ibyV?si=x4s-EPEURp6XrtqYd7Qbuw",
    },
    {
      id: 2,
      title: `${mood} Energy`,
      artist: "Top Charts",
      cover: "/images/playlist2.jpg",
      url: "https://open.spotify.com/playlist/3mSm688yR6UeaAJNf93Ydr?si=S4TX2YdnSLqR4iss2yR9Mg",
    },
    {
      id: 3,
      title: `${mood} Chill Flow`,
      artist: "Lo-Fi Studio",
      cover: "/images/playlist3.jpg",
      url: "https://open.spotify.com/playlist/1CqIj5C2mVMAQsaFLSY6hg?si=6h2tXCHEQB2246jcmMGPaQ",
    },
    {
      id: 4,
      title: `${mood} Deep Focus`,
      artist: "Work & Study",
      cover: "/images/playlist4.jpg",
      url: "https://open.spotify.com/playlist/14KtkIpsvzDSCXR24EqHCL?si=xBzhNfZXRpCh4SSwnM5DYg",
    },
  ];

  // 💾 Add/Remove Favorites
  const toggleFavorite = async (playlist: Playlist) => {
    if (!username) {
      alert("Please log in first!");
      return;
    }

    const isFav = favorites.includes(playlist.title);
    const updatedFavorites = isFav
      ? favorites.filter((f) => f !== playlist.title)
      : [...favorites, playlist.title];

    setFavorites(updatedFavorites);
    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));

    try {
      const endpoint = isFav
        ? "http://127.0.0.1:8000/api/favorite/remove"
        : "http://127.0.0.1:8000/api/favorite";
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          playlist_title: playlist.title,
          playlist_url: playlist.url,
        }),
      });
    } catch (err) {
      console.error("❌ Favorite update failed:", err);
    }
  };

  // 🕒 Add to Recently Played
  const addToRecent = async (playlist: Playlist) => {
    if (!username) return;

    const updatedRecents = [
      playlist.title,
      ...recentlyPlayed.filter((p) => p !== playlist.title),
    ].slice(0, 20);

    setRecentlyPlayed(updatedRecents);
    localStorage.setItem("recentlyPlayed", JSON.stringify(updatedRecents));

    try {
      await fetch("http://127.0.0.1:8000/api/recent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          playlist_title: playlist.title,
          playlist_url: playlist.url,
        }),
      });
    } catch (err) {
      console.error("❌ Failed to save recent:", err);
    }
  };

  const handleShare = async (playlist: Playlist) => {
    try {
      await navigator.clipboard.writeText(playlist.url);
      alert("✅ Playlist link copied!");
    } catch {
      alert("⚠️ Could not copy link.");
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-8">
      {playlists.map((p) => (
        <div
          key={p.id}
          className="bg-gray-900 rounded-2xl overflow-hidden shadow-lg hover:scale-105 transition-transform p-3 flex flex-col items-center text-white"
        >
          <img
            src={p.cover}
            alt={p.title}
            className="w-full h-32 object-cover rounded-xl mb-3"
          />
          <div className="text-center">
            <p className="font-semibold truncate">{p.title}</p>
            <p className="text-sm text-gray-400 truncate">{p.artist}</p>
          </div>

          <div className="flex justify-around w-full mt-3">
            <button
              onClick={() => toggleFavorite(p)}
              className={`p-2 rounded-full transition ${
                favorites.includes(p.title)
                  ? "bg-red-500/30 text-red-400"
                  : "text-gray-400 hover:text-red-400 hover:bg-red-500/10"
              }`}
              title="Favorite"
            >
              <Heart size={18} fill={favorites.includes(p.title) ? "red" : "none"} />
            </button>

            <button
              onClick={() => handleShare(p)}
              className="p-2 rounded-full text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition"
              title="Share"
            >
              <Share2 size={18} />
            </button>

            <button
              onClick={() => {
                addToRecent(p);
                window.open(p.url, "_blank");
              }}
              className="p-2 rounded-full bg-green-600 hover:bg-green-700 transition"
              title="Play"
            >
              <Play size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MusicRecommendations;
