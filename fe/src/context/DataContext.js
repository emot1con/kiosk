"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { initialEndpoints, initialEvents, initialAttempts } from "@/lib/mockData";
import { apiClient } from "@/lib/api";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [endpoints, setEndpoints] = useState([]);
  const [events, setEvents] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [endpointsRes, eventsRes, attemptsRes] = await Promise.all([
        apiClient.get('/endpoints'),
        apiClient.get('/events'),
        apiClient.get('/attempts')
      ]);

      const endpointsData = endpointsRes.data.map(ep => {
        const epEvents = eventsRes.data.filter(e => e.endpointId === ep.id);
        const successCount = epEvents.filter(e => e.status === 'delivered').length;
        return { ...ep, eventsCount: epEvents.length, successCount };
      });

      setEndpoints(endpointsData);
      setEvents(eventsRes.data);
      setAttempts(attemptsRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('kiosk_access_token');
    if (token) {
      fetchData().finally(() => {
        setIsDataLoading(false);
      });

      // Poll every 3 seconds to feel alive
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    } else {
      setIsDataLoading(false);
    }
  }, []);

  // Background Processor removed, we now rely on real backend and polling.

  // Actions
  const addEndpoint = async (name, destinationUrl) => {
    try {
      const { data } = await apiClient.post('/endpoints', { name, destinationUrl });
      const newEp = { ...data, eventsCount: 0, successCount: 0 };
      setEndpoints(prev => [newEp, ...prev]);
      return newEp;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const deleteEndpoint = async (id) => {
    try {
      await apiClient.delete(`/endpoints/${id}`);
      setEndpoints(prev => prev.filter(ep => ep.id !== id));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const toggleEndpointActive = async (id) => {
    try {
      const ep = endpoints.find(e => e.id === id);
      if (!ep) return;

      const { data } = await apiClient.patch(`/endpoints/${id}`, { isActive: !ep.isActive });

      setEndpoints(prev => prev.map(p => {
        if (p.id === id) {
          return { ...p, isActive: data.isActive };
        }
        return p;
      }));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Simulates a manual retry
  const triggerManualRetry = async (eventId, forceSuccess = false) => {
    // TODO: Implement actual manual retry API in backend if needed
    // For now, we will leave this as a stub since real retries happen automatically
    console.warn("Manual retry not fully implemented in real backend yet.");
    return null;
  };

  // Simulates incoming event using real Ingress API
  const simulateIncomingEvent = async (endpointId, provider = "Stripe", customPayload = null) => {
    const ep = endpoints.find(e => e.id === endpointId);
    if (!ep) return null;

    try {
      const payload = customPayload || {
        event: "test.triggered",
        timestamp: Date.now(),
        user: { name: "Test User", email: "test@kiosk.dev" },
        metadata: { source: "Simulated Webhook" }
      };

      await apiClient.post(`/incoming/${ep.incomingKey}`, payload, {
        headers: {
          "User-Agent": `${provider}/1.0`,
        }
      });
      // It will be fetched automatically by the polling `fetchData` interval
    } catch (err) {
      console.error("Failed to send incoming webhook", err);
    }
  };

  const bulkRetryDeadEvents = () => {
    console.warn("Bulk retry not implemented in real backend yet.");
  };

  return (
    <DataContext.Provider value={{
      endpoints,
      events,
      attempts,
      isDataLoading,
      addEndpoint,
      deleteEndpoint,
      toggleEndpointActive,
      triggerManualRetry,
      simulateIncomingEvent,
      bulkRetryDeadEvents
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
