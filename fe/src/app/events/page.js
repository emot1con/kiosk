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
import { apiClient } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import StatusBadge from "@/components/StatusBadge";
import Pagination from "@/components/Pagination";
import EmptyState from "@/components/EmptyState";
import { formatDateTime } from "@/lib/utils";
import styles from "./events.module.css";

export default function EventsPage() {
  const { endpoints, analyticsMetrics, bulkRetryDeadEvents, isDataLoading } = useData();
  const { showToast } = useToast();

  // Filter states
  const [selectedEndpoint, setSelectedEndpoint] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Local state for paginated backend events
  const [localEvents, setLocalEvents] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isEventsLoading, setIsEventsLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      };
      if (selectedEndpoint !== "all") params.endpointId = selectedEndpoint;
      if (selectedStatus !== "all") params.status = selectedStatus;
      if (searchQuery) params.search = searchQuery;

      const response = await apiClient.get("/events", { params });
      const responseData = response.data;
      if (responseData && responseData.data) {
        setLocalEvents(responseData.data);
        setTotalItems(responseData.meta.total);
        setTotalPages(responseData.meta.totalPages);
      } else {
        setLocalEvents(responseData);
        setTotalItems(responseData.length);
        setTotalPages(Math.ceil(responseData.length / ITEMS_PER_PAGE));
      }
    } catch (err) {
      console.error("Failed to fetch events", err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const load = async () => {
      await fetchEvents();
      if (isMounted) {
        setIsEventsLoading(false);
      }
    };

    load();

    const interval = setInterval(fetchEvents, 3000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentPage, selectedEndpoint, selectedStatus, searchQuery]);

  const deadEventsCount = analyticsMetrics?.deadEvents || 0;

  const handleBulkRetry = async () => {
    if (confirm(`Apakah Anda yakin ingin mencoba mengirim ulang ${deadEventsCount} event yang gagal permanen (dead)?`)) {
      await bulkRetryDeadEvents();
      showToast(`${deadEventsCount} event sedang diproses ulang.`, "success");
    }
  };

  const handleExportJSON = async () => {
    try {
      const params = {
        limit: 100000,
      };
      if (selectedEndpoint !== "all") params.endpointId = selectedEndpoint;
      if (selectedStatus !== "all") params.status = selectedStatus;
      if (searchQuery) params.search = searchQuery;

      const response = await apiClient.get("/events", { params });
      const data = response.data.data ? response.data.data : response.data;

      if (data.length === 0) {
        showToast("Tidak ada logs untuk diexport.", "warning");
        return;
      }
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `kiosk_webhook_logs_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Logs berhasil diexport ke JSON!", "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal melakukan export JSON.", "error");
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = {
        limit: 100000,
      };
      if (selectedEndpoint !== "all") params.endpointId = selectedEndpoint;
      if (selectedStatus !== "all") params.status = selectedStatus;
      if (searchQuery) params.search = searchQuery;

      const response = await apiClient.get("/events", { params });
      const data = response.data.data ? response.data.data : response.data;

      if (data.length === 0) {
        showToast("Tidak ada logs untuk diexport.", "warning");
        return;
      }
      const headers = ["ID", "Endpoint ID", "Provider", "Status", "Retry Count", "Max Retries", "Created At"];
      const rows = data.map(e => [
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
    } catch (err) {
      console.error(err);
      showToast("Gagal melakukan export CSV.", "error");
    }
  };

  // Helper change handlers that reset pagination page
  const handleEndpointChange = (e) => {
    setSelectedEndpoint(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  if (isDataLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading events...</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.headerRow}>
        <div className={styles.titleSection}>
          <h1 className={styles.pageTitle}>Event Logs</h1>
          <p className={styles.pageSubtitle}>Pantau semua riwayat pengiriman payload webhook secara real-time</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {deadEventsCount > 0 && (
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
              <span>Retry All Dead ({deadEventsCount})</span>
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
                onChange={handleSearchChange}
              />
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Filter Endpoint</label>
            <select 
              className="form-input"
              value={selectedEndpoint}
              onChange={handleEndpointChange}
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
              onChange={handleStatusChange}
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
        {isEventsLoading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "3rem" }}>
            <p style={{ color: "var(--text-secondary)" }}>Loading events...</p>
          </div>
        ) : totalItems === 0 ? (
          <EmptyState 
            icon={Filter}
            title="Tidak ada event log ditemukan"
            description="Tidak ada webhook event yang cocok dengan kriteria filter pencarian Anda. Silakan bersihkan kata kunci atau reset filter."
            actionText="Reset Filters"
            onAction={() => {
              setSelectedEndpoint("all");
              setSelectedStatus("all");
              setSearchQuery("");
              setCurrentPage(1);
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
                {localEvents.map((event) => {
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
