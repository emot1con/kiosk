import styles from "./StatusBadge.module.css";

export default function StatusBadge({ status }) {
  const badgeClass = `${styles.badge} ${styles[status] || styles.pending}`;

  return (
    <span className={badgeClass}>
      <span className={`pulse-dot ${status}`} />
      <span>{status}</span>
    </span>
  );
}
