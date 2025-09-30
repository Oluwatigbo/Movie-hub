// api.js - Handles all external API fetches with error handling and caching.
// Uses async/await for promises. Caches responses in localStorage to respect rate limits.

const CACHE_KEY_PREFIX = 'moviehub_cache_';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in ms

/**
 * Fetches movie/TV genres from TMDb.
 * @param {string} baseUrl - TMDb API base URL.
 * @param {string} apiKey - TMDb API key.
 * @returns {Promise<Array>} Array of genre objects.
 */
export async function fetchGenres(baseUrl, apiKey) {
  const cacheKey = CACHE_KEY_PREFIX + 'genres';
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    const { data, timestamp } = JSON.parse(ced);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data.genres;
    }
  }

  try {
    const response = await fetch(`${baseUrl}/genre/movie/list?api_key=${apiKey}&language=en-US`);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
    return data.genres;
  } catch (error) {
    console.error('Error fetching genres:', error);
    throw new Error('Failed to fetch genres. Check API key and network.');
  }
}

/**
 * Fetches trending movies/TV from TMDb.
 * @param {string} baseUrl - TMDb API base URL.
 * @param {string} apiKey - TMDb API key.
 * @returns {Promise<Array>} Array of trending items.
 */
export async function fetchTrending(baseUrl, apiKey) {
  const cacheKey = CACHE_KEY_PREFIX + 'trending';
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data.results.slice(0, 8); // Limit to 8 for performance
    }
  }

  try {
    const response = await fetch(`${baseUrl}/trending/all/week?api_key=${apiKey}&language=en-US`);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
    return data.results.slice(0, 8);
  } catch (error) {
    console.error('Error fetching trending:', error);
    throw new Error('Failed to fetch trending content. Check API key and network.');
  }
}

/**
 * Fetches search results from TMDb.
 * @param {string} baseUrl - TMDb API base URL.
 * @param {string} apiKey - TMDb API key.
 * @param {string} query - Search query (title or genre name).
 * @returns {Promise<Array>} Array of search results.
 */
export async function fetchSearch(baseUrl, apiKey, query) {
  const cacheKey = CACHE_KEY_PREFIX + 'search_' + encodeURIComponent(query);
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data.results.slice(0, 20); // Limit to 20
    }
  }

  try {
    let endpoint = `${baseUrl}/search/multi?api_key=${apiKey}&language=en-US&query=${encodeURIComponent(query)}&page=1`;
    // If query is genre-based, adjust (simplified; in full app, parse genre ID)
    if (query.includes('genre:')) {
      const genreId = query.split(':')[1];
      endpoint = `${baseUrl}/discover/movie?api_key=${apiKey}&language=en-US&with_genres=${genreId}&page=1`;
    }
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
    return data.results.slice(0, 20);
  } catch (error) {
    console.error('Error searching:', error);
    throw new Error(`No results for "${query}". Check spelling or try another term.`);
  }
}

/**
 * Fetches details for a specific movie/TV ID from TMDb.
 * @param {string} baseUrl - TMDb API base URL.
 * @param {string} apiKey - TMDb API key.
 * @param {number} id - Content ID.
 * @param {string} mediaType - 'movie' or 'tv'.
 * @returns {Promise<Object>} Details object.
 */
export async function fetchDetails(baseUrl, apiKey, id, mediaType) {
  const cacheKey = CACHE_KEY_PREFIX + `${mediaType}_${id}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
  }

  try {
    const response = await fetch(`${baseUrl}/${mediaType}/${id}?api_key=${apiKey}&language=en-US&append_to_response=videos,reviews`);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
    return data;
  } catch (error) {
    console.error('Error fetching details:', error);
    throw new Error('Failed to load details. Item may not exist.');
  }
}

/**
 * Fetches YouTube trailer for content.
 * @param {string} apiKey - YouTube API key.
 * @param {string} title - Content title.
 * @param {number} tmdbId - TMDb ID (for specificity).
 * @returns {Promise<string|null>} YouTube video ID or null.
 */
export async function fetchTrailer(apiKey, title, tmdbId) {
  try {
    const query = `${title} official trailer`;
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoEmbeddable=true&key=${apiKey}&maxResults=1`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      return data.items[0].id.videoId;
    }
    return null;
  } catch (error) {
    console.error('Error fetching trailer:', error);
    return null; // Graceful fallback: no trailer
  }
}