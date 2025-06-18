/**
 * Utility functions for consistent date formatting
 * Ensures day comes before month in all date displays
 */

/**
 * Format date to DD/MM/YYYY format
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date string (DD/MM/YYYY)
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Format date to DD/MM/YY format (short year)
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date string (DD/MM/YY)
 */
export const formatDateShort = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
};

/**
 * Format date and time to DD/MM/YYYY HH:MM format
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  const datePart = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const timePart = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return `${datePart} ${timePart}`;
};

/**
 * Format date and time to DD/MM/YYYY HH:MM AM/PM format
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date and time string with AM/PM
 */
export const formatDateTimeAmPm = (dateString) => {
  const date = new Date(dateString);
  const datePart = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const timePart = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  return `${datePart} ${timePart}`;
};

/**
 * Get current date in YYYY-MM-DD format for input fields
 * @returns {string} Current date in YYYY-MM-DD format
 */
export const getCurrentDateForInput = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get current date and time in YYYY-MM-DDTHH:MM format for datetime-local input
 * @returns {string} Current date and time in YYYY-MM-DDTHH:MM format
 */
export const getCurrentDateTimeForInput = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Convert a date to ISO format without timezone conversion
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Date in YYYY-MM-DDTHH:MM format
 */
export const toLocalISOString = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Parse DD/MM/YYYY HH:MM format and convert to ISO format
 * @param {string} dateString - Date string in DD/MM/YYYY HH:MM format
 * @returns {string} Date in YYYY-MM-DDTHH:MM format
 */
export const parseDDMMYYYYToISO = (dateString) => {
  try {
    // Handle DD/MM/YYYY HH:MM format
    const parts = dateString.split(' ');
    if (parts.length === 2) {
      const datePart = parts[0]; // DD/MM/YYYY
      const timePart = parts[1]; // HH:MM
      
      const dateParts = datePart.split('/');
      const timeParts = timePart.split(':');
      
      if (dateParts.length === 3 && timeParts.length === 2) {
        const [day, month, year] = dateParts;
        const [hours, minutes] = timeParts;
        
        // Validate the values
        if (day && month && year && hours && minutes) {
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        }
      }
    }
    
    // If parsing fails, try standard date parsing
    return toLocalISOString(dateString);
  } catch (error) {
    console.error('Error parsing date:', error);
    // Return current date as fallback
    return getCurrentDateTimeForInput();
  }
}; 