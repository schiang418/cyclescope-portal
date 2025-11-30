/**
 * Client-side configuration loader
 * Fetches environment variables from server
 */

let CONFIG = {
  FUSION_VERSION: 'v1', // default
  API_BASE_URL: 'https://cyclescope-secular-production.up.railway.app',
};

/**
 * Load configuration from server
 * @returns {Promise<Object>} Configuration object
 */
async function loadConfig() {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) {
      console.warn('Failed to load config from server, using defaults');
      return CONFIG;
    }
    const serverConfig = await response.json();
    CONFIG = { ...CONFIG, ...serverConfig };
    console.log('✅ Configuration loaded:', CONFIG);
    return CONFIG;
  } catch (error) {
    console.error('Error loading configuration:', error);
    return CONFIG;
  }
}

/**
 * Get current configuration
 * @returns {Object} Configuration object
 */
function getConfig() {
  return CONFIG;
}

/**
 * Check if Fusion V2 is enabled
 * @returns {boolean} True if FUSION_VERSION is "v2"
 */
function isFusionV2() {
  return CONFIG.FUSION_VERSION === 'v2';
}

/**
 * Get secular assistant API base URL
 * @returns {string} API base URL
 */
function getSecularApiUrl() {
  return CONFIG.API_BASE_URL;
}

// Expose to window object
window.CONFIG = CONFIG;
window.loadConfig = loadConfig;
window.getConfig = getConfig;
window.isFusionV2 = isFusionV2;
window.getSecularApiUrl = getSecularApiUrl;

// Auto-load configuration when script loads
loadConfig().then(config => {
  window.CONFIG = config;
  console.log('✅ Configuration ready:', config);
}).catch(error => {
  console.error('❌ Failed to load configuration:', error);
});
