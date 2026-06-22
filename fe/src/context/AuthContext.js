"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load user session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("kiosk_user");
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // Protect pages
  useEffect(() => {
    if (isLoading) return;

    const isAuthPage = pathname === "/login" || pathname === "/register";
    
    if (!user && !isAuthPage) {
      router.push("/login");
    } else if (user && isAuthPage) {
      router.push("/dashboard");
    }
  }, [user, pathname, isLoading, router]);

  const generateApiKey = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "sk_live_";
    for (let i = 0; i < 24; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const login = async (email, password) => {
    setIsLoading(true);
    // Simulating API call latency
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    const mockUser = { id: "usr_1", email };

    setUser(mockUser);
    setApiKey(""); // Reset API key on login, as it's not retrievable
    localStorage.setItem("kiosk_user", JSON.stringify(mockUser));
    
    setIsLoading(false);
    router.push("/dashboard");
    return { success: true };
  };

  const register = async (email, password) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockUser = { id: "usr_" + Math.random().toString(36).substr(2, 9), email };
    const newKey = generateApiKey();

    setUser(mockUser);
    setApiKey(newKey); // Only available once after register
    localStorage.setItem("kiosk_user", JSON.stringify(mockUser));

    setIsLoading(false);
    router.push("/dashboard");
    return { success: true, apiKey: newKey };
  };

  const logout = () => {
    setUser(null);
    setApiKey("");
    localStorage.removeItem("kiosk_user");
    router.push("/login");
  };

  const regenerateApiKey = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newKey = generateApiKey();
    setApiKey(newKey);
    return newKey;
  };

  const value = {
    user,
    apiKey,
    login,
    register,
    logout,
    regenerateApiKey,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
