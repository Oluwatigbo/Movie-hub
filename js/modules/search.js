// js/modules/search.js - Handles search functionality for movies and TV shows.
// Exports: initSearch (setup), handleSearch (core search logic).

import { fetchSearch } from './api.js'; // API fetch for search results
import { createCard, showSection, showLoading, hideLoading, showError } from './ui.js'; // UI helpers
import { getGenresFromIds } from './utils.js'; // Genre mapping

/**
 * Initializes search module.
 * Sets up any initial state or event bindings (e.g., clear search on focus).
 * @param {Object} elements - Cached DOM elements from main.js.
 * @param {Object} appState - Global app state.
 * @param {Function} handleSearchFn - Reference to handleSearch for internal use.
 * @param {Function} showSectionFn - Reference to showSection for navigation.
 */
export function initSearch(elements, appState, handleSearchFn, showSectionFn) {
  // Clear search input and return to home on focus (optional UX enhancement)
  elements.searchInput.addEventListener('focus', () => {
    if (elements.searchInput.value.trim() === '') {
      showSectionFn('home');
    }
  });

  // Clear results when input is empty (already handled in main.js, but reinforce)
  elements.searchInput.addEventListener('blur', () => {
    if (elements.searchInput.value.trim() === '' && appState.currentView === 'search') {
      showSectionFn('home');
    }
  });

  // Announce search state for accessibility
  elements.searchInput.setAttribute('aria-live', 'polite');
  console.log('Search module initialized.');
}

/**
 * Handles search execution: Fetches and renders results.
 * Supports text queries or genre-based searches.
 * @param {string} query - Search term (e.g., "Batman") or genre name.
 * @param {Object} elements - Cached DOM elements.
 * @param {Object} appState - Global state (genres, watchlist, etc.).
 * @param {string} API_BASE - TMDb API base URL.
 * @param {string} TMDB_API_KEY - TMDb API key.
 * @param {Function} fetchSearchFn - fetchSearch from api.js.
 * @param {Function} createCardFn - createCard from ui.js.
 * @param {Function} showSectionFn - showSection from ui.js.
 * @param {Function} showLoadingFn - showLoading from ui.js.
 * @param {Function} hideLoadingFn - hideLoading from ui.js.
 * @param {Function} showErrorFn - showError from ui.js.
 */
export async function handleSearch(query, elements, appState, API_BASE, TMDB_API_KEY, fetchSearchFn, createCardFn, showSectionFn, showLoadingFn, hideLoadingFn, showErrorFn) {
  if (!query || query.trim() === '') {
    showSectionFn('home');
    return;
  }

  showLoadingFn();
  appState.currentView = 'search';
  appState.searchQuery = query;
  elements.searchInput.value = query; // Update input for UX
  const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'; // Hardcoded for search (or pass as param)

  try {
    // Determine if this is a genre search (e.g., query like "Action" with genre ID in state)
    let searchResults;
    if (query.includes('genre:')) {
      // Genre search: Use discover endpoint (assumes fetchSearch supports it; adjust api.js if needed)
      const genreId = query.split(':')[1];
      searchResults = await fetchSearchFn(API_BASE, TMDB_API_KEY, '', { with_genres: genreId }); // Empty query for discover
    } else {
      // Text search
      searchResults = await fetchSearchFn(API_BASE, TMDB_API_KEY, query);
    }

    // Render results
    elements.resultsGrid.innerHTML = '';
    if (searchResults && searchResults.length > 0) {
      elements.resultsTitle.textContent = `Search Results for "${query}" (${searchResults.length} found)`;
      searchResults.forEach(item => {
        const genres = getGenresFromIds(item.genre_ids || [], appState.genres);
        const card = createCardFn(item, 'movie', appState.watchlist.isInWatchlist(item.id), IMAGE_BASE, genres);
        elements.resultsGrid.appendChild(card);
      });
      // Accessibility announcement
      const liveRegion = document.querySelector('[aria-live="polite"]') || elements.searchInput;
      liveRegion.textContent = `${searchResults.length} results for "${query}".`;
    } else {
      elements.resultsTitle.textContent = `No results found for "${query}". Try another search.`;
      elements.resultsGrid.innerHTML = '<div class="col-12"><p class="text-muted">No movies or TV shows match your search.</p></div>';
    }

    hideLoadingFn();
    showSectionFn('search');
  } catch (error) {
    console.error('Search error:', error);
    hideLoadingFn();
    showErrorFn(`Search failed for "${query}". Please check your connection or try again.`);
  }
}