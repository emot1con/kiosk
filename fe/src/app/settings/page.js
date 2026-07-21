"use client";

import { Server, CheckCircle2, Globe } from "lucide-react";
import { useConfig } from "@/context/ConfigContext";

export default function SettingsPage() {
  const { backendStatus } = useConfig();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 600, letterSpacing: "-0.01em" }}>Settings</h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>System configuration</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* System Info Card */}
        <div className="glass-card">
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1rem" }}>
            <Server size={16} style={{ color: "var(--accent-primary)" }} />
            <span>Instance Configuration</span>
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "420px" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Backend URL</label>
              <input className="form-input" type="text" value={apiUrl} readOnly style={{ cursor: "not-allowed", opacity: 0.7, fontFamily: "var(--font-mono)", fontSize: "0.8rem" }} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Connection Status</label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.65rem", background: "var(--bg-primary)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)" }}>
                {backendStatus === "connected" ? (
                  <><CheckCircle2 size={14} style={{ color: "var(--status-delivered)" }} /><span style={{ fontSize: "0.85rem", color: "var(--status-delivered)", fontWeight: 500 }}>Connected</span></>
                ) : (
                  <><Globe size={14} style={{ color: "var(--text-muted)" }} /><span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Checking...</span></>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}