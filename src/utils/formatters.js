export const formatDateTimeWithPHT = (dateString) => {
  if (!dateString) return 'N/A';
  
  // Detect if it's a date-only string (e.g., "2023-10-27")
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  
  if (isDateOnly) {
    // Treat as local date to avoid UTC shift
    return new Date(dateString.replace(/-/g, '/')).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  }

  const date = new Date(dateString);
  
  // If time is exactly midnight UTC, it often represents a date-only field from DB
  // In PHT this shows as 8:00 AM. We check if minutes and seconds are zero.
  const isMidnight = date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0;
  
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: isMidnight ? 'numeric' : undefined, // Show year for date-only
    hour: isMidnight ? undefined : 'numeric',
    minute: isMidnight ? undefined : '2-digit',
    hour12: true,
    timeZone: 'Asia/Manila'
  }).replace(', 12:00 AM', ''); // Final fallback safety
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(Math.abs(amount || 0));
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatShortDate = (dateString) => {
  if (!dateString) return '--';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
};

export const getDayNumber = (dateString) => {
  if (!dateString) return '--';
  return new Date(dateString).getDate();
};

export const getShortMonth = (dateString) => {
  if (!dateString) return '---';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
};

export const getMonthName = (dateString) => {
  if (!dateString) return 'Other';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'long' });
};
