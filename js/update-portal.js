/**
 * CycleScope Portal Updater
 * Updates the portal UI with real-time data from the API
 */

/**
 * Main function to update the entire portal
 */
async function updatePortal() {
  try {
    // Show loading state
    showLoading();
    
    // Fetch latest analysis data
    const data = await fetchLatestAnalysis();
    
    if (!data) {
      showError('No analysis data available. Please try again later.');
      return;
    }
    
    // Update all sections
    updateFusionSection(data);
    updateGammaSection(data);
    updateDeltaSection(data);
    
    // Update last updated time
    if (data.updatedAt) {
      updateLastUpdatedTime(data.updatedAt);
    }
    
    // Hide loading state
    hideLoading();
    
    console.log('Portal updated successfully', data);
    
  } catch (error) {
    console.error('Failed to update portal:', error);
    showError('Failed to load analysis data. Please refresh the page.');
    hideLoading();
  }
}

/**
 * Update Fusion section with API data
 * @param {Object} data - Analysis data from API
 */
function updateFusionSection(data) {
  if (!data.fusion) return;
  
  let fusion = data.fusion;
  
  // Parse fullAnalysis.fusion if it exists
  if (data.fullAnalysis && data.fullAnalysis.fusion) {
    try {
      const fusionData = data.fullAnalysis.fusion;
      
      // Use layer1 and layer2 objects directly
      if (fusionData.layer1) {
        fusion = {
          ...fusion,
          asofDate: fusionData.layer1.asof_date,
          cycleStage: fusionData.layer1.cycle_stage,
          fragilityColor: fusionData.layer1.fragility_color,
          fragilityLabel: fusionData.layer1.fragility_label,
          guidanceLabel: fusionData.layer1.guidance_label,
          headlineSummary: fusionData.layer1.headline_summary
        };
      }
      
      // Extract Layer 2 data
      if (fusionData.layer2) {
        fusion.cycleTone = fusionData.layer2.cycle_tone;
        fusion.narrativeSummary = fusionData.layer2.narrative_summary;
        fusion.guidanceBullets = fusionData.layer2.guidance_bullets;
        fusion.watchCommentary = fusionData.layer2.watch_commentary;
      }
    } catch (e) {
      console.error('Failed to parse fullAnalysis.fusion:', e);
    }
  }
  
  // Layer 1 Fields
  
  // Update As-of Date
  const dateEl = document.querySelector('#fusionDate');
  if (dateEl && fusion.asofDate) {
    dateEl.textContent = formatDate(fusion.asofDate);
  }
  
  // Update Cycle Stage (fusionCycleStage for Layer 2, fusionPhase for Layer 1)
  const stageEl = document.querySelector('#fusionCycleStage');
  if (stageEl && fusion.cycleStage) {
    stageEl.textContent = formatCycleStage(fusion.cycleStage);
  }
  
  // Update Phase (Layer 1)
  const phaseEl = document.querySelector('#fusionPhase');
  if (phaseEl && fusion.cycleStage) {
    phaseEl.textContent = fusion.cycleStage;
  }
  
  // Update Fragility Badge with dynamic color (use Delta's fragility, no emoji)
  const fragilityBadge = document.querySelector('#fusionFragilityBadge');
  // Get fragility from Delta (they should match)
  let fragilityLabel = fusion.fragilityLabel;
  let fragilityColor = fusion.fragilityColor;
  
  if (data.fullAnalysis && data.fullAnalysis.delta) {
    try {
      const faDelta = typeof data.fullAnalysis.delta === 'string' ? JSON.parse(data.fullAnalysis.delta) : data.fullAnalysis.delta;
      if (faDelta.level2) {
        fragilityLabel = faDelta.level2.fragility_label || fragilityLabel;
        fragilityColor = faDelta.level2.fragility_color || fragilityColor;
      }
    } catch (e) {
      console.error('Failed to get Delta fragility for Fusion:', e);
    }
  }
  
  if (fragilityBadge && fragilityColor && fragilityLabel) {
    const colorClass = getFragilityClass(fragilityColor);
    fragilityBadge.className = `status-badge ${colorClass}`;
    fragilityBadge.innerHTML = `<strong>Fragility:</strong> ${fragilityLabel}`;
  }
  
  // Update Guidance Label
  const guidanceEl = document.querySelector('#fusionGuidance');
  if (guidanceEl) {
    guidanceEl.textContent = formatGuidanceLabel(fusion.guidanceLabel);
  }
  
  // Update Headline Summary
  const summaryEl = document.querySelector('#fusionHeadline');
  if (summaryEl && fusion.headlineSummary) {
    summaryEl.textContent = fusion.headlineSummary;
  }
  
  // Layer 2 Fields
  updateFusionLayer2(fusion, data);
}

/**
 * Update Fusion Layer 2 (detailed analysis)
 * @param {Object} fusion - Fusion data object
 * @param {Object} data - Full API data object
 */
function updateFusionLayer2(fusion, data) {
  // Cycle Tone (from Gamma)
  const toneEl = document.querySelector('#fusionCycleTone');
  let cycleTone = fusion.cycleTone;
  
  // Get cycle_tone from Gamma (Fusion synthesizes Gamma + Delta)
  if (data && data.fullAnalysis && data.fullAnalysis.gamma) {
    try {
      const gammaData = typeof data.fullAnalysis.gamma === 'string' ? JSON.parse(data.fullAnalysis.gamma) : data.fullAnalysis.gamma;
      if (gammaData.level2 && gammaData.level2.cycle_tone) {
        cycleTone = gammaData.level2.cycle_tone;
      }
    } catch (e) {
      console.error('Failed to get cycle_tone from Gamma:', e);
    }
  }
  
  if (toneEl && cycleTone) {
    toneEl.textContent = cycleTone;
  }
  
  // Narrative Summary
  const narrativeEl = document.querySelector('#fusionNarrative');
  if (narrativeEl && fusion.narrativeSummary) {
    narrativeEl.textContent = fusion.narrativeSummary;
  }
  
  // Guidance Bullets
  const bulletsEl = document.querySelector('#fusionGuidanceBullets');
  if (bulletsEl && fusion.guidanceBullets && Array.isArray(fusion.guidanceBullets)) {
    bulletsEl.innerHTML = fusion.guidanceBullets.map(bullet => `<li>${bullet}</li>`).join('');
  }
  
  // Watch Commentary
  const watchEl = document.querySelector('#fusionWatch');
  if (watchEl && fusion.watchCommentary) {
    watchEl.textContent = fusion.watchCommentary;
  }
}

/**
 * Update Gamma section with API data
 * @param {Object} data - Analysis data from API
 */
function updateGammaSection(data) {
  if (!data.gamma) return;
  
  // API returns gamma data directly in flat structure
  const gamma = data.gamma;
  
  // Layer 1 Fields
  
  // Update As-of Week
  const weekEl = document.querySelector('#gammaWeekOf');
  if (weekEl && gamma.asofWeek) {
    weekEl.textContent = formatWeekOf(gamma.asofWeek);
  }
  
  // Update Cycle Stage (combined primary + transition)
  const cycleStageEl = document.querySelector('#gammaCycleStage');
  if (cycleStageEl) {
    let stageText = gamma.cycleStagePrimary || '';
    if (gamma.cycleStageTransition) {
      stageText += ` → ${gamma.cycleStageTransition}`;
    }
    cycleStageEl.textContent = stageText || 'N/A';
  }
  
  // Update Cycle Stage Primary (if separate element exists)
  const stageEl = document.querySelector('#gammaCycleStagePrimary');
  if (stageEl && gamma.cycleStagePrimary) {
    stageEl.textContent = gamma.cycleStagePrimary;
  }
  
  // Update Cycle Stage Transition (if separate element exists)
  const transitionEl = document.querySelector('#gammaCycleStageTransition');
  if (transitionEl && gamma.cycleStageTransition) {
    transitionEl.textContent = gamma.cycleStageTransition;
  }
  
  // Update Macro Posture (Layer 1)
  const postureEl = document.querySelector('#gammaPosture');
  if (postureEl) {
    const posture = gamma.macroPostureLabel || 'N/A';
    postureEl.textContent = posture;
    // Set color based on posture
    if (posture.toLowerCase().includes('caution')) {
      postureEl.style.color = 'var(--orange)';
    } else if (posture.toLowerCase().includes('defensive')) {
      postureEl.style.color = 'var(--red)';
    } else if (posture.toLowerCase().includes('bullish') || posture.toLowerCase().includes('aggressive')) {
      postureEl.style.color = 'var(--green)';
    } else {
      postureEl.style.color = 'var(--text-primary)';
    }
  }
  
  // Update Macro Posture Label (if separate element exists)
  const postureEl2 = document.querySelector('#gammaMacroPosture');
  if (postureEl2 && gamma.macroPostureLabel) {
    postureEl2.textContent = gamma.macroPostureLabel;
  }
  
  // Update Headline Summary
  const summaryEl = document.querySelector('#gammaHeadline');
  if (summaryEl && gamma.headlineSummary) {
    summaryEl.textContent = gamma.headlineSummary;
  }
  
  // Update Domains (6 domains with dynamic colors)
  if (gamma.domains && Array.isArray(gamma.domains)) {
    updateGammaDomains(gamma.domains);
  }
  
  // Layer 2 Fields
  updateGammaLayer2(gamma);
}

/**
 * Update Gamma domains with dynamic colors
 * @param {Array} domains - Array of domain objects
 */
function updateGammaDomains(domains) {
  // Map domain names to element IDs
  const domainMap = {
    'Leadership': 'gammaLeadership',
    'Breadth': 'gammaBreadth',
    'Sentiment': 'gammaSentiment',
    'Volatility': 'gammaVolatility',
    'Credit liquidity': 'gammaCredit',  // API uses "Credit liquidity"
    'Macro trend': 'gammaMacro'  // API uses "Macro trend"
  };
  
  domains.forEach(domain => {
    const elementId = domainMap[domain.domain_name];
    const el = document.querySelector(`#${elementId}`);
    
    if (el) {
      const colorClass = getDomainClass(domain.color_code);
      const biasLabel = domain.bias_label || '';
      
      // Display only bias_label, no emoji, no strength_label
      // Background color comes from color_code via colorClass
      el.textContent = biasLabel;
      el.className = `status-badge ${colorClass}`;
    }
  });
}

/**
 * Update Gamma Layer 2 (detailed analysis)
 * @param {Object} gamma - Gamma data object
 */
function updateGammaLayer2(gamma) {
  // Week of (same as Layer 1)
  const weekLayer2El = document.querySelector('#gammaWeekLayer2');
  if (weekLayer2El && gamma.asofWeek) {
    weekLayer2El.textContent = formatDate(gamma.asofWeek);
  }
  
  // Cycle Stage (same as Layer 1)
  const cycleStageLayer2El = document.querySelector('#gammaCycleStageLayer2');
  if (cycleStageLayer2El) {
    let stageText = gamma.cycleStagePrimary || 'N/A';
    if (gamma.cycleStageTransition) {
      stageText += ` → ${gamma.cycleStageTransition}`;
    }
    cycleStageLayer2El.textContent = stageText;
  }
  
  // Phase Confidence
  const phaseConfEl = document.querySelector('#gammaPhaseConfidence');
  if (phaseConfEl && gamma.phaseConfidence) {
    phaseConfEl.textContent = gamma.phaseConfidence;
  }
  
  // Cycle Tone
  const toneEl = document.querySelector('#gammaCycleTone');
  if (toneEl && gamma.cycleTone) {
    toneEl.textContent = gamma.cycleTone;
  }
  
  // Overall Summary
  const summaryEl = document.querySelector('#gammaOverallSummary');
  if (summaryEl && gamma.overallSummary) {
    summaryEl.textContent = gamma.overallSummary;
  }
  
  // Domain Details - Convert object to array format
  console.log('[DEBUG] gamma.domainDetails:', gamma.domainDetails);
  console.log('[DEBUG] typeof gamma.domainDetails:', typeof gamma.domainDetails);
  
  if (gamma.domainDetails && typeof gamma.domainDetails === 'object') {
    // API returns domainDetails as an object with domain keys
    // Convert to array format expected by updateGammaDomainDetails
    const domainDetailsArray = Object.entries(gamma.domainDetails).map(([key, value]) => ({
      domain_name: formatDomainName(key),
      summary: value.key_takeaway || value.analysis || 'N/A',
      observations: value.observations || 'N/A',
      interpretation: value.analysis || value.key_takeaway || 'N/A'
    }));
    
    console.log('[DEBUG] domainDetailsArray:', domainDetailsArray);
    updateGammaDomainDetails(domainDetailsArray);
  }
}

/**
 * Update Gamma domain details in Layer 2
 * @param {Array} domainDetails - Array of detailed domain objects
 */
function updateGammaDomainDetails(domainDetails) {
  const container = document.querySelector('#gammaDomainDetailsContainer');
  if (!container) return;
  
  // Clear existing content
  container.innerHTML = '';
  
  // Create detail sections for each domain
  domainDetails.forEach(detail => {
    const section = document.createElement('div');
    section.className = 'domain-detail-section';
    section.innerHTML = `
      <h4>${detail.domain_name}</h4>
      <p><strong>Summary:</strong> ${detail.summary || 'N/A'}</p>
      <p><strong>Observations:</strong> ${detail.observations || 'N/A'}</p>
      <p><strong>Interpretation:</strong> ${detail.interpretation || 'N/A'}</p>
    `;
    container.appendChild(section);
  });
}

/**
 * Update Delta section with API data
 * @param {Object} data - Analysis data from API
 */
function updateDeltaSection(data) {
  if (!data.delta) return;
  
  let delta = { ...data.delta };
  
  // Parse fullAnalysis.delta if available
  if (data.fullAnalysis && data.fullAnalysis.delta) {
    try {
      const faDeltaText = data.fullAnalysis.delta;
      let faDelta;
      
      if (typeof faDeltaText === 'string') {
        faDelta = JSON.parse(faDeltaText);
      } else {
        faDelta = faDeltaText;
      }
      
      // Extract Level 2 data
      if (faDelta.level2) {
        const level2 = faDelta.level2;
        
        // Map snake_case to camelCase
        delta.asofDate = level2.asof_date || delta.asofDate;
        delta.phaseUsed = level2.phase_used || delta.phaseUsed;
        delta.phaseConfidence = level2.phase_confidence || delta.phaseConfidence;
        delta.fragilityColor = level2.fragility_color || delta.fragilityColor;
        delta.fragilityLabel = level2.fragility_label || delta.fragilityLabel;
        delta.fragilityScore = level2.fragility_score || delta.fragilityScore;
        
        // Extract dimension commentary
        if (level2.dimension_commentary) {
          delta.breadthText = level2.dimension_commentary.breadth_text;
          delta.liquidityText = level2.dimension_commentary.liquidity_text;
          delta.volatilityText = level2.dimension_commentary.volatility_text;
          delta.leadershipText = level2.dimension_commentary.leadership_text;
        }
        
        // Extract rationale and summary
        delta.rationaleBullets = level2.rationale_bullets;
        delta.plainEnglishSummary = level2.plain_english_summary;
        delta.nextTriggersDetail = level2.next_triggers_detail;
      }
    } catch (e) {
      console.error('Failed to parse fullAnalysis.delta:', e);
    }
  }
  
  // Layer 1 Fields
  
  // Update As-of Date
  const dateEl = document.querySelector('#deltaDate');
  if (dateEl && delta.asofDate) {
    dateEl.textContent = formatDate(delta.asofDate);
  }
  
  // Update Delta Status Badge (Layer 1 large badge)
  const statusBadge = document.querySelector('#deltaStatusBadge');
  const fragilityText = document.querySelector('#deltaFragility');
  if (statusBadge && fragilityText && delta.fragilityColor && delta.fragilityLabel) {
    const colorClass = getFragilityClass(delta.fragilityColor);
    statusBadge.className = `status-badge ${colorClass}`;
    // Add fragility score next to label (e.g., "Caution Warranted (3/8)")
    const scoreText = delta.fragilityScore !== undefined ? ` (${delta.fragilityScore}/8)` : '';
    fragilityText.textContent = delta.fragilityLabel + scoreText;
  }
  
  // Update Fragility Badge with dynamic color (no emoji)
  const fragilityBadge = document.querySelector('#deltaFragilityBadge');
  if (fragilityBadge && delta.fragilityColor && delta.fragilityLabel) {
    const colorClass = getFragilityClass(delta.fragilityColor);
    fragilityBadge.className = `status-badge ${colorClass}`;
    // Add fragility score next to label (e.g., "Elevated Internal Risk (5/8)")
    const scoreText = delta.fragilityScore !== undefined ? ` (${delta.fragilityScore}/8)` : '';
    fragilityBadge.textContent = delta.fragilityLabel + scoreText;
  }
  
  // Update Fragility Score with dynamic color
  const scoreEl = document.querySelector('#deltaFragilityScore');
  if (scoreEl && delta.fragilityScore !== undefined) {
    const score = delta.fragilityScore;
    let scoreColorClass = 'green';
    if (score >= 6) scoreColorClass = 'red';
    else if (score >= 3) scoreColorClass = 'yellow';
    
    scoreEl.innerHTML = `<span class="status-badge ${scoreColorClass}">${score} / 8</span>`;
  }
  
  // Update Template Code and Name
  const templateEl = document.querySelector('#deltaTemplate');
  if (templateEl && delta.templateCode && delta.templateName) {
    templateEl.textContent = `${delta.templateCode} - ${delta.templateName}`;
  }
  
  // Update Pattern Plain
  const patternEl = document.querySelector('#deltaPattern');
  if (patternEl && delta.patternPlain) {
    patternEl.textContent = delta.patternPlain;
  }
  
  // Update Posture
  const postureEl = document.querySelector('#deltaPosture');
  if (postureEl && delta.postureLabel) {
    postureEl.textContent = delta.postureLabel;
  }
  
  // Update Headline Summary
  const summaryEl = document.querySelector('#deltaHeadline');
  if (summaryEl && delta.headlineSummary) {
    summaryEl.textContent = delta.headlineSummary;
  }
  
  // Update Key Drivers
  const driversEl = document.querySelector('#deltaKeyDrivers');
  if (driversEl && delta.keyDrivers && Array.isArray(delta.keyDrivers)) {
    driversEl.innerHTML = delta.keyDrivers.map(driver => `<li>${driver}</li>`).join('');
  }
  
  // Update Next Watch
  const watchEl = document.querySelector('#deltaNextWatch');
  if (watchEl && delta.nextWatchDisplay) {
    if (typeof delta.nextWatchDisplay === 'string') {
      watchEl.textContent = delta.nextWatchDisplay;
    } else if (typeof delta.nextWatchDisplay === 'object') {
      // Format: "Signal: Condition — Meaning"
      const signal = delta.nextWatchDisplay.signal || '';
      const condition = delta.nextWatchDisplay.condition || '';
      const meaning = delta.nextWatchDisplay.meaning || '';
      watchEl.textContent = `${signal}: ${condition} — ${meaning}`;
    } else {
      watchEl.textContent = String(delta.nextWatchDisplay);
    }
  }
  
  // Layer 2 Fields
  updateDeltaLayer2(delta);
}

/**
 * Update Delta Layer 2 (detailed analysis)
 * @param {Object} delta - Delta data object
 */
function updateDeltaLayer2(delta) {
  // Phase Used
  const phaseEl = document.querySelector('#deltaPhaseUsed');
  if (phaseEl && delta.phaseUsed) {
    phaseEl.textContent = delta.phaseUsed;
  }
  
  // Template Name (Layer 2)
  const templateNameEl = document.querySelector('#deltaTemplateName');
  if (templateNameEl && delta.templateCode && delta.templateName) {
    templateNameEl.textContent = `${delta.templateCode} - ${delta.templateName}`;
  }
  
  // Phase Confidence removed (only Gamma shows confidence)
  
  // Stress Scores with dynamic colors
  updateDeltaStressScores(delta);
  
  // Stress Score Explanations
  const breadthTextEl = document.querySelector('#deltaBreadthText');
  if (breadthTextEl && delta.breadthText) {
    breadthTextEl.textContent = delta.breadthText;
  }
  
  const liquidityTextEl = document.querySelector('#deltaLiquidityText');
  if (liquidityTextEl && delta.liquidityText) {
    liquidityTextEl.textContent = delta.liquidityText;
  }
  
  const volatilityTextEl = document.querySelector('#deltaVolatilityText');
  if (volatilityTextEl && delta.volatilityText) {
    volatilityTextEl.textContent = delta.volatilityText;
  }
  
  const leadershipTextEl = document.querySelector('#deltaLeadershipText');
  if (leadershipTextEl && delta.leadershipText) {
    leadershipTextEl.textContent = delta.leadershipText;
  }
  
  // Rationale Bullets
  const rationaleEl = document.querySelector('#deltaRationale');
  if (rationaleEl && delta.rationaleBullets && Array.isArray(delta.rationaleBullets)) {
    rationaleEl.innerHTML = delta.rationaleBullets.map(bullet => `<li>${bullet}</li>`).join('');
  }
  
  // Plain English Summary
  const plainSummaryEl = document.querySelector('#deltaPlainSummary');
  if (plainSummaryEl && delta.plainEnglishSummary) {
    plainSummaryEl.textContent = delta.plainEnglishSummary;
  }
  
  // Next Triggers Detail (display as table)
  const triggersEl = document.querySelector('#deltaNextTriggers');
  if (triggersEl && delta.nextTriggersDetail && Array.isArray(delta.nextTriggersDetail)) {
    // Filter out empty triggers (entries with missing or placeholder values)
    const validTriggers = delta.nextTriggersDetail.filter(trigger => {
      const condition = trigger.condition || trigger.CONDITION || '';
      const effect = trigger.effect || trigger.EFFECT || '';
      // Skip if both are empty, or if they contain placeholder text
      return condition && effect && 
             condition !== 'N/A' && effect !== 'N/A' &&
             condition !== 'CONDITION' && effect !== 'EFFECT';
    });

    // Only render table rows if we have valid triggers
    if (validTriggers.length > 0) {
      const rowsHTML = validTriggers.map(trigger => {
        const condition = trigger.condition || trigger.CONDITION;
        const effect = trigger.effect || trigger.EFFECT;
        return `
          <tr>
            <td><strong>${condition}</strong></td>
            <td>${effect}</td>
          </tr>
        `;
      }).join('');
      triggersEl.innerHTML = rowsHTML;
    } else {
      triggersEl.innerHTML = '<tr><td colspan="2" style="color: var(--text-secondary); font-size: 0.9rem; text-align: center;">No triggers available</td></tr>';
    }
  }
}

/**
 * Update Delta stress scores with dynamic colors
 * @param {Object} delta - Delta data object
 */
function updateDeltaStressScores(delta) {
  const scores = [
    { key: 'breadth', id: 'deltaBreadthScore' },
    { key: 'liquidity', id: 'deltaLiquidityScore' },
    { key: 'volatility', id: 'deltaVolatilityScore' },
    { key: 'leadership', id: 'deltaLeadershipScore' }
  ];
  
  scores.forEach(score => {
    const el = document.querySelector(`#${score.id}`);
    if (el && delta[score.key] !== undefined && delta[score.key] !== null) {
      const value = delta[score.key];
      const emoji = getStressEmoji(value);
      let colorClass = 'green';
      if (value === 2) colorClass = 'orange';
      else if (value === 1) colorClass = 'yellow';
      
      el.innerHTML = `<span class="stress-circle ${colorClass}">${value}</span>`;
    }
  });
}

/**
 * Format domain name from API key to display name
 * @param {string} key - Domain key from API (e.g., 'credit_liquidity')
 * @returns {string} - Formatted display name (e.g., 'Credit Liquidity')
 */
function formatDomainName(key) {
  const domainMap = {
    'breadth': 'Breadth',
    'sentiment': 'Sentiment',
    'leadership': 'Leadership',
    'volatility': 'Volatility',
    'macro_trend': 'Macro Trend',
    'credit_liquidity': 'Credit Liquidity'
  };
  
  return domainMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Show loading state
 */
function showLoading() {
  const loadingEl = document.querySelector('#loadingIndicator');
  if (loadingEl) {
    loadingEl.style.display = 'block';
  }
  
  // Add loading class to body
  document.body.classList.add('loading');
}

/**
 * Hide loading state
 */
function hideLoading() {
  const loadingEl = document.querySelector('#loadingIndicator');
  if (loadingEl) {
    loadingEl.style.display = 'none';
  }
  
  // Remove loading class from body
  document.body.classList.remove('loading');
}

/**
 * Update last updated time display
 * @param {string} updatedAt - ISO 8601 timestamp
 */
function updateLastUpdatedTime(updatedAt) {
  const lastUpdatedEl = document.querySelector('#lastUpdated');
  if (!lastUpdatedEl) return;
  
  try {
    const date = new Date(updatedAt);
    const dateStr = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'America/New_York'
    });
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZone: 'America/New_York',
      timeZoneName: 'short'
    });
    lastUpdatedEl.textContent = `Last Updated: ${dateStr} at ${timeStr}`;
  } catch (error) {
    console.error('Failed to format updatedAt:', error);
    lastUpdatedEl.textContent = 'Last Updated: Unknown';
  }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
  // Check if error banner already exists
  let errorBanner = document.querySelector('#errorBanner');
  
  if (!errorBanner) {
    errorBanner = document.createElement('div');
    errorBanner.id = 'errorBanner';
    errorBanner.className = 'error-banner';
    document.body.prepend(errorBanner);
  }
  
  errorBanner.textContent = message;
  errorBanner.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    errorBanner.style.display = 'none';
  }, 5000);
}

/**
 * Initialize portal on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('CycleScope Portal initializing...');
  updatePortal();
  
  // Auto-refresh every 5 minutes (optional)
  // setInterval(updatePortal, 5 * 60 * 1000);
});

