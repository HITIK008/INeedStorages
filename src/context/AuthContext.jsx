/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check localStorage on mount and ensure user exists
  useEffect(() => {
    const initUser = async () => {
      try {
        const id = await authService.ensureUserId();
        setUserId(id);
      } catch (error) {
        console.error('Failed to initialize user:', error);
        setLoading(false);
      }
      setLoading(false);
    };
    
    initUser();
  }, []);

  async function signup(id, referralCode = "") {
    const cleaned = String(id).trim().toUpperCase();
    if (cleaned.length !== 16) {
      throw new Error("ID must be 16 characters");
    }
    
    await authService.signup(cleaned, referralCode);
    setUserId(cleaned);
    return cleaned;
  }

  async function login(id) {
    const cleaned = String(id).trim().toUpperCase();
    if (cleaned.length !== 16) {
      throw new Error("ID must be 16 characters");
    }
    
    await authService.login(cleaned);
    setUserId(cleaned);
    return cleaned;
  }

  async function changeAccountId(id) {
    const cleaned = String(id).trim().toUpperCase();
    if (cleaned.length !== 16) {
      throw new Error("ID must be 16 characters");
    }

    await authService.changeAccountId(cleaned);
    setUserId(cleaned);
    return cleaned;
  }

  function logout() {
    authService.logout();
    setUserId(null);
  }

  return (
    <AuthContext.Provider value={{ userId, isAuthenticated: !!userId, login, logout, signup, changeAccountId, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
