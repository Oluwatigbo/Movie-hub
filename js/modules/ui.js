// ui.js - UI Helpers: DOM manipulation, animations, section toggling, announcements.
// Generates dynamic markup (e.g., cards); triggers CSS animations.

import { formatDate } from './utils.js';

/**
 * Shows a specific section, hiding others.
 * @param {string} section - 'home', 'searchResults', 'watchlist', etc.
 * @param {Object} elements - Cached DOM elements.
 */
export function showSection(section, elements = null) {
  if (!elements) elements = {}; // Fallback
  const sections = ['home', 'searchResults', 'watchlist', 'loadingSpinner', 'errorSection'];
  sections.forEach(s => {
    const el = elements[s] || document.getElementById(s);
    if (el) el.hidden = (s !== section);
  });
  // Focus management for accessibility
  const targetEl = elements[section] || document.getElementById(section);
  if (targetEl) targetEl.focus();
}

/**
 * Shows loading spinner.
 * @param {Object} elements - Cached DOM elements.
 */
export function showLoading(elements = null) {
  if (!elements) elements = {};
  (elements.loadingSpinner || document.getElementById('loadingSpinner')).hidden = false;
  showSection('loadingSpinner', elements);
}

/**
 * Hides loading spinner.
 * @param {Object} elements - Cached DOM elements.
 */
export function hideLoading(elements = null) {
  if (!elements) elements = {};
  (elements.loadingSpinner || document.getElementById('loadingSpinner')).hidden = true;
}

/**
 * Shows error message.
 * @param {string} message - Error text.
 * @param {Object} elements - Cached DOM elements.
 */
export function showError(message, elements = null) {
  if (!elements) elements = {};
  const errorEl = elements.errorMessage || document.getElementById('errorMessage');
  if (errorEl) errorEl.textContent = message;
  showSection('errorSection', elements);
  announceLive(message);
}

/**
 * Hides error section.
 * @param {Object} elements - Cached DOM elements.
 */
export function hideError(elements = null) {
  if (!elements) elements = {};
  showSection('mainContent', elements); // Or hide errorSection
  (elements.errorSection || document.getElementById('errorSection')).hidden = true;
}

/**
 * Creates a dynamic content card.
 * @param {Object} item - API item (movie/TV).
 * @param {string} mediaType - 'movie' or 'tv'.
 * @param {boolean} inWatchlist - If true, show remove button.
 * @param {string} imageBase - Image URL base.
 * @param {Array} genres - Genre names array.
 * @param {boolean} showRating - If true, include rating stars.
 * @returns {HTMLElement} Card element.
 */
export function createCard(item, mediaType, inWatchlist, imageBase, genres = [], showRating = false) {
  const card = document.createElement('div');
  card.className = 'col-md-3 col-sm-6 col-12';
  card.setAttribute('tabindex', '0'); // Keyboard focusable
  card.setAttribute('role', 'article');
  card.setAttribute('aria-label', `${item.title || item.name}, ${genres.join(', ')}`);

  const posterUrl = item.poster_path ? `${imageBase}${item.poster_path}` : 'https://via.placeholder.com/200x300?text=No+Image';
  const rating = item.vote_average ? Math.round(item.vote_average * 10) / 10 : 'N/A';

  card.innerHTML = `
    <div class="card h-100">
      <img src="${posterUrl}" class="card-img-top" alt="${item.title || item.name} poster" loading="lazy">
      <div class="card-body d-flex flex-column">
        <h5 class="card-title">${item.title || item.name}</h5>
        <p class="card-text flex-grow-1">${genres.slice(0, 2).join(', ') || 'Genre TBD'}</p>
        ${showRating ? `<p class="card-text"><small class="text-muted">Your Rating: ${item.user_rating ? `★${item.user_rating}` : 'Not rated'}</small></p>` : ''}
        <p class="card-text"><small class="text-muted">${rating}/10</small></p>
        <div class="mt-auto">
          ${!inWatchlist ? `
            <button class="btn btn-primary btn-sm add-to-watchlist" data-id="${item.id}" data-type="${mediaType}" aria-label="Add ${item.title || item.name} to watchlist">
              Add to Watchlist
            </button>
          ` : `
            <button class="btn btn-outline-danger btn-sm remove-from-watchlist" data-id="${item.id}" aria-label="Remove ${item.title || item.name} from watchlist">
              Remove
            </button>
          `}
          <button class="btn btn-secondary btn-sm view-details ms-1" data-id="${item.id}" data-type="${mediaType}" aria-label="View details for ${item.title || item.name}">
            Details
          </button>
        </div>
      </div>
    </div>
  `;

  // Trigger animation
  card.style.animation = 'fadeIn 0.5s ease-out';

  // Event delegation (attach in caller, e.g., main.js)
  const addBtn = card.querySelector('.add-to-watchlist');
  if (addBtn) {
    addBtn.addEventListener('click', (e) => {
      // Emit event or call watchlist.add (handled in main.js)
      e.stopPropagation();
      card.focus();
    });
  }

  const removeBtn = card.querySelector('.remove-from-watchlist');
  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      // Call watchlist.remove (handled in main.js)
      e.stopPropagation();
      card.focus();
    });
  }

  const detailsBtn = card.querySelector('.view-details');
  if (detailsBtn) {
    detailsBtn.addEventListener('click', (e) => {
      // Trigger details modal (handled in details.js)
      e.stopPropagation();
    });
  }

  // Click card for details (fallback)
  card.addEventListener('click', (e) => {
    if (!e.target.closest('button')) {
      // Trigger details
    }
  });

  return card;
}

/**
 * Announces text for screen readers via aria-live.
 * @param {string} text - Text to announce.
 */
export function announceLive(text) {
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.classList.add('visually-hidden');
  liveRegion.textContent = text;
  document.body.appendChild(liveRegion);
  setTimeout(() => document.body.removeChild(liveRegion), 1000);
}