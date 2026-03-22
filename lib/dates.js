/**
 * Utility functions for handling dates in Indian Standard Time (IST)
 * IST = UTC + 5:30
 */

// Returns a Date object representing the current time shifted to IST
export const getISTDate = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + istOffset);
};

// Returns YYYY-MM-DD string for the current date in IST
export const getTodayISTStr = () => {
  const ist = getISTDate();
  return ist.toISOString().split('T')[0];
};

// Returns a Date object representing the start of current day in IST (00:00:00 UTC)
export const getTodayISTMidnight = () => {
  const ist = getISTDate();
  ist.setUTCHours(0, 0, 0, 0);
  return ist;
};

// Helper for client components to compare browser-local dates safely
export const isSameDay = (d1, d2) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

// Formats a local Date object to YYYY-MM-DD in local time
export const formatLocalDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
