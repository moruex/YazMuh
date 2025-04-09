// src/utils/helpers.js

/**
 * Formats a date string or Date object into an ISO string.
 * Returns null if the input is invalid.
 * @param {string | Date} dateInput - The date string or object to format.
 * @returns {string | null} ISO formatted date string or null.
 */
const formatDateISO = (dateInput) => {
  if (!dateInput) return null;
  try {
    const date = new Date(dateInput);
    // Check if the date is valid after parsing
    if (isNaN(date.getTime())) {
        return null;
    }
    return date.toISOString();
  } catch (error) {
      console.error("Error formatting date:", error);
      return null;
  }
};

/**
 * Example helper: Slugify a string (e.g., for URLs)
 * @param {string} text - The text to slugify.
 * @returns {string} The slugified string.
 */
const slugify = (text) => {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')      // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars except -
        .replace(/\-\-+/g, '-')    // Replace multiple - with single -
        .replace(/^-+/, '')        // Trim - from start of text
        .replace(/-+$/, '');       // Trim - from end of text
}


module.exports = {
    formatDateISO,
    slugify,
    // Add other general helper functions here
};