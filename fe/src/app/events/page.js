"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Activity, 
  Search, 
  ChevronRight,
  Filter,
  RotateCw,
  Download
} from "lucide-react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import StatusBadge from "@/components/StatusBadge";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import { formatDateTime } from "@/lib/utils";
import styles from "./events.module.css";

export default function EventsPage() {
  const { endpoints, events, bulkRetryDeadEvents, isDataLoading } = useData();
  const { showToast } = useToast();

  // Filter states
  const [selectedEndpoint, setSelectedEndpoint] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEndpoint, selectedStatus, searchQuery]);

  const deadEvents = events.filter(e => e.status === "dead");

  const handleBulkRetry = () => {
    if (confirm(`Apakah Anda yakin ingin mencoba mengirim ulang ${deadEvents.length} event yang gagal permanen (dead)?`)) {
      bulkRetryDeadEvents();
      showToast(`${deadEvents.length} event sedang diproses ulang.`, "success");
    }
  };

  const handleExportJSON = () => {
    if (filteredEvents.length === 0) {
      showToast("Tidak ada logs untuk diexport.", "warning");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredEvents, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `kiosk_webhook_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Logs berhasil diexport ke JSON!", "success");
  };

  const handleExportCSV = () => {
    if (filteredEvents.length === 0) {
      showToast("Tidak ada logs untuk diexport.", "warning");
      return;
    }
    const headers = ["ID", "Endpoint ID", "Provider", "Status", "Retry Count", "Max Retries", "Created At"];
    const rows = filteredEvents.map(e => [
      e.id,
      e.endpointId,
      e.provider,
      e.status,
      e.retryCount,
      e.maxRetries,
      e.createdAt
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.map(val => `"${val}"`).join(","))].join("\n");
      
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", `kiosk_webhook_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Logs berhasil diexport ke CSV!", "success");
  };

  if (isDataLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading events...</p>
      </div>
    );
  }

  // Filter events based on selections
  const filteredEvents = events.filter((event) => {
    // Filter by Endpoint
    if (selectedEndpoint !== "all" && event.endpointId !== selectedEndpoint) {
      return false;
    }
    // Filter by Status
    if (selectedStatus !== "all" && event.status !== selectedStatus) {
      return false;
    }
    // Filter by Search Query (ID)
    if (searchQuery && !event.id.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalItems = filteredEvents.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div>
      <div className={styles.headerRow}>
        <div className={styles.titleSection}>
          <h1 className={styles.pageTitle}>Event Logs</h1>
          <p className={styles.pageSubtitle}>Pantau semua riwayat pengiriman payload webhook secara real-time</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {deadEvents.length > 0 && (
            <button 
              className="btn btn-secondary" 
              style={{ 
                background: "var(--status-dead-bg)", 
                borderColor: "rgba(239, 68, 68, 0.25)",
                color: "#f87171"
              }}
              onClick={handleBulkRetry}
            >
              <RotateCw size={14} />
              <span>Retry All Dead ({deadEvents.length})</span>
            </button>
          )}

          <button 
            className="btn btn-secondary" 
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
            onClick={handleExportCSV}
            title="Download CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button 
            className="btn btn-secondary" 
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
            onClick={handleExportJSON}
            title="Download JSON"
          >
            <Download size={14} />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div className={styles.filterBar}>
          
          <div className={`${styles.filterGroup} ${styles.searchGroup}`}>
            <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Search Event ID</label>
            <div style={{ position: "relative" }}>
              <Search 
                size={16} 
                style={{ 
                  position: "absolute", 
                  left: "12px", 
                  top: "50%", 
                  transform: "translateY(-50%)", 
                  color: "var(--text-muted)" 
                }} 
              />
              <input 
                className="form-input" 
                style={{ paddingLeft: "2.25rem" }} 
                type="text" 
                placeholder="Cari Event ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Filter Endpoint</label>
            <select 
              className="form-input"
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
            >
              <option value="all">All Endpoints</option>
              {endpoints.map(ep => (
                <option key={ep.id} value={ep.id}>{ep.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Filter Status</label>
            <select 
              className="form-input"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="delivered">Delivered</option>
              <option value="retrying">Retrying</option>
              <option value="dead">Dead Letter</option>
              <option value="pending">Pending</option>
            </select>
          </div>

        </div>
      </div>

      {/* Events Table Listing */}
      <div className={`${styles.card} glass-card`}>
        {filteredEvents.length === 0 ? (
          <EmptyState 
            icon={Filter}
            title="Tidak ada event log ditemukan"
            description="Tidak ada webhook event yang cocok dengan kriteria filter pencarian Anda. Silakan bersihkan kata kunci atau reset filter."
            actionText="Reset Filters"
            onAction={() => {
              setSelectedEndpoint("all");
              setSelectedStatus("all");
              setSearchQuery("");
            }}
          />
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Event ID</th>
                  <th>Endpoint</th>
                  <th>Provider</th>
                  <th>Retries</th>
                  <th>Received At</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginatedEvents.map((event) => {
                  const endpoint = endpoints.find(ep => ep.id === event.endpointId);
                  return (
                    <tr key={event.id}>
                      <td>
                        <StatusBadge status={event.status} />
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 600 }}>
                        {event.id}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {endpoint ? (
                          <Link href={`/endpoints/${endpoint.id}`} style={{ color: "var(--text-primary)" }}>
                            {endpoint.name}
                          </Link>
                        ) : (
                          "unknown"
                        )}
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
                  );
                })}
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
