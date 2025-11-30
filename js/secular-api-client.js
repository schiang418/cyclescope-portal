/**
 * Secular Assistant API Client
 * Fetches data from cyclescope-secular backend
 */

/**
 * Fetch latest secular assistant analysis
 * @returns {Promise<Object>} Analysis data with Layer 1, Layer 2, and Layer 3
 */
async function fetchSecularAnalysis() {
  const apiUrl = getSecularApiUrl();
  
  try {
    const response = await fetch(`${apiUrl}/analysis/latest`);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Secular analysis fetched:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Failed to fetch secular analysis:', error);
    throw error;
  }
}

/**
 * Get annotated chart URL
 * @returns {string} URL to the Gemini-annotated chart
 */
function getAnnotatedChartUrl() {
  const apiUrl = getSecularApiUrl();
  return `${apiUrl}/annotated-chart`;
}

/**
 * Get latest chart URL (without annotation)
 * @returns {string} URL to the latest chart
 */
function getLatestChartUrl() {
  const apiUrl = getSecularApiUrl();
  return `${apiUrl}/latest-chart`;
}

/**
 * Parse secular assistant analysis into Fusion-compatible format
 * @param {Object} data - Raw API response
 * @returns {Object} Formatted data for Fusion display
 */
function parseSecularAnalysis(data) {
  if (!data || !data.analysis) {
    console.warn('No analysis data found in response');
    return null;
  }
  
  const analysis = data.analysis;
  
  // Extract Layer 1 data (from secular API fields)
  const layer1 = {
    trend: analysis.secular_trend || 'N/A',
    phase: analysis.secular_regime_status || 'N/A',
    strength: analysis.channel_position || 'N/A',
    momentum: analysis.risk_bias || 'N/A',
    support: analysis.interpretation || 'N/A',
    resistance: analysis.dominant_dynamics || 'N/A',
    outlook: analysis.summary_signal || 'N/A',
  };
  
  // Extract Layer 2 data (4 scenarios from secular API)
  const scenarios = [];
  for (let i = 1; i <= 4; i++) {
    const scenario = {
      name: analysis[`scenario${i}_name`] || `Scenario ${i}`,
      probability: parseFloat(analysis[`scenario${i}_probability`] || 0) * 100, // Convert to percentage
      trigger: analysis[`scenario${i}_path_summary`] || 'N/A',
      priceTarget: analysis[`scenario${i}_target_zone`] || 'N/A',
      timeframe: 'N/A', // Not provided by secular API
      expectedMove: `${analysis[`scenario${i}_expected_move_min`] || 'N/A'}% to ${analysis[`scenario${i}_expected_move_max`] || 'N/A'}%`,
      keyLevels: analysis[`scenario${i}_target_zone`] || 'N/A',
      catalysts: analysis[`scenario${i}_technical_logic`] || 'N/A',
      risks: analysis[`scenario${i}_risk_profile`] || 'N/A',
    };
    scenarios.push(scenario);
  }
  
  // Extract Layer 3 data (from secular API)
  const layer3 = {
    primaryMessage: analysis.primary_message || 'N/A',
    actionableInsight: analysis.secular_summary || 'N/A',
    riskWarning: analysis.overall_bias || 'N/A',
    keyLevel: analysis.scenario_summary_1 || 'N/A', // Most likely scenario
    timeHorizon: 'Medium to Long Term', // Secular analysis is long-term
  };
  
  return {
    layer1,
    layer2: {
      metadata: {
        totalScenarios: analysis.layer2_total_scenarios || 4,
        mostLikely: analysis.layer2_most_likely_scenario || 'N/A',
        recommendation: analysis.layer2_recommendation || 'N/A',
      },
      scenarios,
    },
    layer3,
    metadata: {
      timestamp: data.timestamp || new Date().toISOString(),
      chartUrl: analysis.original_chart_url ? `${getSecularApiUrl()}${analysis.original_chart_url}` : getLatestChartUrl(),
      annotatedChartUrl: analysis.annotated_chart_url ? `${getSecularApiUrl()}${analysis.annotated_chart_url}` : getAnnotatedChartUrl(),
      asofDate: analysis.asof_date || new Date().toISOString(),
    },
  };
}
