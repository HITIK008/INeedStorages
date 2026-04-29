import { useState } from "react";

export default function useAuth() {
  // Simple in-memory auth for now
  const [userId, setUserId] = useState(null);

  function login(id) {
    const cleaned = String(id).trim();
    if (!/^\d{16}$/.test(cleaned)) {
      throw new Error("ID must be a 16-digit number");
    }
    setUserId(cleaned);
    return cleaned;
  }

  function logout() {
    setUserId(null);
  }

  return {
    userId,
    isAuthenticated: !!userId,
    login,
    logout,
  };
}
