"use client";

import styles from "./EmptyState.module.css";

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionText, 
  onAction 
}) {
  return (
    <div className={styles.container}>
      {Icon && (
        <div className={styles.illustration}>
          <Icon size={36} />
        </div>
      )}
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {actionText && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}
