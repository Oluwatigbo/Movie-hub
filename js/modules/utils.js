// utils.js - Utility functions for the Movie Hub app.
// Includes debouncing, title updates, date formatting, and genre mapping.
// Pure functions; no side effects or DOM dependencies.

export function debounce(func, wait) {
  /**
   * Debounces a function to limit execution frequency.
   * Useful for search input to avoid excessive API calls.
   * @param {Function} func - The function to debounce.
   * @param {number} wait - Wait time in milliseconds before executing.
   * @returns {Function} A debounced version of the function.
   */
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function updateTitle(title) {
  /**
   * Updates the document title dynamically.
   * @param {string} title - The new title string.
   */
  document.title = title;
}

export function formatDate(date) {
  /**
   * Formats a date string or Date object to a readable format.
   * Handles invalid dates gracefully.
   * @param {string|Date} date - The date to format (ISO string or Date object).
   * @returns {string} Formatted date (e.g., "Jan 1, 2023") or "Unknown" if invalid.
   */
  if (!date) return 'Unknown';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Unknown';
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Invalid date format:', date);
    return 'Unknown';
  }
}

export function getGenresFromIds(genreIds, genres) {
  /**
   * Maps an array of genre IDs to their corresponding names.
   * @param {Array<number>} genreIds - Array of genre IDs from API.
   * @param {Array<Object>} genres - Full genres array from API (e.g., [{id: 28, name: 'Action'}]).
   * @returns {Array<string>} Array of genre names, or 'Unknown' for unmatched IDs.
   */
  if (!Array.isArray(genreIds) || !genres) return [];
  return genreIds
    .filter(id => typeof id === 'number') // Ensure valid IDs
    .map(id => {
      const genre = genres.find(g => g.id === id);
      return genre ? genre.name : 'Unknown';
    })
    .filter(name => name !== 'Unknown'); // Remove unknowns if desired; adjust as needed
}
