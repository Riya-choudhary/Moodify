import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

interface Props {
  currentEmotion: string;
  onEmotionChange: (emotion: string) => void;
  isDetecting: boolean;
  onDetectingChange: (detecting: boolean) => void;
}

const EmotionDetector: React.FC<Props> = ({
  currentEmotion,
  onEmotionChange,
  isDetecting,
  onDetectingChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [playlist, setPlaylist] = useState<{ title: string; url: string }[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [finalDetected, setFinalDetected] = useState(false); // 🆕 prevents multiple saves

  // ✅ Playlist Mapping (one will be randomly chosen)
  const playlistMap: Record<string, { title: string; url: string }[]> = {
    happy: [
      { title: "Feel-Good Hits 😊", url: "https://open.spotify.com/playlist/37i9dQZF1DXdPec7aLTmlC" },
      { title: "Good Vibes 💫", url: "https://open.spotify.com/playlist/37i9dQZF1DX3rxVfibe1L0" },
      { title: "Uplift Me 🌈", url: "https://open.spotify.com/playlist/37i9dQZF1DX6GwdWRQMQpq" },
      { title: "Happy Beats 🎶", url: "https://open.spotify.com/playlist/37i9dQZF1DX70RN3TfWWJh" },
    ],
    sad: [
      { title: "Mellow Mood 🌧️", url: "https://open.spotify.com/playlist/37i9dQZF1DX7qK8ma5wgG1" },
      { title: "Sad Songs 😢", url: "https://open.spotify.com/playlist/37i9dQZF1DX7gIoKXt0gmx" },
      { title: "Heartfelt Tunes 💔", url: "https://open.spotify.com/playlist/37i9dQZF1DX3YSRoSdA634" },
      { title: "Deep Emotions 🎻", url: "https://open.spotify.com/playlist/37i9dQZF1DWSqBruwoIXkA" },
    ],
    surprised: [
      { title: "Unexpected Energy ⚡", url: "https://open.spotify.com/playlist/37i9dQZF1DX2WkIBRaChxW" },
      { title: "Wow Moments 😲", url: "https://open.spotify.com/playlist/37i9dQZF1DX4o1oenSJRJd" },
      { title: "Adrenaline Rush 💥", url: "https://open.spotify.com/playlist/37i9dQZF1DWZtZ8vUCzche" },
      { title: "Electric Surprise ⚡", url: "https://open.spotify.com/playlist/37i9dQZF1DX8AliSIsGeKd" },
    ],
    neutral: [
      { title: "Calm Focus ☕", url: "https://open.spotify.com/playlist/37i9dQZF1DX2A29LI7xHn1" },
      { title: "Lo-Fi Vibes 🌿", url: "https://open.spotify.com/playlist/37i9dQZF1DWU0ScTcjJBdj" },
      { title: "Chill Study 📘", url: "https://open.spotify.com/playlist/37i9dQZF1DX9RwfGbeGQwP" },
      { title: "Relax Mode 😌", url: "https://open.spotify.com/playlist/37i9dQZF1DWZIOAPKUdaKS" },
    ],
  };

  // 🧠 check login
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  // Load models once logged in
  useEffect(() => {
    if (!isLoggedIn) return;

    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
      } catch (err) {
        setError("Failed to load face detection models.");
      }
    };

    loadModels();
  }, [isLoggedIn]);

  // Start camera
  useEffect(() => {
    if (modelsLoaded && isLoggedIn) startVideo();
  }, [modelsLoaded, isLoggedIn]);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      onDetectingChange(true);
      setFinalDetected(false);
    } catch {
      setError("Camera access denied or not available.");
    }
  };

  // 🎯 Detect emotion and save only *final* one
  const detectEmotions = async () => {
    if (!videoRef.current || finalDetected) return;

    const detections = await faceapi
      .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();

    if (detections.length > 0) {
     const expressions = detections[0].expressions as unknown as { [key: string]: number };

      const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
      const [topEmotion, confidence] = sorted[0];
      onEmotionChange(topEmotion);

      // ✅ Only store once when confidence is high enough
      if (confidence > 0.7) {
        onDetectingChange(false);
        setFinalDetected(true);

        const token = localStorage.getItem("token");
        const username = localStorage.getItem("username");
        const moodPlaylists = playlistMap[topEmotion] || playlistMap["neutral"];
        const random = moodPlaylists[Math.floor(Math.random() * moodPlaylists.length)];

        try {
          const res = await fetch("http://127.0.0.1:8000/api/emotion", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
            body: JSON.stringify({
              username,
              emotion: topEmotion,
              playlist: random.title,
            }),
          });

          if (res.ok) {
            setPlaylist([random]);
            console.log("✅ Final emotion saved:", topEmotion, random.title);
          } else {
            console.warn("⚠️ Failed to store emotion");
          }
        } catch (err) {
          console.error("❌ Backend save failed:", err);
        }
      }
    }
  };

  // Run detection every second while detecting
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (modelsLoaded && isDetecting && isLoggedIn) {
      interval = setInterval(detectEmotions, 1000);
    }
    return () => clearInterval(interval);
  }, [modelsLoaded, isDetecting, isLoggedIn, finalDetected]);

  // 🧠 UI
  if (!isLoggedIn) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-2 text-red-500">🔒 Please log in first</h2>
        <p className="text-gray-600">
          You must be logged in to start emotion detection.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">🎥 Mood Detection</h2>
      {error && <p className="text-red-500">{error}</p>}

      <div className="flex justify-center">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          width="480"
          height="360"
          className="border-4 border-blue-500 rounded-xl shadow-lg transform scale-x-[-1]"
        />
      </div>

      {isDetecting ? (
        <p className="mt-4 text-lg text-yellow-500">Detecting your mood...</p>
      ) : (
        <>
          <p className="mt-4 text-lg text-green-500">
            Final Emotion: <b>{currentEmotion}</b>
          </p>

          {playlist.length > 0 && (
            <div className="mt-3">
              <a
                href={playlist[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                🎵 {playlist[0].title}
              </a>
            </div>
          )}

          {/* 🆕 Detect Again Button */}
          <button
            onClick={startVideo}
            className="mt-6 bg-primary text-white px-5 py-2 rounded-lg hover:opacity-90 transition"
          >
            Detect Again
          </button>
        </>
      )}
    </div>
  );
};

export default EmotionDetector;
