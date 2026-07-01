"use client";

import Link from "next/link";
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Skull, 
  ChevronRight, 
  Webhook, 
  Plus 
} from "lucide-react";
import { useData } from "@/context/DataContext";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import EndpointHealthBar from "@/components/EndpointHealthBar";
import DeliveryChart from "@/components/DeliveryChart";
import { formatRelativeTime } from "@/lib/utils";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const { 
    endpoints, 
    events, 
    analyticsMetrics, 
    analyticsTimeseries, 
    timeseriesHours,
    setTimeseriesHours,
    isDataLoading 
  } = useData();

  if (isDataLoading || !analyticsMetrics) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading dashboard data...</p>
      </div>
    );
  }

  // Use backend aggregated statistics
  const totalEvents = analyticsMetrics.totalEvents || 0;
  const deliveredEvents = analyticsMetrics.deliveredEvents || 0;
  const retryingEvents = analyticsMetrics.retryingEvents || 0;
  const deadEvents = analyticsMetrics.deadEvents || 0;

  // Get recent 6 events for dashboard preview
  const recentEvents = [...events]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  return (
    <div>
      <div className={styles.headerRow}>
        <div className={styles.titleSection}>
          <h1 className={styles.pageTitle}>Dashboard Overview</h1>
          <p className={styles.pageSubtitle}>Pantau performa dan kehandalan webhook pengiriman Anda</p>
        </div>
        <Link href="/endpoints" className="btn btn-primary">
          <Plus size={18} />
          <span>New Endpoint</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <StatCard 
          label="Total Events" 
          value={totalEvents} 
          icon={Activity} 
          type="total" 
        />
        <StatCard 
          label="Delivered" 
          value={deliveredEvents} 
          icon={CheckCircle2} 
          type="delivered" 
        />
        <StatCard 
          label="Retrying" 
          value={retryingEvents} 
          icon={AlertTriangle} 
          type="retrying" 
        />
        <StatCard 
          label="Dead Letter" 
          value={deadEvents} 
          icon={Skull} 
          type="dead" 
        />
      </div>

      {/* Delivery Analytics Chart */}
      <DeliveryChart 
        timeseries={analyticsTimeseries} 
        timeseriesHours={timeseriesHours}
        setTimeseriesHours={setTimeseriesHours}
      />

      {/* Main Grid: Recent Events and Endpoint Health */}
      <div className={styles.mainGrid}>
        
        {/* Recent Events Column */}
        <div className={`${styles.recentCard} glass-card`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Events</h2>
            <Link href="/events" className={styles.viewAllLink}>
              View All
            </Link>
          </div>

          {recentEvents.length === 0 ? (
            <div className={styles.emptyState}>
              <Activity size={40} style={{ opacity: 0.3 }} />
              <p>Belum ada webhook event yang masuk.</p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Kirim webhook payload ke salah satu endpoint untuk memulai.
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Endpoint</th>
                    <th>Provider</th>
                    <th>Received</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((event) => {
                    const endpoint = endpoints.find(ep => ep.id === event.endpointId);
                    return (
                      <tr key={event.id}>
                        <td>
                          <StatusBadge status={event.status} />
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {endpoint ? endpoint.name : "unknown"}
                        </td>
                        <td>
                          <span style={{ 
                            fontSize: "0.78rem", 
                            background: "var(--bg-tertiary)", 
                            padding: "0.15rem 0.4rem", 
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border-default)"
                          }}>
                            {event.provider}
                          </span>
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                          {formatRelativeTime(event.createdAt)}
                        </td>
                        <td className={styles.actionCell}>
                          <Link href={`/events/${event.id}`} className="btn btn-secondary btn-sm">
                            <span>View</span>
                            <ChevronRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Endpoint Health Column */}
        <div className={`${styles.healthCard} glass-card`}>
          <h2 className={styles.sectionTitle}>
            <Webhook size={18} style={{ color: "var(--accent-primary)" }} />
            <span>Endpoint Health</span>
          </h2>

          {endpoints.length === 0 ? (
            <div className={styles.emptyState} style={{ padding: "2rem 1rem" }}>
              <Webhook size={32} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: "0.9rem" }}>Belum ada endpoint.</p>
              <Link href="/endpoints" className="btn btn-primary btn-sm" style={{ marginTop: "0.5rem" }}>
                Buat Endpoint
              </Link>
            </div>
          ) : (
            <div className={styles.endpointList}>
              {endpoints.map((ep) => (
                <Link key={ep.id} href={`/endpoints/${ep.id}`} style={{ display: "block" }}>
                  <EndpointHealthBar 
                    name={ep.name} 
                    successCount={ep.successCount} 
                    eventsCount={ep.eventsCount} 
                  />
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
