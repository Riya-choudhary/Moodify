// src/components/Login.tsx
import React, { useState } from "react";

interface LoginProps {
  onSuccess: (token: string, username: string) => void;
  onSwitch: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess, onSwitch }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Use URLSearchParams to send application/x-www-form-urlencoded
      const params = new URLSearchParams();
      params.append("username", username);
      params.append("password", password);

      const res = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const data = await res.json();
      if (res.ok) {
        onSuccess(data.access_token, data.username);
      } else {
        setError(data.detail || "Invalid credentials");
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Please check if FastAPI is running.");
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-gray-800 placeholder-gray-400 bg-white"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-gray-800 placeholder-gray-400 bg-white"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-primary text-white py-2 rounded-lg hover:opacity-90"
        >
          Login
        </button>
      </form>
      <p className="text-center text-sm mt-4 text-gray-600">
        Don’t have an account?{" "}
        <button onClick={onSwitch} className="text-blue-500 underline">
          Register
        </button>
      </p>
    </div>
  );
};

export default Login;
