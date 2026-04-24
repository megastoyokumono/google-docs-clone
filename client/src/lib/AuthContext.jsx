import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API_URL } from "./config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("docs-clone:token"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setUser(data);
        } else {
          localStorage.removeItem("docs-clone:token");
          setToken(null);
        }
      })
      .catch(() => {
        localStorage.removeItem("docs-clone:token");
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const login = useCallback((newToken, userData) => {
    localStorage.setItem("docs-clone:token", newToken);
    setToken(newToken);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("docs-clone:token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
