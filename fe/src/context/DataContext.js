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

  // Initialize data from localStorage or mockData
  useEffect(() => {
    const fetchEndpoints = async () => {
      try {
        const { data } = await apiClient.get('/endpoints');
        // add missing local mock stats
        const enriched = data.map(ep => ({ ...ep, eventsCount: 0, successCount: 0 }));
        setEndpoints(enriched);
      } catch (err) {
        console.error("Failed to fetch endpoints", err);
        setEndpoints([]);
      }
    };

    const savedEvents = localStorage.getItem("kiosk_events");
    const savedAttempts = localStorage.getItem("kiosk_attempts");

    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    } else {
      setEvents(initialEvents);
      localStorage.setItem("kiosk_events", JSON.stringify(initialEvents));
    }

    if (savedAttempts) {
      setAttempts(JSON.parse(savedAttempts));
    } else {
      setAttempts(initialAttempts);
      localStorage.setItem("kiosk_attempts", JSON.stringify(initialAttempts));
    }

    // Only fetch if we have an auth token
    const token = localStorage.getItem('kiosk_access_token');
    if (token) {
      fetchEndpoints().finally(() => {
        setIsDataLoading(false);
      });
    } else {
      setIsDataLoading(false);
    }
  }, []);

  // Save helper
  const saveToStorage = (key, data, setter) => {
    setter(data);
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Background Processor for "Pending" events to make it feel alive!
  useEffect(() => {
    if (isDataLoading) return;

    const pendingEvents = events.filter(e => {
      if (e.status !== "pending") return false;
      const ep = endpoints.find(p => p.id === e.endpointId);
      // Skip processing if endpoint is paused
      return ep ? ep.isActive !== false : true;
    });
    if (pendingEvents.length === 0) return;

    const timer = setTimeout(() => {
      const updatedEvents = [...events];
      const updatedAttempts = [...attempts];
      const updatedEndpoints = [...endpoints];

      pendingEvents.forEach(event => {
        const idx = updatedEvents.findIndex(e => e.id === event.id);
        if (idx !== -1) {
          // 80% success rate for initial attempts
          const isSuccess = Math.random() > 0.2;
          const status = isSuccess ? "delivered" : "retrying";
          const httpStatus = isSuccess ? 200 : 500;
          const responseBody = isSuccess 
            ? JSON.stringify({ received: true, status: "ok" }) 
            : JSON.stringify({ error: "Internal Server Error", message: "Temporary failure" });
          
          updatedEvents[idx] = {
            ...updatedEvents[idx],
            status,
            retryCount: isSuccess ? 0 : 1,
            nextRetryAt: isSuccess ? null : new Date(Date.now() + 60 * 1000).toISOString() // retry in 1m
          };

          // Add attempt log
          const newAttempt = {
            id: "att_" + Math.random().toString(36).substr(2, 9),
            eventId: event.id,
            attemptedAt: new Date().toISOString(),
            responseStatus: httpStatus,
            responseBody,
            latencyMs: Math.floor(Math.random() * 200) + 50
          };
          updatedAttempts.unshift(newAttempt);

          // Update stats of endpoint
          const epIdx = updatedEndpoints.findIndex(ep => ep.id === event.endpointId);
          if (epIdx !== -1) {
            updatedEndpoints[epIdx] = {
              ...updatedEndpoints[epIdx],
              eventsCount: updatedEndpoints[epIdx].eventsCount + 1,
              successCount: updatedEndpoints[epIdx].successCount + (isSuccess ? 1 : 0)
            };
          }
        }
      });

      saveToStorage("kiosk_events", updatedEvents, setEvents);
      saveToStorage("kiosk_attempts", updatedAttempts, setAttempts);
      saveToStorage("kiosk_endpoints", updatedEndpoints, setEndpoints);
    }, 4000);

    return () => clearTimeout(timer);
  }, [events, attempts, endpoints, isDataLoading]);

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
      
      // clean up associated events and attempts
      const associatedEvents = events.filter(e => e.endpointId === id);
      const associatedEventIds = associatedEvents.map(e => e.id);
      
      const nextEvents = events.filter(e => e.endpointId !== id);
      const nextAttempts = attempts.filter(a => !associatedEventIds.includes(a.eventId));

      saveToStorage("kiosk_events", nextEvents, setEvents);
      saveToStorage("kiosk_attempts", nextAttempts, setAttempts);
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
    await new Promise(resolve => setTimeout(resolve, 1000)); // Network delay

    const updatedEvents = [...events];
    const eventIdx = updatedEvents.findIndex(e => e.id === eventId);
    if (eventIdx === -1) return null;

    const event = updatedEvents[eventIdx];
    
    // For presentation/demo, we can toggle success or succeed on retry
    const isSuccess = forceSuccess || Math.random() > 0.25; // 75% success chance
    const httpStatus = isSuccess ? 200 : 503;
    const responseBody = isSuccess 
      ? JSON.stringify({ success: true, message: "Webhook accepted on retry" }) 
      : JSON.stringify({ error: "Service Unavailable", message: "Rate limit or worker busy" });

    // Update attempt log
    const newAttempt = {
      id: "att_" + Math.random().toString(36).substr(2, 9),
      eventId,
      attemptedAt: new Date().toISOString(),
      responseStatus: httpStatus,
      responseBody,
      latencyMs: Math.floor(Math.random() * 400) + 100
    };

    const nextAttempts = [newAttempt, ...attempts];

    // Update Event status
    const newRetryCount = event.retryCount + 1;
    let newStatus = event.status;
    let nextRetry = null;

    if (isSuccess) {
      newStatus = "delivered";
    } else {
      if (newRetryCount >= event.maxRetries) {
        newStatus = "dead";
      } else {
        newStatus = "retrying";
        nextRetry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins delay
      }
    }

    updatedEvents[eventIdx] = {
      ...event,
      status: newStatus,
      retryCount: newRetryCount,
      nextRetryAt: nextRetry
    };

    // Update Endpoint success count
    const updatedEndpoints = [...endpoints];
    const epIdx = updatedEndpoints.findIndex(ep => ep.id === event.endpointId);
    if (epIdx !== -1 && isSuccess && event.status !== "delivered") {
      updatedEndpoints[epIdx] = {
        ...updatedEndpoints[epIdx],
        successCount: updatedEndpoints[epIdx].successCount + 1
      };
      saveToStorage("kiosk_endpoints", updatedEndpoints, setEndpoints);
    }

    saveToStorage("kiosk_events", updatedEvents, setEvents);
    saveToStorage("kiosk_attempts", nextAttempts, setAttempts);

    return { event: updatedEvents[eventIdx], attempt: newAttempt };
  };

  // Helper to simulate incoming event from custom source (useful for testing UI)
  const simulateIncomingEvent = (endpointId, provider = "Stripe", customPayload = null) => {
    const ep = endpoints.find(e => e.id === endpointId);
    if (!ep) return null;

    const newEvent = {
      id: "evt_" + Math.random().toString(36).substr(2, 9),
      endpointId,
      provider,
      status: "pending",
      retryCount: 0,
      maxRetries: 5,
      nextRetryAt: null,
      createdAt: new Date().toISOString(),
      headers: {
        "Content-Type": "application/json",
        "X-Simulated-By": "Kiosk-Dashboard",
        "User-Agent": "KioskSimulate/1.0"
      },
      payload: customPayload || {
        event: "test.triggered",
        timestamp: Date.now(),
        user: { name: "Test User", email: "test@kiosk.dev" },
        metadata: { source: "Simulated Webhook" }
      }
    };

    const nextEvents = [newEvent, ...events];
    saveToStorage("kiosk_events", nextEvents, setEvents);
    return newEvent;
  };

  const bulkRetryDeadEvents = () => {
    const updatedEvents = events.map(event => {
      if (event.status === "dead") {
        return {
          ...event,
          status: "pending",
          retryCount: 0,
          nextRetryAt: null
        };
      }
      return event;
    });
    saveToStorage("kiosk_events", updatedEvents, setEvents);
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
