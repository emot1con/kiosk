"use client";

import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import styles from "./Toast.module.css";

const iconMap = {
  success: <CheckCircle size={18} style={{ color: "var(--status-delivered)" }} />,
  error: <XCircle size={18} style={{ color: "var(--status-dead)" }} />,
  warning: <AlertTriangle size={18} style={{ color: "var(--status-retrying)" }} />,
  info: <Info size={18} style={{ color: "var(--accent-primary)" }} />,
};

export default function Toast({ toasts = [], onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.toastContainer}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${styles[toast.type] || styles.info}`}
        >
          <span className={styles.iconWrap}>
            {iconMap[toast.type] || iconMap.info}
          </span>
          <span className={styles.content}>{toast.message}</span>
          <button
            className={styles.closeBtn}
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
          <div className={styles.progressBar} />
        </div>
      ))}
    </div>
  );
}
