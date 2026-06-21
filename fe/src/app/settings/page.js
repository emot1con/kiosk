"use client";

import { useState } from "react";
import { 
  Settings, 
  Key, 
  User, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  RefreshCw,
  AlertTriangle 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function SettingsPage() {
  const { user, apiKey, regenerateApiKey, isLoading } = useAuth();
  const { showToast } = useToast();
  
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  if (isLoading || !user) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading settings...</p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true);
      await regenerateApiKey();
      showToast("API Key berhasil diregenerasi! Kunci lama tidak berlaku lagi.", "success");
    } catch (err) {
      showToast("Gagal meregenerasi API Key.", "error");
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 600, letterSpacing: "-0.01em" }}>Settings</h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Kelola konfigurasi kredensial dan preferensi profil akun Anda</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Account Profile Card */}
        <div className="glass-card">
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1rem" }}>
            <User size={16} style={{ color: "var(--accent-primary)" }} />
            <span>Profil Akun</span>
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "420px" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Email Address</label>
              <input 
                className="form-input" 
                type="text" 
                value={user.email} 
                readOnly 
                style={{ cursor: "not-allowed", opacity: 0.7 }}
              />
            </div>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">User ID</label>
              <input 
                className="form-input" 
                type="text" 
                value={user.id} 
                readOnly 
                style={{ cursor: "not-allowed", opacity: 0.7, fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}
              />
            </div>
          </div>
        </div>

        {/* API Credentials Card */}
        <div className="glass-card">
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1rem" }}>
            <Key size={16} style={{ color: "var(--accent-primary)" }} />
            <span>Kredensial API</span>
          </h2>
          
          <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: "1.5" }}>
            Gunakan X-Api-Key ini untuk melakukan otentikasi request webhook incoming Anda. Simpan kunci ini dengan sangat aman.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Live API Key</label>
              <div style={{ display: "flex", gap: "0.35rem" }}>
                <input 
                  className="form-input" 
                  type={showKey ? "text" : "password"} 
                  value={apiKey} 
                  readOnly
                  style={{ 
                    fontFamily: "var(--font-mono)", 
                    fontSize: "0.8rem", 
                    letterSpacing: showKey ? "normal" : "0.2em" 
                  }}
                />
                
                <button 
                  onClick={() => setShowKey(!showKey)} 
                  className="btn btn-secondary"
                  style={{ padding: "0 0.5rem" }}
                  title={showKey ? "Hide key" : "Show key"}
                >
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                
                <button 
                  onClick={handleCopy} 
                  className="btn btn-secondary"
                  style={{ padding: "0 0.5rem" }}
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check size={15} style={{ color: "var(--status-delivered)" }} />
                  ) : (
                    <Copy size={15} />
                  )}
                </button>
              </div>
            </div>

            {/* Warning Alert banner */}
            <div style={{ 
              display: "flex", 
              gap: "0.5rem", 
              alignItems: "flex-start", 
              padding: "0.75rem", 
              borderRadius: "var(--radius-md)", 
              background: "var(--status-retrying-bg)", 
              border: "1px solid rgba(234, 179, 8, 0.15)" 
            }}>
              <AlertTriangle size={15} style={{ color: "var(--status-retrying)", flexShrink: 0, marginTop: "1px" }} />
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                <strong style={{ color: "var(--text-primary)" }}>Peringatan Keamanan:</strong> Jangan pernah membagikan API Key Anda ke publik atau menyematkannya langsung di aplikasi client-side (frontend). Gunakan hanya di lingkungan server backend Anda.
              </div>
            </div>

            {/* Regenerate Action button */}
            <div>
              <button 
                onClick={handleRegenerate} 
                className="btn btn-secondary"
                disabled={isRegenerating}
                style={{ borderColor: "rgba(239, 68, 68, 0.2)", color: "#f87171" }}
              >
                <RefreshCw size={14} />
                <span>Regenerate API Key</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}