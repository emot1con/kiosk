"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Webhook, 
  Copy, 
  Check, 
  Play, 
  Activity, 
  Calendar,
  Layers,
  ChevronRight,
  Trash2,
  Clock
} from "lucide-react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import StatusBadge from "@/components/StatusBadge";
import Pagination from "@/components/Pagination";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import styles from "../endpoints.module.css";

export default function EndpointDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { endpoints, events, attempts, deleteEndpoint, toggleEndpointActive, simulateIncomingEvent, isDataLoading } = useData();
  const { showToast } = useToast();

  const [copiedType, setCopiedType] = useState(null);
  const [simulationProvider, setSimulationProvider] = useState("Stripe");
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  if (isDataLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading endpoint details...</p>
      </div>
    );
  }

  const endpoint = endpoints.find(ep => ep.id === id);

  const epEvents = events.filter(e => e.endpointId === id);
  const epEventIds = epEvents.map(e => e.id);
  const epAttempts = attempts ? attempts.filter(a => epEventIds.includes(a.eventId)) : [];
  const avgLatency = epAttempts.length > 0
    ? Math.round(epAttempts.reduce((sum, a) => sum + (a.latencyMs || 0), 0) / epAttempts.length)
    : 0;

  if (!endpoint) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h3 style={{ color: "var(--status-dead)" }}>Endpoint Tidak Ditemukan</h3>
        <Link href="/endpoints" className="btn btn-secondary btn-sm" style={{ marginTop: "1rem" }}>
          Kembali ke Endpoints
        </Link>
      </div>
    );
  }

  const endpointEvents = events
    .filter(e => e.endpointId === id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalItems = endpointEvents.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedEvents = endpointEvents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const sourceUrl = `https://kiosk.dev/incoming/${endpoint.incomingKey}`;
  const healthPercent = endpoint.eventsCount > 0 
    ? Math.round((endpoint.successCount / endpoint.eventsCount) * 100) 
    : 100;

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    showToast(type === "source" ? "Webhook Source URL berhasil disalin!" : "Destination URL berhasil disalin!", "success");
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDelete = () => {
    if (confirm(`Apakah Anda yakin ingin menghapus endpoint "${endpoint.name}"?\nSemua data event terkait akan hilang.`)) {
      deleteEndpoint(endpoint.id);
      showToast(`Endpoint "${endpoint.name}" berhasil dihapus.`, "success");
      router.push("/endpoints");
    }
  };

  const handleSimulate = async () => {
    if (endpoint.isActive === false) {
      showToast("Tidak dapat menyimulasikan event pada endpoint yang dijeda.", "warning");
      return;
    }
    setIsSimulating(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    
    let payload = null;
    if (simulationProvider === "Stripe") {
      payload = {
        id: "evt_stripe_" + Math.random().toString(36).substr(2, 9),
        object: "event",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_" + Math.random().toString(36).substr(2, 9),
            amount: 75000,
            currency: "idr",
            status: "succeeded"
          }
        }
      };
    } else {
      payload = {
        action: "opened",
        issue: {
          id: Math.floor(Math.random() * 100000),
          number: 42,
          title: "Bug: Webhook failing to retry properly",
          user: { login: "numpyh" }
        }
      };
    }

    simulateIncomingEvent(endpoint.id, simulationProvider, payload);
    showToast(`Webhook event (${simulationProvider}) berhasil disimulasikan!`, "success");
    setIsSimulating(false);
  };

  return (
    <div>
      <Link href="/endpoints" className={styles.backBtn}>
        <ArrowLeft size={16} />
        <span>Back to Endpoints</span>
      </Link>

      <div className={styles.headerRow}>
        <div className={styles.titleSection}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 className={styles.pageTitle}>{endpoint.name}</h1>
            <span style={{ 
              fontSize: "0.75rem", 
              fontWeight: 600,
              padding: "0.15rem 0.4rem", 
              borderRadius: "var(--radius-sm)",
              background: healthPercent >= 85 ? "var(--status-delivered-bg)" : "var(--status-dead-bg)",
              color: healthPercent >= 85 ? "var(--status-delivered)" : "var(--status-dead)",
              border: `1px solid ${healthPercent >= 85 ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`
            }}>
              {healthPercent}% Healthy
            </span>
          </div>
          <p className={styles.pageSubtitle} style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>ID: {endpoint.id}</p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "var(--bg-tertiary)", padding: "0.25rem 0.6rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)" }}>
            <label className={styles.switch}>
              <input 
                type="checkbox" 
                checked={endpoint.isActive !== false} 
                onChange={() => {
                  toggleEndpointActive(endpoint.id);
                  const nextState = endpoint.isActive !== false ? "Paused" : "Active";
                  showToast(`Endpoint "${endpoint.name}" status diubah ke ${nextState}`, "info");
                }}
              />
              <span className={styles.slider}></span>
            </label>
            <span className={`${styles.statusBadge} ${endpoint.isActive !== false ? styles.statusActive : styles.statusPaused}`} style={{ border: "none", background: "none", padding: 0 }}>
              {endpoint.isActive !== false ? "Active" : "Paused"}
            </span>
          </div>

          <button className="btn btn-danger btn-sm" onClick={handleDelete}>
            <Trash2 size={14} />
            <span>Delete Endpoint</span>
          </button>
        </div>
      </div>

      <div className={styles.detailGrid}>
        
        <div className={`${styles.detailCard} glass-card`}>
          <span className={styles.detailLabel}>Webhook Source URL</span>
          <div className={styles.detailValue}>
            <span className={styles.detailValueCode}>{sourceUrl}</span>
            <button 
              className={styles.copyBtn} 
              onClick={() => handleCopy(sourceUrl, "source")}
              title="Copy Source URL"
            >
              {copiedType === "source" ? (
                <Check size={14} style={{ color: "var(--status-delivered)" }} />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>
        </div>

        <div className={`${styles.detailCard} glass-card`}>
          <span className={styles.detailLabel}>Destination URL (Target)</span>
          <div className={styles.detailValue}>
            <span className={styles.detailValueCode}>{endpoint.destinationUrl}</span>
            <button 
              className={styles.copyBtn} 
              onClick={() => handleCopy(endpoint.destinationUrl, "dest")}
              title="Copy Destination URL"
            >
              {copiedType === "dest" ? (
                <Check size={14} style={{ color: "var(--status-delivered)" }} />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>
        </div>

        <div className={`${styles.detailCard} glass-card`}>
          <span className={styles.detailLabel}>Meta Info</span>
          <div className={styles.detailValue} style={{ fontSize: "0.82rem", color: "var(--text-secondary)", gap: "0.75rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Calendar size={14} />
              {new Date(endpoint.createdAt).toLocaleDateString("id-ID")}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Layers size={14} />
              {endpoint.eventsCount} total events
            </span>
          </div>
        </div>

        <div className={`${styles.detailCard} glass-card`}>
          <span className={styles.detailLabel}>Average Latency</span>
          <div className={styles.detailValue} style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <Clock size={15} style={{ color: "var(--text-muted)" }} />
            <span>{avgLatency > 0 ? `${avgLatency} ms` : "No attempts yet"}</span>
          </div>
        </div>

      </div>

      <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Play size={14} style={{ color: "var(--accent-primary)" }} />
          <span>Simulasi Webhook Event</span>
        </h3>
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
          Simulasikan pengiriman webhook dari provider ke Kiosk endpoint ini untuk melihat live delivery, status pending, dan automatic retry.
        </p>
        
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "0.35rem" }}>
            <button 
              type="button" 
              className={`btn btn-sm ${simulationProvider === "Stripe" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setSimulationProvider("Stripe")}
              disabled={isSimulating}
            >
              Stripe
            </button>
            <button 
              type="button" 
              className={`btn btn-sm ${simulationProvider === "GitHub" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setSimulationProvider("GitHub")}
              disabled={isSimulating}
            >
              GitHub
            </button>
          </div>
          
          <button 
            onClick={handleSimulate} 
            className="btn btn-primary btn-sm"
            disabled={isSimulating}
            style={{ marginLeft: "auto" }}
          >
            {isSimulating ? "Simulating..." : "Trigger Webhook POST"}
          </button>
        </div>
      </div>

      <div className={`${styles.card} glass-card`}>
        <h2 style={{ 
          fontSize: "0.9rem", 
          fontWeight: 600, 
          display: "flex", 
          alignItems: "center", 
          gap: "0.4rem", 
          padding: "1rem 1.25rem 0.75rem 1.25rem",
          borderBottom: "1px solid var(--border-default)",
          margin: 0
        }}>
          <Activity size={15} style={{ color: "var(--accent-primary)" }} />
          <span>Event History</span>
        </h2>

        {endpointEvents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1.5rem", color: "var(--text-secondary)" }}>
            <Activity size={32} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
            <p style={{ fontSize: "0.85rem" }}>Belum ada history webhook event pada endpoint ini.</p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Gunakan widget &quot;Simulasi Webhook Event&quot; di atas untuk mengirim event uji coba.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Event ID</th>
                  <th>Provider</th>
                  <th>Retries</th>
                  <th>Received At</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginatedEvents.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <StatusBadge status={event.status} />
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 500 }}>
                      {event.id}
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: "0.75rem", 
                        background: "var(--bg-tertiary)", 
                        padding: "0.12rem 0.35rem", 
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-default)"
                      }}>
                        {event.provider}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                      {event.retryCount} / {event.maxRetries}
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                      {formatDateTime(event.createdAt)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link href={`/events/${event.id}`} className="btn btn-secondary btn-sm">
                        <span>Detail</span>
                        <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        )}
      </div>
    </div>
  );
}