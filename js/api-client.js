/**
 * CycleScope API Client
 * Handles all API communication with the CycleScope backend
 */

const API_BASE_URL = 'https://cyclescope-api-production.up.railway.app';

/**
 * Fetch the latest market analysis from the API
 * @returns {Promise<Object>} Latest analysis data
 */
async function fetchLatestAnalysis() {
  try {
    const url = `${API_BASE_URL}/api/trpc/analysis.latest?batch=1&input=%7B%7D`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // tRPC returns array with result wrapper
    if (data && data[0] && data[0].result && data[0].result.data) {
      return data[0].result.data;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch latest analysis:', error);
    throw error;
  }
}

/**
 * Fetch historical analysis data
 * @param {number} days - Number of days to fetch (default: 7)
 * @returns {Promise<Array>} Array of historical analysis
 */
async function fetchHistoricalAnalysis(days = 7) {
  try {
    const url = `${API_BASE_URL}/api/trpc/analysis.history?batch=1&input=${encodeURIComponent(JSON.stringify({"0":{"json":{"days":days}}}))}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data[0] && data[0].result && data[0].result.data) {
      return data[0].result.data;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch historical analysis:', error);
    throw error;
  }
}

/**
 * Format date string to readable format
 * @param {string} dateStr - ISO date string or YYYY-MM-DD
 * @returns {string} Formatted date (e.g., "November 5, 2025")
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

/**
 * Format date for "Week of" display
 * @param {string} dateStr - ISO date string or YYYY-MM-DD
 * @returns {string} Formatted date (e.g., "November 5, 2025")
 */
function formatWeekOf(dateStr) {
  return formatDate(dateStr);
}

/**
 * Get emoji for fragility color
 * @param {string} color - GREEN, YELLOW, ORANGE, RED
 * @returns {string} Emoji
 */
function getFragilityEmoji(color) {
  const map = {
    'GREEN': '🟢',
    'YELLOW': '🟡',
    'ORANGE': '🟠',
    'RED': '🔴'
  };
  return map[color] || '⚪';
}

/**
 * Get CSS class for fragility color
 * @param {string} color - GREEN, YELLOW, ORANGE, RED
 * @returns {string} CSS class name
 */
function getFragilityClass(color) {
  const map = {
    'GREEN': 'green',
    'YELLOW': 'yellow',
    'ORANGE': 'orange',
    'RED': 'red'
  };
  return map[color] || 'orange';
}

/**
 * Get emoji for domain color code
 * @param {string} colorCode - Emoji color code from API
 * @returns {string} Emoji
 */
function getDomainEmoji(colorCode) {
  // API returns emoji directly
  return colorCode || '⚪';
}

/**
 * Get CSS class for domain status
 * @param {string} colorCode - Emoji color code
 * @returns {string} CSS class name
 */
function getDomainClass(colorCode) {
  // Normalize emoji by removing variation selectors
  const normalized = colorCode?.replace(/\uFE0F/g, '').trim();
  
  const map = {
    '🟢': 'green',
    '🟡': 'yellow',
    '🟠': 'orange',
    '🔴': 'red',
    '⚪': 'neutral'  // White circle = neutral/gray
  };
  return map[normalized] || 'neutral';  // Default to neutral instead of yellow
}

/**
 * Get emoji for Delta stress score
 * @param {number} score - 0, 1, or 2
 * @returns {string} Emoji
 */
function getStressEmoji(score) {
  if (score === 0) return '🟢';
  if (score === 1) return '🟡';
  if (score === 2) return '🟠';
  return '⚪';
}

/**
 * Calculate total Delta fragility score
 * @param {Object} delta - Delta data object
 * @returns {number} Total score (0-8)
 */
function calculateDeltaScore(delta) {
  return (delta.breadth || 0) + 
         (delta.liquidity || 0) +  // FIXED: was liquidityCredit
         (delta.volatility || 0) + 
         (delta.leadership || 0);
}

/**
 * Format Fusion cycle stage for display
 * @param {string} stage - ACCUMULATION, MARKUP, DISTRIBUTION, MARKDOWN
 * @returns {string} Formatted stage
 */
function formatCycleStage(stage) {
  if (!stage) return 'N/A';
  const labels = {
    'ACCUMULATION': 'Accumulation',
    'MARKUP': 'Markup',
    'DISTRIBUTION': 'Distribution',
    'MARKDOWN': 'Markdown'
  };
  return labels[stage] || stage;
}

/**
 * Format fragility label for display
 * @param {string} label - Fragility label from API
 * @returns {string} Formatted label
 */
function formatFragilityLabel(label) {
  return label || 'N/A';
}

/**
 * Format guidance label for display
 * @param {string} label - Guidance label from API
 * @returns {string} Formatted label
 */
function formatGuidanceLabel(label) {
  return label || 'N/A';
}

/**
 * Parse guidance bullets from text
 * @param {string} bulletsText - Bullet points as text
 * @returns {Array<string>} Array of bullet points
 */
function parseGuidanceBullets(bulletsText) {
  if (!bulletsText) return [];
  return bulletsText.split('\n').filter(line => line.trim().startsWith('•') || line.trim().startsWith('-')).map(line => line.trim().replace(/^[•\-]\s*/, ''));
}

/**
 * Parse rationale bullets from text
 * @param {string} bulletsText - Bullet points as text
 * @returns {Array<string>} Array of bullet points
 */
function parseRationaleBullets(bulletsText) {
  if (!bulletsText) return [];
  return bulletsText.split('\n').filter(line => line.trim().startsWith('•') || line.trim().startsWith('-')).map(line => line.trim().replace(/^[•\-]\s*/, ''));
}

