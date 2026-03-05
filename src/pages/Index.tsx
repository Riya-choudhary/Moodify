// src/pages/Index.tsx
import Hero from "@/components/Hero";
import EmotionDetector from "@/components/EmotionDetector";
import MusicRecommendations from "@/components/MusicRecommendations";
import Login from "@/components/Login";
import Register from "@/components/Register";
import { useState, useEffect } from "react";

const Index = () => {
  const [user, setUser] = useState<string | null>(localStorage.getItem("username"));
  const [showAuth, setShowAuth] = useState<"login" | "register" | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [mood, setMood] = useState<string>("");

  useEffect(() => {
    // If user is already logged in on load, we don't auto-start scanning automatically.
    // Starting happens when clicking Start Detecting.
  }, []);

  const handleStart = () => {
    if (!user) {
      setShowAuth("login");
    } else {
      // user logged in -> show detector (start scanning)
      setIsDetecting(true);
      // scroll to detector (if present)
      setTimeout(() => document.getElementById("detector")?.scrollIntoView({ behavior: "smooth" }), 200);
    }
  };

  const handleLoginSuccess = (token: string, username: string) => {
    // Persist and start detection
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
    setUser(username);
    setShowAuth(null);

    // start scanning automatically after login
    setIsDetecting(true);
    setTimeout(() => document.getElementById("detector")?.scrollIntoView({ behavior: "smooth" }), 200);
  };

  const handleRegisterSuccess = () => {
    // keep behavior minimal: after successful register, show login modal
    setShowAuth("login");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUser(null);
    setCurrentEmotion(null);
    setPlaylist(null);
    setIsDetecting(false);
    setMood("");
  };

  const handleEmotionDetected = async (emotion: string) => {
    setCurrentEmotion(emotion);
    setMood(emotion);

    // playlist title mapping (you asked earlier for these to be stored / shown)
    const playlistsMap: Record<string, string> = {
      happy: "Feel-Good Hits 🎶",
      sad: "Mellow Mood 🌧️",
      angry: "Chill Beats 😌",
      surprised: "Discover Weekly 🔮",
      neutral: "Calm Focus ☕",
      excited: "Party Time 🎉",
      relaxed: "Lo-Fi Vibes 🌙",
      stressed: "Peaceful Escape 🌿",
      romantic: "Romantic Ballads ❤️",
      energetic: "Power Workout ⚡",
    };

    const selected = playlistsMap[emotion.toLowerCase()] || "Mood Mix 🎧";
    setPlaylist(selected);

    // send to backend (store array of playlists server-side if desired, current endpoint accepts playlist string)
    const username = localStorage.getItem("username");
    if (username) {
      try {
        await fetch("http://127.0.0.1:8000/api/emotion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, emotion, playlist: selected }),
        });
      } catch (err) {
        console.warn("Failed to save emotion to backend:", err);
      }
    }
  };

  return (
    <div className="min-h-screen">
      <Hero onStart={handleStart} user={user} onLogout={handleLogout} />

      {/* Modal wrapper for auth */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-[420px]">
            {showAuth === "login" ? (
              <Login onSuccess={handleLoginSuccess} onSwitch={() => setShowAuth("register")} />
            ) : (
              <Register onSuccess={handleRegisterSuccess} onSwitch={() => setShowAuth("login")} />
            )}
            <div className="text-right mt-3">
              <button className="text-sm text-gray-500" onClick={() => setShowAuth(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Detector visible if user logged in and scanning enabled */}
      {user && (
        <section id="detector" className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <EmotionDetector
              currentEmotion={currentEmotion || "neutral"}
              onEmotionChange={handleEmotionDetected}
              isDetecting={isDetecting}
              onDetectingChange={setIsDetecting}
            />

            {currentEmotion && !isDetecting && (
              <div className="text-center mt-10">
                <h3 className="text-3xl font-semibold mb-2">You seem {currentEmotion.toLowerCase()} 😊</h3>
                {playlist && (
                  <p className="text-lg text-muted-foreground">
                    Recommended Playlist: <span className="font-bold text-primary">{playlist}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Music recommendations */}
      {currentEmotion && playlist && !isDetecting && (
        <section className="py-20 px-4 bg-gradient-to-b from-background to-card">
          <div className="container mx-auto max-w-6xl">
            <MusicRecommendations mood={mood} />
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;
