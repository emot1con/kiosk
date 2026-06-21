import styles from "./EndpointHealthBar.module.css";

export default function EndpointHealthBar({ name, successCount, eventsCount }) {
  const percentage = eventsCount > 0 
    ? Math.round((successCount / eventsCount) * 100) 
    : 100;

  // Determine color theme based on health percentage
  let healthTheme = styles.healthy;
  if (eventsCount === 0) healthTheme = styles.muted;
  else if (percentage < 50) healthTheme = styles.danger;
  else if (percentage < 85) healthTheme = styles.warning;

  return (
    <div className={styles.container}>
      <div className={styles.labelRow}>
        <span className={styles.name}>{name}</span>
        <span className={styles.percentage}>
          {eventsCount === 0 ? "No events" : `${percentage}% healthy`}
        </span>
      </div>
      <div className={styles.barBg}>
        <div 
          className={`${styles.barFill} ${healthTheme}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
