"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Webhook, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  HelpCircle
} from "lucide-react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/Modal";
import EmptyState from "@/components/EmptyState";
import styles from "./endpoints.module.css";

export default function EndpointsPage() {
  const { endpoints, events, attempts, addEndpoint, deleteEndpoint, toggleEndpointActive, isDataLoading } = useData();
  const { showToast } = useToast();
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEpName, setNewEpName] = useState("");
  const [newEpUrl, setNewEpUrl] = useState("");
  const [formError, setFormError] = useState("");

  // Copy states
  const [copiedId, setCopiedId] = useState(null);
  const [copiedType, setCopiedType] = useState(null); // 'source' or 'dest'

  if (isDataLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading endpoints...</p>
      </div>
    );
  }

  const handleCopy = (text, id, type) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setCopiedType(type);
    showToast(type === "source" ? "Webhook Source URL berhasil disalin!" : "Destination URL berhasil disalin!", "success");
    setTimeout(() => {
      setCopiedId(null);
      setCopiedType(null);
    }, 2000);
  };

  const handleDelete = (id, name) => {
    if (confirm(`Apakah Anda yakin ingin menghapus endpoint "${name}"?\nSemua event history untuk endpoint ini juga akan dihapus.`)) {
      deleteEndpoint(id);
      showToast(`Endpoint "${name}" berhasil dihapus.`, "success");
    }
  };

  const handleCreateEndpoint = (e) => {
    e.preventDefault();
    setFormError("");

    if (!newEpName || !newEpUrl) {
      setFormError("Semua field wajib diisi");
      return;
    }

    // Basic URL validation
    try {
      new URL(newEpUrl);
    } catch (_) {
      setFormError("Format URL tujuan tidak valid (harus diawali http:// atau https://)");
      return;
    }

    addEndpoint(newEpName, newEpUrl);
    showToast(`Endpoint "${newEpName}" berhasil dibuat.`, "success");
    
    // Reset form
    setNewEpName("");
    setNewEpUrl("");
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className={styles.headerRow}>
        <div className={styles.titleSection}>
          <h1 className={styles.pageTitle}>Endpoints</h1>
          <p className={styles.pageSubtitle}>Kelola URL aplikasi tujuan Anda dan pasang webhook url di provider</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>New Endpoint</span>
        </button>
      </div>

      <div className={`${styles.card} glass-card`}>
        {endpoints.length === 0 ? (
          <EmptyState 
            icon={Webhook}
            title="Belum Ada Endpoint"
            description="Endpoint berfungsi untuk menerima payload webhook dari provider (Stripe/Github) dan meneruskannya ke server lokal/aplikasi Anda."
            actionText="Buat Endpoint Pertama"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Name</th>
                  <th>Webhook Source URL</th>
                  <th>Destination URL</th>
                  <th style={{ textAlign: "center" }}>Uptime Health</th>
                  <th>Avg Latency</th>
                  <th>Total Events</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((ep) => {
                  const sourceUrl = `https://kiosk.dev/incoming/${ep.incomingKey}`;
                  const healthPercent = ep.eventsCount > 0 
                    ? Math.round((ep.successCount / ep.eventsCount) * 100) 
                    : 100;
                  
                  const epEvents = events ? events.filter(e => e.endpointId === ep.id) : [];
                  const epEventIds = epEvents.map(e => e.id);
                  const epAttempts = attempts ? attempts.filter(a => epEventIds.includes(a.eventId)) : [];
                  const avgLatency = epAttempts.length > 0
                    ? Math.round(epAttempts.reduce((sum, a) => sum + (a.latencyMs || 0), 0) / epAttempts.length)
                    : 0;
                  
                  return (
                    <tr key={ep.id} style={{ opacity: ep.isActive !== false ? 1 : 0.6 }}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <label className={styles.switch}>
                            <input 
                              type="checkbox" 
                              checked={ep.isActive !== false} 
                              onChange={() => {
                                toggleEndpointActive(ep.id);
                                const nextState = ep.isActive !== false ? "Paused" : "Active";
                                showToast(`Endpoint "${ep.name}" status diubah ke ${nextState}`, "info");
                              }}
                            />
                            <span className={styles.slider}></span>
                          </label>
                          <span className={`${styles.statusBadge} ${ep.isActive !== false ? styles.statusActive : styles.statusPaused}`}>
                            {ep.isActive !== false ? "Active" : "Paused"}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        <Link href={`/endpoints/${ep.id}`} style={{ color: "var(--text-primary)" }}>
                          {ep.name}
                        </Link>
                      </td>
                      <td>
                        <div className={styles.urlContainer}>
                          <span className={styles.urlText} title={sourceUrl}>{sourceUrl}</span>
                          <button 
                            className={styles.copyBtn} 
                            onClick={() => handleCopy(sourceUrl, ep.id, "source")}
                            title="Copy source webhook url"
                          >
                            {copiedId === ep.id && copiedType === "source" ? (
                              <Check size={14} style={{ color: "var(--status-delivered)" }} />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className={styles.urlContainer}>
                          <span className={styles.urlText} title={ep.destinationUrl}>{ep.destinationUrl}</span>
                          <button 
                            className={styles.copyBtn} 
                            onClick={() => handleCopy(ep.destinationUrl, ep.id, "dest")}
                            title="Copy destination url"
                          >
                            {copiedId === ep.id && copiedType === "dest" ? (
                              <Check size={14} style={{ color: "var(--status-delivered)" }} />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ 
                          fontWeight: 600, 
                          color: healthPercent >= 85 ? "var(--status-delivered)" : healthPercent >= 50 ? "var(--status-retrying)" : "var(--status-dead)",
                          fontSize: "0.85rem"
                        }}>
                          {ep.eventsCount === 0 ? "-" : `${healthPercent}%`}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: "var(--text-primary)", fontWeight: 600, fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                          {avgLatency > 0 ? `${avgLatency}ms` : "-"}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.85rem" }}>
                        {ep.eventsCount}
                      </td>
                      <td>
                        <div className={styles.actionCell}>
                          <Link href={`/endpoints/${ep.id}`} className="btn btn-secondary btn-sm" title="Detail Endpoint">
                            <ChevronRight size={14} />
                          </Link>
                          <button 
                            className={styles.deleteBtn}
                            onClick={() => handleDelete(ep.id, ep.name)}
                            title="Delete Endpoint"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="glass-card" style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
        <HelpCircle size={20} style={{ color: "var(--accent-primary)", flexShrink: 0, marginTop: "1px" }} />
        <div>
          <h4 style={{ marginBottom: "0.25rem", color: "var(--text-primary)", fontSize: "0.9rem", fontWeight: 600 }}>Cara Kerja Webhook Reliability Layer</h4>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
            1. Salin <strong>Webhook Source URL</strong> di atas dan pasang di dashboard provider Anda (misal Stripe Webhook settings atau GitHub repository webhook).<br />
            2. Saat provider mengirimkan event, Kiosk akan menerima data tersebut, mengamankannya di database, mengembalikan response HTTP 200 dengan cepat, lalu memicu worker antrian untuk meneruskannya ke <strong>Destination URL</strong> milik server lokal Anda.<br />
            3. Jika server Anda down, Kiosk akan menjadwalkan ulang (retry) pengiriman secara berkala dengan strategi eksponensial backoff.
          </p>
        </div>
      </div>

      {/* Create Endpoint Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setFormError(""); }} title="Buat Endpoint Baru">
        <form onSubmit={handleCreateEndpoint}>
          {formError && <div className={styles.error} style={{ marginBottom: "1rem" }}>{formError}</div>}
          
          <div className="form-group">
            <label className="form-label" htmlFor="ep-name">Nama Endpoint</label>
            <input 
              id="ep-name"
              className="form-input" 
              type="text" 
              placeholder="stripe-payment-production" 
              value={newEpName}
              onChange={(e) => setNewEpName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ep-url">Destination URL (Target Server)</label>
            <input 
              id="ep-url"
              className="form-input" 
              type="text" 
              placeholder="https://api.mywebsite.com/webhooks/stripe" 
              value={newEpUrl}
              onChange={(e) => setNewEpUrl(e.target.value)}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem", display: "block" }}>
              URL server lokal atau production Anda yang bertugas memproses webhook.
            </span>
          </div>

          <div className={styles.modalButtons}>
            <button type="button" className="btn btn-secondary" onClick={() => { setIsModalOpen(false); setFormError(""); }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Endpoint
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
