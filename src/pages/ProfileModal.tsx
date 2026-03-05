import React, { useEffect, useState } from "react";

interface HistoryItem {
  emotion: string;
  playlists: string[];
  timestamp: string;
}

interface ProfileModalProps {
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const [username, setUsername] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("username");
    setUsername(user || "");

    const fetchHistory = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/history/${user}`);
        const data = await res.json();
        setHistory(data.history || []);
      } catch (err) {
        console.error("❌ Failed to fetch history:", err);
      }
    };
    fetchHistory();
  }, []);

  const handlePasswordChange = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/update-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });

      if (res.ok) setMessage("✅ Password updated successfully!");
      else setMessage("❌ Failed to update password.");
    } catch {
      setMessage("⚠️ Server error. Try again later.");
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black/60 backdrop-blur-md z-50">
      <div className="bg-gradient-to-b from-purple-950 via-purple-900 to-black border border-purple-700 text-white p-8 rounded-2xl shadow-2xl w-[420px] max-h-[80vh] overflow-y-auto relative">
        <h2 className="text-3xl font-bold mb-4 text-center bg-gradient-to-r from-purple-300 to-pink-400 bg-clip-text text-transparent">
          👤 Profile
        </h2>

        <div className="space-y-2 mb-4 text-purple-200">
          <p><span className="font-semibold text-purple-400">Username:</span> {username}</p>
          <p><span className="font-semibold text-purple-400">Password:</span> ••••••••</p>
        </div>

        <div className="mt-4 border-t border-purple-800 pt-4">
          <h3 className="text-lg font-semibold text-purple-300 mb-2">🔐 Change Password</h3>
          <input
            type="password"
            placeholder="Old Password"
            className="w-full mb-2 px-3 py-2 rounded-lg bg-purple-950/50 border border-purple-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="New Password"
            className="w-full mb-3 px-3 py-2 rounded-lg bg-purple-950/50 border border-purple-700 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            onClick={handlePasswordChange}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-700 to-purple-500 hover:opacity-90 transition text-white font-semibold shadow-md"
          >
            Update Password
          </button>
          {message && <p className="text-sm mt-2 text-center text-purple-300">{message}</p>}
        </div>

        <div className="mt-6 border-t border-purple-800 pt-4">
          <h3 className="text-lg font-semibold text-purple-300 mb-3">🧠 Emotion History</h3>
          {history.length === 0 ? (
            <p className="text-gray-400 text-sm text-center">No history found.</p>
          ) : (
            <ul className="text-sm space-y-3">
              {history.map((h, i) => (
                <li
                  key={i}
                  className="bg-purple-950/40 border border-purple-800 rounded-lg p-3 hover:bg-purple-900/60 transition"
                >
                  <p className="text-purple-200 font-semibold">
                    Emotion: <span className="capitalize">{h.emotion}</span>
                  </p>
                  <p className="text-gray-300 text-sm">
                    Playlists: {h.playlists.join(", ")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(h.timestamp).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-gradient-to-b from-black via-purple-950 to-purple-900  text-white py-2 rounded-lg transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ProfileModal;
