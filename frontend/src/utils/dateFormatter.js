/**
 * Date formatting utility
 * Formats dates according to the application's date format setting
 * Always uses full month names in English
 */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

/**
 * Available date format options
 */
export const DATE_FORMAT_OPTIONS = [
  { value: 'DD MMMM, YYYY', label: 'DD MMMM, YYYY', example: '23 January, 2026' },
  { value: 'MMMM DD, YYYY', label: 'MMMM DD, YYYY', example: 'January 23, 2026' },
  { value: 'DD MMMM YYYY', label: 'DD MMMM YYYY', example: '23 January 2026' },
];

/**
 * Format a date according to the specified format
 * @param {Date|string|number} date - The date to format
 * @param {string} format - The format string (e.g., 'DD MMMM, YYYY')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'DD MMMM, YYYY') => {
  if (!date) return '';
  
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    console.warn('Invalid date provided to formatDate:', date);
    return '';
  }
  
  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  const dayName = DAY_NAMES[d.getDay()];
  
  // Pad day with leading zero if needed
  const dayPadded = day.toString().padStart(2, '0');
  
  // Replace format tokens
  let formatted = format
    .replace('DDDD', dayName)
    .replace('DD', dayPadded)
    .replace('D', day)
    .replace('MMMM', month)
    .replace('YYYY', year);
  
  return formatted;
};

/**
 * Format a date with time
 * @param {Date|string|number} date - The date to format
 * @param {string} format - The format string
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date string with optional time
 */
export const formatDateTime = (date, format = 'DD MMMM, YYYY', includeTime = true) => {
  const formattedDate = formatDate(date, format);
  
  if (!includeTime || !formattedDate) return formattedDate;
  
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return `${formattedDate} at ${hours}:${minutes}`;
};

/**
 * Get relative time (e.g., "2 hours ago")
 * @param {Date|string|number} date - The date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  
  // For older dates, return formatted date
  return formatDate(date);
};

/**
 * Format a date range
 * @param {Date|string|number} startDate - Start date
 * @param {Date|string|number} endDate - End date
 * @param {string} format - The format string
 * @returns {string} Formatted date range
 */
export const formatDateRange = (startDate, endDate, format = 'DD MMMM, YYYY') => {
  const start = formatDate(startDate, format);
  const end = formatDate(endDate, format);
  
  if (!start || !end) return start || end || '';
  
  return `${start} - ${end}`;
};

/**
 * Get month name
 * @param {number} monthIndex - Month index (0-11)
 * @returns {string} Month name
 */
export const getMonthName = (monthIndex) => {
  return MONTH_NAMES[monthIndex] || '';
};

/**
 * Get day name
 * @param {number} dayIndex - Day index (0-6)
 * @returns {string} Day name
 */
export const getDayName = (dayIndex) => {
  return DAY_NAMES[dayIndex] || '';
};

export default formatDate;
