import React, { useEffect, useState } from "react";

const Profile: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const username = localStorage.getItem("username");

  useEffect(() => {
    const fetchHistory = async () => {
      const res = await fetch(`http://127.0.0.1:8000/api/history/${username}`);
      const data = await res.json();
      setHistory(data.history || []);
    };
    if (username) fetchHistory();
  }, [username]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">🧑‍🎤 {username}'s Emotion History</h2>
      {history.length === 0 ? (
        <p>No history yet.</p>
      ) : (
        <ul className="space-y-2">
          {history.map((h, i) => (
            <li key={i} className="border p-2 rounded shadow">
              <b>{h.emotion}</b> → {h.playlist}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Profile;
