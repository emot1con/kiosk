import styles from "./StatCard.module.css";

export default function StatCard({ label, value, icon: Icon, type = "total" }) {
  const cardClass = `${styles.card} glass-card ${styles[type]}`;

  return (
    <div className={cardClass}>
      <div className={styles.cardContent}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}</span>
      </div>
      <div className={styles.iconWrapper}>
        <Icon size={24} />
      </div>
    </div>
  );
}
