export const formatTimeOnly = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Manila'
  });
};

export const formatDateTimeWithPHT = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  
  // Detect if it's a date-only string (e.g., "2023-10-27")
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
  if (isDateOnly) {
    return new Date(dateString.replace(/-/g, '/')).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Manila'
  });
};

export const formatActivityDateTime = (displayDate, actualTimestamp) => {
  if (!displayDate) return formatDateTimeWithPHT(actualTimestamp);
  const datePart = formatShortDate(displayDate);
  const timePart = formatTimeOnly(actualTimestamp);
  return `${datePart} • ${timePart}`;
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
