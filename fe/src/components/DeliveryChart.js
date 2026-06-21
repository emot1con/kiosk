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

export default function DeliveryChart({ events = [] }) {
  const chartData = useMemo(() => {
    const now = new Date();
    const buckets = [];

    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now);
      hourStart.setHours(now.getHours() - i, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hourStart.getHours() + 1);

      const hourLabel = hourStart.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      const hourEvents = events.filter((e) => {
        const created = new Date(e.createdAt);
        return created >= hourStart && created < hourEnd;
      });

      buckets.push({
        hour: hourLabel,
        delivered: hourEvents.filter((e) => e.status === "delivered").length,
        failed: hourEvents.filter(
          (e) => e.status === "dead" || e.status === "retrying"
        ).length,
      });
    }

    return buckets;
  }, [events]);

  return (
    <div className={`${styles.chartContainer} glass-card`}>
      <div className={styles.chartHeader}>
        <h2 className={styles.chartTitle}>
          <TrendingUp size={15} style={{ color: "var(--accent-primary)" }} />
          <span>Delivery Trend (24h)</span>
        </h2>
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