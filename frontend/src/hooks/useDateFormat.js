import { useSettings } from '../context/SettingsContext';
import { formatDate, formatDateTime, getRelativeTime, formatDateRange } from '../utils/dateFormatter';

/**
 * Custom hook to format dates according to app settings
 * @returns {Object} Date formatting functions
 */
export const useDateFormat = () => {
    const { dateFormat } = useSettings();

    return {
        /**
         * Format a date according to app settings
         * @param {Date|string|number} date - The date to format
         * @returns {string} Formatted date string
         */
        formatDate: (date) => formatDate(date, dateFormat),

        /**
         * Format a date with time
         * @param {Date|string|number} date - The date to format
         * @param {boolean} includeTime - Whether to include time (default: true)
         * @returns {string} Formatted date string with optional time
         */
        formatDateTime: (date, includeTime = true) => formatDateTime(date, dateFormat, includeTime),

        /**
         * Get relative time (e.g., "2 hours ago")
         * @param {Date|string|number} date - The date to compare
         * @returns {string} Relative time string
         */
        getRelativeTime: (date) => getRelativeTime(date),

        /**
         * Format a date range
         * @param {Date|string|number} startDate - Start date
         * @param {Date|string|number} endDate - End date
         * @returns {string} Formatted date range
         */
        formatDateRange: (startDate, endDate) => formatDateRange(startDate, endDate, dateFormat),

        /**
         * Get current date format setting
         * @returns {string} Current date format
         */
        dateFormat,
    };
};

export default useDateFormat;
