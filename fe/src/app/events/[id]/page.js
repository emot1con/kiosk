"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  RotateCw,
  Copy,
  Check,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  FileCode,
  Activity
} from "lucide-react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import StatusBadge from "@/components/StatusBadge";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import styles from "../events.module.css";

export default function EventDetailPage() {
  const params = useParams();
  const { id } = params;
  const { events, endpoints, attempts: allAttempts, triggerManualRetry, isDataLoading } = useData();
  const { showToast } = useToast();

  // Local state
  const [copied, setCopied] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  if (isDataLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading event details...</p>
      </div>
    );
  }

  const event = events.find(e => e.id === id);

  if (!event) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h3 style={{ color: "var(--status-dead)" }}>Event Tidak Ditemukan</h3>
        <Link href="/events" className="btn btn-secondary btn-sm" style={{ marginTop: "1rem" }}>
          Kembali ke Logs
        </Link>
      </div>
    );
  }

  const endpoint = endpoints.find(ep => ep.id === event.endpointId);
  const attempts = allAttempts
    .filter(a => a.eventId === id)
    .sort((a, b) => new Date(b.attemptedAt) - new Date(a.attemptedAt));

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(event.payload, null, 2));
    setCopied(true);
    showToast("Payload berhasil disalin ke clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualRetry = async () => {
    setIsRetrying(true);
    // Simulate loading spin
    await new Promise(resolve => setTimeout(resolve, 800));
    const result = await triggerManualRetry(event.id);
    setIsRetrying(false);

    if (result && result.event) {
      if (result.event.status === "delivered") {
        showToast("Webhook berhasil dikirim kembali!", "success");
      } else if (result.event.status === "dead") {
        showToast("Pengiriman ulang gagal. Event masuk ke Dead Letter queue.", "error");
      } else {
        showToast("Webhook dijadwalkan untuk dikirim ulang (Retrying).", "info");
      }
    } else {
      showToast("Gagal memproses ulang webhook.", "error");
    }
  };

  return (
    <div>
      {/* Back button */}
      <Link href="/events" className={styles.backBtn}>
        <ArrowLeft size={16} />
        <span>Back to Event Logs</span>
      </Link>

      {/* Header section */}
      <div className={styles.headerRow}>
        <div className={styles.titleSection}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h1 className={styles.pageTitle}>Event: {event.id}</h1>
            <StatusBadge status={event.status} />
          </div>
          <p className={styles.pageSubtitle}>
            Diterima via provider <strong style={{ color: "var(--text-primary)" }}>{event.provider}</strong> • {formatDateTime(event.createdAt)}
          </p>
        </div>

        {/* Retry Button - enabled only for dead or pending/failed states */}
        {(event.status === "dead" || event.status === "failed") && (
          <button
            className="btn btn-primary"
            onClick={handleManualRetry}
            disabled={isRetrying}
          >
            <RotateCw size={14} className={isRetrying ? "animate-spin" : ""} />
            <span>{isRetrying ? "Retrying..." : "Manual Retry"}</span>
          </button>
        )}
      </div>

      {/* Meta cards info */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>

        <div className="glass-card" style={{ padding: "1rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>
            Target Endpoint
          </span>
          <span style={{ fontWeight: 600, color: "var(--text-link)" }}>
            {endpoint ? (
              <Link href={`/endpoints/${endpoint.id}`}>
                {endpoint.name}
              </Link>
            ) : (
              "unknown"
            )}
          </span>
        </div>

        <div className="glass-card" style={{ padding: "1rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>
            Destination URL
          </span>
          <span style={{ fontSize: "0.95rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", wordBreak: "break-all" }}>
            {endpoint ? endpoint.destinationUrl : "—"}
          </span>
        </div>

        <div className="glass-card" style={{ padding: "1rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>
            Retry Progress
          </span>
          <span style={{ fontWeight: 600 }}>
            {event.retryCount} / {event.maxRetries} Kali
          </span>
        </div>

        <div className="glass-card" style={{ padding: "1rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>
            Next Attempt
          </span>
          <span style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.25rem", color: event.nextAttemptAt ? "var(--status-retrying)" : "var(--text-muted)" }}>
            <Clock size={14} />
            {event.nextAttemptAt ? formatRelativeTime(event.nextAttemptAt) : "None"}
          </span>
        </div>

      </div>

      {/* Grid: Payload and Timeline */}
      <div className={styles.detailGrid}>

        {/* Payload Card */}
        <div className={`${styles.payloadCard} glass-card`}>
          <div className={styles.payloadHeader}>
            <span style={{ fontWeight: 600, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <FileCode size={14} style={{ color: "var(--accent-primary)" }} />
              <span>JSON Payload</span>
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleCopyPayload}
            >
              {copied ? (
                <>
                  <Check size={13} style={{ color: "var(--status-delivered)" }} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className={styles.payloadBody}>
            {JSON.stringify(event.payload, null, 2)}
          </div>
        </div>

        {/* Timeline attempts Card */}
        <div className={`${styles.timelineCard} glass-card`}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Activity size={16} style={{ color: "var(--accent-primary)" }} />
            <span>Delivery Timeline</span>
          </h3>

          {attempts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-secondary)" }}>
              <Clock size={32} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
              <p>Belum ada rekaman percobaan pengiriman.</p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                Kiosk sedang memproses antrian atau menunda pengantaran.
              </p>
            </div>
          ) : (
            <div className={styles.timelineList}>
              {attempts.map((attempt, index) => {
                const isSuccess = attempt.responseStatus >= 200 && attempt.responseStatus < 300;

                return (
                  <div key={attempt.id} className={styles.timelineItem}>
                    <div className={`${styles.timelineDot} ${isSuccess ? styles.success : styles.failed}`} />
                    <div className={styles.timelineHeader}>
                      <span className={styles.timelineTitle} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        {isSuccess ? (
                          <CheckCircle size={14} style={{ color: "var(--status-delivered)" }} />
                        ) : (
                          <XCircle size={14} style={{ color: "var(--status-dead)" }} />
                        )}
                        <span>
                          Attempt #{attempts.length - index}: HTTP {attempt.responseStatus || "ERROR"}
                        </span>
                      </span>
                      <span className={styles.timelineTime}>
                        {formatDateTime(attempt.attemptedAt)} ({formatRelativeTime(attempt.attemptedAt)})
                      </span>
                    </div>
                    <div className={styles.timelineLog}>
                      {attempt.responseBody || (attempt.responseStatus ? `HTTP ${attempt.responseStatus} OK - Payload accepted by target server` : 'Connection timeout / Error')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
