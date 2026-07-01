"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import styles from "./DeliveryChart.module.css";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-md)",
        padding: "0.5rem 0.75rem",
        fontSize: "0.75rem",
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
      }}
    >
      <p style={{ color: "var(--text-muted)", marginBottom: "0.2rem", fontWeight: 600 }}>
        {label}
      </p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, margin: "0.1rem 0" }}>
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
}

export default function DeliveryChart({ timeseries = [], timeseriesHours = 24, setTimeseriesHours }) {
  const chartData = useMemo(() => {
    // We already have pre-aggregated bucket data from the backend,
    // but the backend might omit empty hours.
    // Let's create an array of `timeseriesHours` hours up to now and fill in the data.
    const now = new Date();
    const buckets = [];

    // Backend provides { timestamp: string, delivered: number, failed: number }
    for (let i = timeseriesHours - 1; i >= 0; i--) {
      const hourStart = new Date(now);
      hourStart.setHours(now.getHours() - i, 0, 0, 0);
      
      let hourLabel = hourStart.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      // If it's more than 24 hours, add date to label for tooltip clarity
      if (timeseriesHours > 24) {
        const dateStr = hourStart.toLocaleDateString("id-ID", { day: 'numeric', month: 'short' });
        hourLabel = `${dateStr} ${hourLabel}`;
      }

      // Find if we have backend data for this hour bucket
      const bucketData = timeseries.find(t => {
        const tDate = new Date(t.timestamp);
        return tDate.getHours() === hourStart.getHours() && 
               tDate.getDate() === hourStart.getDate() &&
               tDate.getMonth() === hourStart.getMonth() &&
               tDate.getFullYear() === hourStart.getFullYear();
      });

      buckets.push({
        hour: hourLabel,
        delivered: bucketData ? bucketData.delivered : 0,
        failed: bucketData ? bucketData.failed : 0,
      });
    }

    return buckets;
  }, [timeseries, timeseriesHours]);

  return (
    <div className={`${styles.chartContainer} glass-card`}>
      <div className={styles.chartHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <h2 className={styles.chartTitle}>
            <TrendingUp size={15} style={{ color: "var(--accent-primary)" }} />
            <span>Delivery Trend</span>
          </h2>
          {setTimeseriesHours && (
            <div style={{ display: "flex", gap: "0.25rem", background: "var(--bg-tertiary)", padding: "0.2rem", borderRadius: "var(--radius-sm)" }}>
              <button 
                onClick={() => setTimeseriesHours(24)}
                style={{ 
                  background: timeseriesHours === 24 ? "var(--bg-secondary)" : "transparent",
                  color: timeseriesHours === 24 ? "var(--text-primary)" : "var(--text-secondary)",
                  border: "none", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-xs)", fontSize: "0.75rem", cursor: "pointer", fontWeight: timeseriesHours === 24 ? 600 : 400
                }}
              >24h</button>
              <button 
                onClick={() => setTimeseriesHours(168)}
                style={{ 
                  background: timeseriesHours === 168 ? "var(--bg-secondary)" : "transparent",
                  color: timeseriesHours === 168 ? "var(--text-primary)" : "var(--text-secondary)",
                  border: "none", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-xs)", fontSize: "0.75rem", cursor: "pointer", fontWeight: timeseriesHours === 168 ? 600 : 400
                }}
              >7d</button>
              <button 
                onClick={() => setTimeseriesHours(720)}
                style={{ 
                  background: timeseriesHours === 720 ? "var(--bg-secondary)" : "transparent",
                  color: timeseriesHours === 720 ? "var(--text-primary)" : "var(--text-secondary)",
                  border: "none", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-xs)", fontSize: "0.75rem", cursor: "pointer", fontWeight: timeseriesHours === 720 ? 600 : 400
                }}
              >30d</button>
            </div>
          )}
        </div>
        <div className={styles.chartLegend}>
          <span className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ background: "#22c55e" }}
            />
            Delivered
          </span>
          <span className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ background: "#ef4444" }}
            />
            Failed / Retrying
          </span>
        </div>
      </div>

      <div className={styles.chartBody}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradDelivered" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-default)"
              vertical={false}
            />
            <XAxis
              dataKey="hour"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--text-muted)", fontSize: 10 }}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--text-muted)", fontSize: 10 }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="delivered"
              name="Delivered"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#gradDelivered)"
              dot={false}
              activeDot={{ r: 4, stroke: "#22c55e", strokeWidth: 2, fill: "var(--bg-primary)" }}
            />
            <Area
              type="monotone"
              dataKey="failed"
              name="Failed"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#gradFailed)"
              dot={false}
              activeDot={{ r: 4, stroke: "#ef4444", strokeWidth: 2, fill: "var(--bg-primary)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}