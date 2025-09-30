// watchlist.js - WatchlistManager: Handles CRUD for user watchlist.
// Persists to localStorage; emits change events for reactivity.

const WATCHLIST_KEY = 'moviehub_watchlist';

/**
 * WatchlistManager class: Manages adding, removing, rating watchlist items.
 * Items: { id, title, media_type, genre_ids, user_rating (1-5), poster_path }
 */
export class WatchlistManager {
  constructor() {
    this.watchlist = [];
    this.listeners = []; // For change events
  }

  /**
   * Loads watchlist from localStorage.
   */
  load() {
    const stored = localStorage.getItem(WATCHLIST_KEY);
    if (stored) {
      this.watchlist = JSON.parse(stored);
    }
  }

  /**
   * Saves watchlist to localStorage and notifies listeners.
   */
  save() {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(this.watchlist));
    this.notifyChange();
  }

  /**
   * Adds an item to watchlist (if not already present).
   * @param {Object} item - Item to add (from API or search).
   * @param {string} mediaType - 'movie' or 'tv'.
   */
  add(item, mediaType) {
    if (!this.isInWatchlist(item.id)) {
      const watchItem = {
        id: item.id,
        title: item.title || item.name,
        media_type: mediaType,
        genre_ids: item.genre_ids || [],
        poster_path: item.poster_path,
        user_rating: null // Default; user sets later
      };
      this.watchlist.push(watchItem);
      this.save();
      return true;
    }
    return false; // Already exists
  }

  /**
   * Removes an item from watchlist.
   * @param {number} id - Item ID.
   */
  remove(id) {
    const index = this.watchlist.findIndex(item => item.id === id);
    if (index !== -1) {
      this.watchlist.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Sets user rating for an item (1-5 stars).
   * @param {number} id - Item ID.
   * @param {number} rating - Rating (1-5).
   */
  setRating(id, rating) {
    const item = this.watchlist.find(item => item.id === id);
    if (item) {
      item.user_rating = Math.max(1, Math.min(5, rating)); // Clamp 1-5
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Checks if item is in watchlist.
   * @param {number} id - Item ID.
   * @returns {boolean}
   */
  isInWatchlist(id) {
    return this.watchlist.some(item => item.id === id);
  }

  /**
   * Gets all watchlist items.
   * @returns {Array}
   */
  getAll() {
    return [...this.watchlist]; // Return copy to prevent mutation
  }

  /**
   * Exports watchlist as JSON file.
   */
  export() {
    const dataStr = JSON.stringify(this.getAll(), null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'movie-hub-watchlist.json';
    a.click();
    URL.revokeObjectURL(url);
    // Announce for accessibility (use announceLive from ui.js in caller)
  }

  /**
   * Adds a change listener (callback).
   * @param {Function} callback - Function to call on changes.
   */
  onChange(callback) {
    this.listeners.push(callback);
  }

  /**
   * Notifies listeners of changes.
   */
  notifyChange() {
    this.listeners.forEach(callback => callback());
  }
}