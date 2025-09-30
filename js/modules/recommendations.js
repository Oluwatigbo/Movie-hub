// recommendations.js - Recommendation Engine: Generates personalized suggestions.
// Uses simple client-side logic: genre matching + user ratings from watchlist.
// No backend; scales with watchlist size.

import { fetchSearch } from './api.js';

/**
 * RecommendationEngine class: Manages personalized movie/TV suggestions.
 * Analyzes user watchlist for genres/ratings and fetches similar content.
 */
export class RecommendationEngine {
  constructor() {
    this.userPreferences = new Map(); // genreId -> average rating
    this.updatePreferences = this.updatePreferences.bind(this);
  }

  /**
   * Updates preferences based on watchlist ratings.
   * @param {Array} watchlist - Array of watchlist items with genre_ids and user_rating.
   */
  updatePreferences(watchlist) {
    this.userPreferences.clear();
    watchlist.forEach(item => {
      if (item.user_rating && item.genre_ids) {
        item.genre_ids.forEach(genreId => {
          const currentAvg = this.userPreferences.get(genreId) || 0;
          const newAvg = ((currentAvg * (watchlist.filter(i => i.genre_ids?.includes(genreId)).length - 1)) + item.user_rating) / watchlist.filter(i => i.genre_ids?.includes(genreId)).length;
          this.userPreferences.set(genreId, newAvg);
        });
      }
    });
  }

  /**
   * Generates recommendations based on preferences.
   * @param {Object} appState - Global state with genres and watchlist.
   * @param {string} baseUrl - TMDb API base URL.
   * @param {string} apiKey - TMDb API key.
   * @param {number} limit - Number of recommendations (default 5).
   * @returns {Promise<Array>} Array of recommended items.
   */
  async generateRecommendations(appState, baseUrl, apiKey, limit = 5) {
    this.updatePreferences(appState.watchlist.getAll());

    if (this.userPreferences.size === 0) {
      // Fallback: Popular content if no preferences
      return await fetchSearch(baseUrl, apiKey, 'popular');
    }

    // Get top genres by average rating
    const topGenres = Array.from(this.userPreferences.entries())
      .sort((a, b) => b[1] - a[1]) // Descending rating
      .slice(0, 3)
      .map(([genreId]) => genreId);

    // Fetch recommendations for top genres (simple multi-query)
    const recommendations = [];
    for (const genreId of topGenres) {
      try {
        const genreName = appState.genres.find(g => g.id === genreId)?.name || 'action';
        const results = await fetchSearch(baseUrl, apiKey, genreName);
        recommendations.push(...results.slice(0, limit / topGenres.length));
        if (recommendations.length >= limit) break;
      } catch (error) {
        console.error('Error generating recommendations:', error);
      }
    }

    // Filter out watchlist items to avoid duplicates
    const watchlistIds = new Set(appState.watchlist.getAll().map(item => item.id));
    return recommendations.filter(item => !watchlistIds.has(item.id)).slice(0, limit);
  }

  /**
   * Gets a "Why this?" explanation for a recommendation.
   * @param {Object} item - Recommended item.
   * @param {Object} appState - Global state with genres.
   * @returns {string} Explanation text.
   */
  getExplanation(item, appState) {
    const matchingGenres = item.genre_ids?.filter(id => this.userPreferences.has(id)) || [];
    if (matchingGenres.length > 0) {
      const genreNames = matchingGenres.map(id => appState.genres.find(g => g.id === id)?.name).join(', ');
      return `Recommended because you liked similar ${genreNames} content.`;
    }
    return 'Popular pick based on your viewing history.';
  }
}

/**
 * Initializes the recommendations module.
 * @param {Object} elements - Cached DOM elements.
 * @param {Object} appState - Global app state.
 * @param {string} baseUrl - TMDb API base URL.
 * @param {string} apiKey - TMDb API key.
 */
export function initRecommendations(elements, appState, baseUrl, apiKey) {
  // Hook into watchlist changes to update recommendations
  appState.watchlist.onChange(() => {
    // Could trigger re-render of recommendations if on a dedicated section
    console.log('Watchlist changed; recommendations updated.');
  });

  // Example: Render recommendations on home (extend loadHome in main.js if needed)
  // For now, integrate via genre search or watchlist view
}