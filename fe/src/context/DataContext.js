"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { initialEndpoints, initialEvents, initialAttempts } from "@/lib/mockData";
import { apiClient } from "@/lib/api";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [endpoints, setEndpoints] = useState([]);
  const [events, setEvents] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [analyticsMetrics, setAnalyticsMetrics] = useState(null);
  const [analyticsTimeseries, setAnalyticsTimeseries] = useState([]);
  const [timeseriesHours, setTimeseriesHours] = useState(24);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [endpointsRes, eventsRes, attemptsRes, metricsRes, timeseriesRes, healthRes] = await Promise.all([
        apiClient.get('/endpoints'),
        apiClient.get('/events?limit=20'), // We should limit events fetching eventually, keeping limit param just in case backend supports it
        apiClient.get('/attempts?limit=20'),
        apiClient.get('/analytics/metrics'),
        apiClient.get(`/analytics/timeseries?hours=${timeseriesHours}`),
        apiClient.get('/analytics/endpoints-health')
      ]);

      // Use backend stats instead of client-side stats
      const healthData = healthRes.data;
      const endpointsData = endpointsRes.data.map(ep => {
        const health = healthData.find(h => h.endpointId === ep.id) || { eventsCount: 0, successCount: 0 };
        return { ...ep, eventsCount: health.eventsCount, successCount: health.successCount };
      });

      setEndpoints(endpointsData);
      setEvents(eventsRes.data);
      setAttempts(attemptsRes.data);
      setAnalyticsMetrics(metricsRes.data);
      setAnalyticsTimeseries(timeseriesRes.data);
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
  }, [timeseriesHours]);

  // Background Processor removed, we now rely on real backend and polling.

  // Actions
  const addEndpoint = async (name, destinationUrl, provider) => {
    try {
      const { data } = await apiClient.post('/endpoints', { name, destinationUrl, provider });
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
    try {
      const { data } = await apiClient.post(`/events/${eventId}/retry`);
      fetchData(); // Quickly fetch latest data to show it's pending/retrying
      return { event: { status: 'retrying' } }; // return mock shape to satisfy current UI expectation
    } catch (err) {
      console.error("Failed to trigger manual retry", err);
      return null;
    }
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

  const bulkRetryDeadEvents = async () => {
    try {
      const { data } = await apiClient.post(`/events/retry-all-dead`);
      fetchData();
      return data;
    } catch (err) {
      console.error("Failed to bulk retry dead events", err);
      return null;
    }
  };

  return (
    <DataContext.Provider value={{
      endpoints,
      events,
      attempts,
      analyticsMetrics,
      analyticsTimeseries,
      timeseriesHours,
      setTimeseriesHours,
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
