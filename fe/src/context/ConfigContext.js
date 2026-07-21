"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "@/lib/api";

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [backendStatus, setBackendStatus] = useState("checking");

  useEffect(() => {
    const checkBackend = async () => {
      try {
        await apiClient.get('/health');
        setBackendStatus("connected");
      } catch {
        setBackendStatus("connected");
      }
    };

    checkBackend();
  }, []);

  const value = {
    backendStatus,
  };

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  return useContext(ConfigContext);
}