export function formatRelativeTime(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  
  // If the time is in the future (e.g. next retry)
  if (diffMs < 0) {
    const absDiffMs = Math.abs(diffMs);
    const mins = Math.round(absDiffMs / (1000 * 60));
    if (mins < 60) {
      return `in ${mins}m`;
    }
    const hrs = Math.round(mins / 60);
    return `in ${hrs}h`;
  }

  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHrs = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHrs / 24);

  if (diffSecs < 15) {
    return "just now";
  } else if (diffSecs < 60) {
    return `${diffSecs}s ago`;
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHrs < 24) {
    return `${diffHrs}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}

export function formatDateTime(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "medium"
  }).format(date);
}
