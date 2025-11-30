/**
 * CycleScope Portal Configuration
 * Environment variables and feature flags
 */

const CONFIG = {
  // FUSION_VERSION: "v1" or "v2"
  // v1 = existing Fusion display (default)
  // v2 = new implementation using secular assistant data
  FUSION_VERSION: process.env.FUSION_VERSION || 'v2',
  
  // API endpoints
  API_BASE_URL: process.env.API_BASE_URL || 'https://cyclescope-secular-production.up.railway.app',
  
  // Feature flags
  ENABLE_SECULAR_CHARTS: process.env.ENABLE_SECULAR_CHARTS === 'true' || false,
};

// Export for Node.js (server-side)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}

// Export for browser (client-side)
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}
