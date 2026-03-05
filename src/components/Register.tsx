// src/components/Register.tsx
import React, { useState } from "react";

interface RegisterProps {
  onSuccess: () => void;
  onSwitch: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSuccess, onSwitch }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("Registration successful! Please log in.");
        setTimeout(() => onSuccess(), 900);
      } else {
        setError(data.detail || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Please check if FastAPI is running.");
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      <form onSubmit={handleRegister} className="space-y-4">
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
        {success && <p className="text-green-600 text-sm">{success}</p>}
        <button
          type="submit"
          className="w-full bg-primary text-white py-2 rounded-lg hover:opacity-90"
        >
          Register
        </button>
      </form>
      <p className="text-center text-sm mt-4 text-gray-600">
        Already have an account?{" "}
        <button onClick={onSwitch} className="text-blue-500 underline">
          Login
        </button>
      </p>
    </div>
  );
};

export default Register;
