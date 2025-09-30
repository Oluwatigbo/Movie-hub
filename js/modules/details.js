// details.js - Handles content details modal: Fetches and renders details + trailer.
// Integrates YouTube embed; dynamic content generation.

import { fetchDetails, fetchTrailer } from './api.js';
import { createCard, announceLive } from './ui.js';
import { formatDate, getGenresFromIds } from './utils.js';

/**
 * Initializes the details modal.
 * @param {Object} elements - Cached DOM elements.
 * @param {Object} appState - Global app state.
 * @param {string} baseUrl - TMDb API base URL.
 * @param {string} tmdbApiKey - TMDb API key.
 * @param {string} youtubeApiKey - YouTube API key.
 * @param {string} imageBase - Image URL base.
 * @param {Function} fetchDetailsFn - fetchDetails function.
 * @param {Function} fetchTrailerFn - fetchTrailer function.
 * @param {Function} createCardFn - createCard function.
 * @param {Function} announceLiveFn - announceLive function.
 */
export function initDetailsModal(elements, appState, baseUrl, tmdbApiKey, youtubeApiKey, imageBase, fetchDetailsFn, fetchTrailerFn, createCardFn, announceLiveFn) {
  // Event delegation for details buttons across the app
  elements.mainContent.addEventListener('click', async (e) => {
      if (e.target.matches('.view-details') || e.target.closest('.view-details')) {
          e.preventDefault();
          const btn = e.target.closest('.view-details');
          const id = parseInt(btn.dataset.id);
          const mediaType = btn.dataset.type || 'movie';
          await showDetails(id, mediaType, elements, appState, baseUrl, tmdbApiKey, youtubeApiKey, imageBase, fetchDetailsFn, fetchTrailerFn, createCardFn, announceLiveFn);
      } else if (e.target.matches('.add-to-watchlist')) {
          const btn = e.target;
          const id = parseInt(btn.dataset.id);
          const mediaType = btn.dataset.type;
          const item = { id, media_type: mediaType };
          }
      });
    }