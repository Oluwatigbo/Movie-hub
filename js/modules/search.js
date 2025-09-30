// search.js - Manages search functionality: input handling, results rendering.
// Integrates with API and UI modules.

import { fetchSearch } from './api.js';
import { createCard } from './ui.js';

/**
 * Initializes search module.
 * @param {Object} elements - Cached DOM elements.
 * @param {Object} appState - Global app state.
 * @param {Function} handleSearchFn - The handleSearch function (for circular import avoidance).
 * @param {Function} showSection - Function to display a specific section.
 */