/**
 * Fusion V2 Update Logic
 * Updates Fusion section with secular assistant data
 */

/**
 * Update Fusion section with secular assistant data (V2)
 * @param {Object} secularData - Parsed secular analysis data
 */
function updateFusionV2(secularData) {
  if (!secularData) {
    console.error('No secular data provided for Fusion V2');
    return;
  }
  
  console.log('📊 Updating Fusion V2 with secular data:', secularData);
  
  // Update Layer 1
  updateFusionV2Layer1(secularData);
  
  // Update Layer 2
  updateFusionV2Layer2(secularData);
}

/**
 * Update Fusion Layer 1 with secular assistant data
 * @param {Object} secularData - Parsed secular analysis data
 */
function updateFusionV2Layer1(secularData) {
  const { layer1, layer3, metadata } = secularData;
  
  // Clear existing Layer 1 content
  const layer1Container = document.querySelector('#fusionLayer1 .card-content');
  if (!layer1Container) return;
  
  // Create new V2 Layer 1 display
  layer1Container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <!-- Secular Trend -->
      <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 0.5rem;">
        <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
          <span style="font-size: 1.5rem;">🔼</span>
          <div>
            <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Secular Trend</div>
            <div style="font-size: 1.1rem; color: var(--text-primary);">${layer1.trend}</div>
          </div>
        </div>
      </div>
      
      <!-- Recent Behavior Section -->
      <div style="background: var(--bg-secondary); padding: 1.25rem; border-radius: 0.5rem; border-left: 4px solid var(--accent-blue);">
        <h4 style="font-size: 1rem; margin-bottom: 0.75rem; color: var(--accent-blue); display: flex; align-items: center; gap: 0.5rem;">
          <span>📊</span>
          <span>Recent Behavior</span>
        </h4>
        <p style="color: var(--text-secondary); line-height: 1.7; margin-bottom: 0.75rem;">
          ${layer1.support}
        </p>
        <p style="color: var(--text-secondary); line-height: 1.7;">
          ${layer1.resistance}
        </p>
      </div>
      
      <!-- Risk Bias -->
      <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 0.5rem;">
        <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
          <span style="font-size: 1.5rem;">⚠️</span>
          <div>
            <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Risk Bias</div>
            <div style="font-size: 1rem; font-weight: 500; color: var(--text-primary);">${layer1.momentum}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Update Fusion Layer 2 with secular assistant data
 * @param {Object} secularData - Parsed secular analysis data
 */
function updateFusionV2Layer2(secularData) {
  const { layer1, layer2, layer3, metadata } = secularData;
  
  // Clear existing Layer 2 content
  const layer2Container = document.querySelector('#fusionLayer2 .card-content');
  if (!layer2Container) return;
  
  // Build scenarios HTML
  let scenariosHTML = '';
  if (layer2.scenarios && layer2.scenarios.length > 0) {
    layer2.scenarios.forEach((scenario, index) => {
      scenariosHTML += `
        <div style="background: var(--bg-secondary); padding: 1.25rem; border-radius: 0.5rem; margin-bottom: 1.25rem; border-left: 4px solid var(--accent-blue);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <h4 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 0;">
              ${scenario.name}
            </h4>
            <span style="background: var(--accent-blue); color: white; padding: 0.25rem 0.75rem; border-radius: 0.25rem; font-size: 0.875rem; font-weight: 600;">
              ${scenario.probability.toFixed(1)}%
            </span>
          </div>
          
          <div style="color: var(--text-secondary); line-height: 1.7; font-size: 0.95rem;">
            <p style="margin-bottom: 0.5rem;">
              <strong style="color: var(--text-primary);">Path Summary:</strong> ${scenario.trigger} ${scenario.catalysts}
            </p>
            <p style="margin-bottom: 0.5rem;">
              <strong style="color: var(--text-primary);">Target Zone:</strong> ${scenario.priceTarget} (${scenario.expectedMove})
            </p>
            <p style="margin: 0;">
              <strong style="color: var(--text-primary);">Risk Profile:</strong> ${scenario.risks}
            </p>
          </div>
        </div>
      `;
    });
  }
  
  // Create new V2 Layer 2 display
  layer2Container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <!-- Annotated Chart -->
      <div style="background: var(--bg-secondary); padding: 1.25rem; border-radius: 0.5rem;">
        <h4 style="font-size: 1rem; margin-bottom: 0.75rem; color: var(--accent-blue); display: flex; align-items: center; gap: 0.5rem;">
          <span>📈</span>
          <span>S&P 500 Monthly Chart</span>
        </h4>
        <div style="text-align: center;">
          <img 
            src="${metadata.annotatedChartUrl}" 
            alt="S&P 500 Annotated Chart" 
            style="max-width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"
            onerror="this.onerror=null; this.src='${metadata.chartUrl}'; this.alt='S&P 500 Chart (annotation unavailable)';"
          />
          <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem;">
            Last updated: ${new Date(metadata.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
      
      <!-- Scenarios Section -->
      <div>
        <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
          <span>📊</span>
          <span>Scenarios</span>
        </h3>
        ${scenariosHTML}
      </div>
      
      <!-- Secular Summary -->
      <div style="background: var(--bg-hover); padding: 1.25rem; border-radius: 0.5rem; border-left: 4px solid var(--accent-gold);">
        <h4 style="font-size: 1rem; margin-bottom: 0.75rem; color: var(--accent-gold); display: flex; align-items: center; gap: 0.5rem;">
          <span>📝</span>
          <span>Secular Summary</span>
        </h4>
        <p style="color: var(--text-secondary); line-height: 1.7;">
          ${layer3.riskWarning} ${layer3.actionableInsight}
        </p>
      </div>
    </div>
  `;
}

// Removed: addAnnotatedChartDisplay - now integrated into updateFusionV2Layer2

/**
 * Get color class for secular trend
 * @param {string} trend - Trend label (e.g., "Upward", "Downward", "Sideways")
 * @returns {string} CSS color class
 */
function getTrendColorClass(trend) {
  const trendLower = (trend || '').toLowerCase();
  
  if (trendLower.includes('upward') || trendLower.includes('bull')) {
    return 'green';
  } else if (trendLower.includes('downward') || trendLower.includes('bear')) {
    return 'red';
  } else if (trendLower.includes('sideways') || trendLower.includes('neutral')) {
    return 'yellow';
  } else {
    return 'gray';
  }
}

/**
 * Get color class for risk bias
 * @param {string} riskBias - Risk bias label
 * @returns {string} CSS color class
 */
function getRiskBiasColorClass(riskBias) {
  const biasLower = (riskBias || '').toLowerCase();
  
  if (biasLower.includes('upward') || biasLower.includes('bullish')) {
    return 'green';
  } else if (biasLower.includes('downward') || biasLower.includes('bearish')) {
    return 'red';
  } else if (biasLower.includes('moderate') || biasLower.includes('caution')) {
    return 'yellow';
  } else {
    return 'gray';
  }
}

/**
 * Get fragility CSS class from color code
 * @param {string} color - Color code (green, yellow, red, gray)
 * @returns {string} CSS class name
 */
function getFragilityClass(color) {
  const colorMap = {
    'green': 'green',
    'yellow': 'yellow',
    'orange': 'orange',
    'red': 'red',
    'gray': 'gray',
  };
  return colorMap[color] || 'gray';
}
