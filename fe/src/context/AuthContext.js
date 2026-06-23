"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiClient } from "@/lib/api";

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

    // Listen for forced logout event from interceptor
    const handleUnauthorized = () => {
      setUser(null);
      setApiKey("");
      router.push("/login");
    };
    
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [router]);

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

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      
      setUser(data.user);
      setApiKey(""); // Reset API key on login, as it's not retrievable
      localStorage.setItem("kiosk_user", JSON.stringify(data.user));
      localStorage.setItem("kiosk_access_token", data.accessToken);
      localStorage.setItem("kiosk_refresh_token", data.refreshToken);
      
      router.push("/dashboard");
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email, password) => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.post('/auth/register', { email, password });
      
      // Do not auto-login the user. We only show success, then they must login manually.
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    setUser(null);
    setApiKey("");
    localStorage.removeItem("kiosk_user");
    localStorage.removeItem("kiosk_access_token");
    localStorage.removeItem("kiosk_refresh_token");
    router.push("/login");
  };

  const regenerateApiKey = async () => {
    try {
      const { data } = await apiClient.post('/auth/regenerate-key');
      setApiKey(data.apiKey);
      
      // Update user state with the new prefix
      if (user) {
        const updatedUser = { ...user, apiKeyPrefix: data.apiKeyPrefix };
        setUser(updatedUser);
        localStorage.setItem("kiosk_user", JSON.stringify(updatedUser));
      }
      
      return data.apiKey;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    apiKey,
    setApiKey,
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
