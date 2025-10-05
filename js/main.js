// main.js - App Entry Point
// Initializes the app, sets up routing, theme, and event listeners.
// Uses ES Modules for organization. No external JS libraries.

import { TMDB_API_KEY, YOUTUBE_API_KEY } from './config.js';
import { fetchGenres, fetchTrending, fetchSearch, fetchDetails, fetchTrailer } from './modules/api.js';
import { initSearch, handleSearch } from './modules/search.js';
import { RecommendationEngine } from './modules/recommendations.js';
import { WatchlistManager } from './modules/watchlist.js';
import { showSection, showLoading, hideLoading, showError, hideError, createCard, announceLive } from './modules/ui.js';
import { initDetailsModal } from './modules/details.js';
import { debounce, updateTitle, formatDate, getGenresFromIds } from './modules/utils.js';

// Constants
const API_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Global State
const appState = {
  currentView: 'home',
  searchQuery: '',
  watchlist: new WatchlistManager(),
  recommendations: new RecommendationEngine(),
  genres: [] // Loaded from API
};

// DOM Elements (cached for performance)
const elements = {
  mainContent: document.getElementById('mainContent'),
  searchInput: document.getElementById('searchInput'),
  darkModeToggle: document.getElementById('darkModeToggle'),
  homeSection: document.getElementById('home'),
  searchResults: document.getElementById('searchResults'),
  watchlistSection: document.getElementById('watchlist'),
  loadingSpinner: document.getElementById('loadingSpinner'),
  errorSection: document.getElementById('errorSection'),
  errorMessage: document.getElementById('errorMessage'),
  retryButton: document.getElementById('retryButton'),
  exportWatchlist: document.getElementById('exportWatchlist'),
  genreButtons: document.getElementById('genreButtons'),
  trendingGrid: document.getElementById('trendingGrid'),
  resultsGrid: document.getElementById('resultsGrid'),
  watchlistGrid: document.getElementById('watchlistGrid'),
  detailsModal: new bootstrap.Modal(document.getElementById('detailsModal'), { keyboard: true })
};

// Initialize App on DOM Load
document.addEventListener('DOMContentLoaded', async () => {
  // Set up theme
  initTheme();

  // Load watchlist
  appState.watchlist.load();

  // Event Listeners
  setupEventListeners();

  // Initialize modules (pass necessary deps)
  initSearch(elements, appState, handleSearch, showSection);
  initDetailsModal(elements, appState, API_BASE, TMDB_API_KEY, YOUTUBE_API_KEY, IMAGE_BASE, fetchDetails, fetchTrailer, createCard, announceLive);

  // Load genres and initial home view
  try {
    appState.genres = await fetchGenres(API_BASE, TMDB_API_KEY);
    await loadHome();
  } catch (error) {
    showError('Failed to load genres and trending content. Please check your API key.');
  }

  // Setup routing
  setupRouting();
});

/**
 * Initializes the theme based on localStorage.
 */
function initTheme() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  document.body.classList.toggle('dark-mode', isDark);
  elements.darkModeToggle.textContent = isDark ? '☀️' : '🌙';
  elements.darkModeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}

/**
 * Sets up all global event listeners.
 */
function setupEventListeners() {
  // Dark Mode Toggle
  elements.darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    elements.darkModeToggle.textContent = isDark ? '☀️' : '🌙';
    elements.darkModeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    announceLive(isDark ? 'Dark mode enabled' : 'Light mode enabled');
  });

  // Search on Enter
  elements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = elements.searchInput.value.trim();
      if (query) {
        appState.searchQuery = query;
        handleSearch(query, elements, appState, API_BASE, TMDB_API_KEY, fetchSearch, createCard, showSection, showLoading, hideLoading, showError);
      }
    }
  });

  // Debounced live search on input
  const debouncedSearch = debounce((e) => {
    const query = e.target.value.trim();
    if (query.length >= 3) {
      appState.searchQuery = query;
      handleSearch(query, elements, appState, API_BASE, TMDB_API_KEY, fetchSearch, createCard, showSection, showLoading, hideLoading, showError);
    } else if (query.length === 0) {
      showSection('home');
    }
  }, 300);
  elements.searchInput.addEventListener('input', debouncedSearch);

  // Retry Button
  elements.retryButton.addEventListener('click', () => {
    hideError();
    if (appState.currentView === 'home') {
      loadHome();
    } else if (appState.currentView === 'search') {
      handleSearch(appState.searchQuery, elements, appState, API_BASE, TMDB_API_KEY, fetchSearch, createCard, showSection, showLoading, hideLoading, showError);
    }
  });

  // Export Watchlist
  elements.exportWatchlist.addEventListener('click', () => {
    appState.watchlist.export();
  });

  // Watchlist Navigation (from header link)
  document.querySelector('a[href="#watchlist"]').addEventListener('click', (e) => {
    e.preventDefault();
    showWatchlist();
  });
}

/**
 * Loads the home section: Genres and trending content.
 */
async function loadHome() {
  showLoading();
  appState.currentView = 'home';
  updateTitle('Movie Hub - Home');

  try {
    // Render genre buttons
    renderGenreButtons();

    // Fetch and render trending
    const trending = await fetchTrending(API_BASE, TMDB_API_KEY);
    renderContentGrid(trending, elements.trendingGrid, 'movie', true); // true = trending

    hideLoading();
    showSection('home');
  } catch (error) {
    hideLoading();
    showError('Failed to load home content. Please try again.');
  }
}

/**
 * Renders genre buttons dynamically.
 */
function renderGenreButtons() {
  elements.genreButtons.innerHTML = '';
  appState.genres.forEach(genre => {
    const button = document.createElement('button');
    button.className = 'btn btn-genre';
    button.textContent = genre.name;
    button.setAttribute('data-genre-id', genre.id);
    button.setAttribute('aria-label', `Browse ${genre.name} movies`);
    button.addEventListener('click', () => {
      appState.searchQuery = `genre:${genre.id}`;
      handleSearch(genre.name, elements, appState, API_BASE, TMDB_API_KEY, fetchSearch, createCard, showSection, showLoading, hideLoading, showError);
    });
    elements.genreButtons.appendChild(button);
  });
}

/**
 * Renders a grid of content cards.
 * @param {Array} items - Array of movie/TV objects from API.
 * @param {HTMLElement} grid - The grid container.
 * @param {string} mediaType - 'movie' or 'tv'.
 * @param {boolean} isTrending - If true, add trending badge.
 */
function renderContentGrid(items, grid, mediaType, isTrending = false) {
  grid.innerHTML = '';
  items.forEach(item => {
    const card = createCard(item, mediaType, appState.watchlist.isInWatchlist(item.id), IMAGE_BASE, getGenresFromIds(item.genre_ids, appState.genres));
    if (isTrending) {
      const badge = document.createElement('span');
      badge.className = 'badge bg-warning position-absolute top-0 start-0 m-2';
      badge.textContent = 'Trending';
      badge.setAttribute('aria-label', 'Trending content');
      card.querySelector('.card-body').appendChild(badge);
    }
    grid.appendChild(card);
  });
  // Announce for screen readers
  announceLive(`${items.length} items loaded.`);
}

/**
 * Shows the watchlist section.
 */
function showWatchlist() {
  appState.currentView = 'watchlist';
  updateTitle('Movie Hub - Watchlist');
  elements.watchlistGrid.innerHTML = '';
  const watchlistItems = appState.watchlist.getAll();
  watchlistItems.forEach(item => {
    const card = createCard(item, item.media_type || 'movie', true, IMAGE_BASE, getGenresFromIds(item.genre_ids || [], appState.genres), true); // true = in watchlist, show remove btn
    elements.watchlistGrid.appendChild(card);
  });
  announceLive(`${watchlistItems.length} items in watchlist.`);
  showSection('watchlist');
}

/**
 * Hash-based routing for SPA navigation.
 */
function setupRouting() {
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.substring(1) || 'home';
    if (hash === 'watchlist') {
      showWatchlist();
    } else if (hash === 'home') {
      loadHome();
    }
    // Add more routes as needed (e.g., details via modal)
  });
}

// Export functions for other modules if needed (though most are imported)
export { loadHome, showWatchlist, renderContentGrid, elements, appState };