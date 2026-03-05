export const formatDateTimeWithPHT = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Manila'
  });
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
