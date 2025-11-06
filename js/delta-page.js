/**
 * Delta Page Data Population
 * Fetches data from API and populates Delta Layer 1 and Layer 2 content
 */

const API_BASE_URL = 'https://cyclescope-api-production.up.railway.app';

// Fetch latest analysis data from API
async function fetchLatestAnalysis() {
    try {
        const url = `${API_BASE_URL}/api/trpc/analysis.latest?batch=1&input=%7B%7D`;
        const response = await fetch(url);
        const json = await response.json();
        
        if (json && json[0] && json[0].result && json[0].result.data) {
            return json[0].result.data;
        }
        throw new Error('Invalid API response structure');
    } catch (error) {
        console.error('Error fetching analysis data:', error);
        return null;
    }
}

// Populate Delta Layer 1 content
function populateDeltaLayer1(data) {
    if (!data || !data.delta) {
        console.error('No delta data available');
        return;
    }

    const delta = data.delta;
    
    // Update fragility badge
    const fragilityBadge = document.querySelector('#layer1 .status-badge');
    if (fragilityBadge && delta.fragilityColor && delta.fragilityLabel) {
        const colorClass = delta.fragilityColor.toLowerCase();
        fragilityBadge.className = `status-badge ${colorClass}`;
        fragilityBadge.innerHTML = `
            <span class="status-emoji" style="font-size: 2.5rem;">${getFragilityEmoji(delta.fragilityColor)}</span>
            <div style="display: flex; flex-direction: column; align-items: flex-start;">
                <span>${delta.fragilityColor.toUpperCase()}</span>
                <span style="font-size: 0.9rem; font-weight: 400;">${delta.fragilityLabel}</span>
            </div>
        `;
    }

    // Update Market Pattern
    const patternValue = document.querySelector('#layer1 .info-row:nth-of-type(1) .info-value');
    if (patternValue && delta.patternPlain && delta.templateName) {
        patternValue.innerHTML = `${delta.patternPlain} <span style="color: var(--text-muted);">(${delta.templateName})</span>`;
    }

    // Update Posture
    const postureValue = document.querySelector('#layer1 .info-row:nth-of-type(2) .info-value');
    if (postureValue && delta.postureLabel) {
        const postureColor = getPostureColor(delta.postureLabel);
        postureValue.innerHTML = `<span style="font-weight: 700; color: ${postureColor};">${delta.postureLabel}</span>`;
    }

    // Update headline summary
    const headlineSummary = document.querySelector('#layer1 .card-content > p');
    if (headlineSummary && delta.headlineSummary) {
        headlineSummary.textContent = delta.headlineSummary;
    }

    // Update Key Drivers
    const keyDriversList = document.querySelector('#layer1 .key-drivers ul');
    if (keyDriversList && delta.keyDrivers && delta.keyDrivers.length > 0) {
        keyDriversList.innerHTML = delta.keyDrivers.map(driver => `<li>${driver}</li>`).join('');
    }

    // Update Next to Watch
    const nextWatchText = document.querySelector('#layer1 .next-watch p');
    if (nextWatchText && delta.nextWatchDisplay) {
        nextWatchText.textContent = delta.nextWatchDisplay;
    }
}

// Populate Delta Layer 2 content
function populateDeltaLayer2(data) {
    if (!data || !data.fullAnalysis || !data.fullAnalysis.delta || !data.fullAnalysis.delta.level2) {
        console.error('No delta level2 data available');
        return;
    }

    const level2 = data.fullAnalysis.delta.level2;

    // Update Phase badge
    const phaseBadge = document.querySelector('#deltaPhaseUsed');
    if (phaseBadge && level2.phaseUsed) {
        phaseBadge.textContent = level2.phaseUsed;
    }

    // Update Template Name badge
    const templateBadge = document.querySelector('#deltaTemplateName');
    if (templateBadge && level2.templateName) {
        templateBadge.textContent = level2.templateName;
    }

    // Update Confidence badge
    const confidenceBadge = document.querySelector('#deltaConfidence');
    if (confidenceBadge && level2.confidence) {
        confidenceBadge.textContent = level2.confidence;
    }

    // Update Fragility Score badge
    const fragilityScoreBadge = document.querySelector('#deltaFragilityScore');
    if (fragilityScoreBadge && level2.fragilityScore !== undefined) {
        fragilityScoreBadge.textContent = `${level2.fragilityScore} / 8`;
    }

    // Update Current Fragility
    const currentFragility = document.querySelector('#deltaCurrentFragility');
    if (currentFragility && level2.fragilityColor && level2.fragilityLabel) {
        currentFragility.innerHTML = `${level2.fragilityColor.toUpperCase()} — ${level2.fragilityLabel}`;
        currentFragility.style.color = getFragilityColorCode(level2.fragilityColor);
    }

    // Update Dimension Stress table
    if (level2.dimensions && level2.dimensions.length > 0) {
        const tbody = document.querySelector('#layer2 .data-table tbody');
        if (tbody) {
            tbody.innerHTML = level2.dimensions.map(dim => `
                <tr>
                    <td>${dim.name}</td>
                    <td>
                        <span class="stress-badge stress-${dim.stress}">${dim.stress}</span>
                    </td>
                    <td>${dim.commentary || ''}</td>
                </tr>
            `).join('');
        }
    }

    // Update Rationale
    const rationaleList = document.querySelector('#layer2 .rationale ul');
    if (rationaleList && level2.rationale && level2.rationale.length > 0) {
        rationaleList.innerHTML = level2.rationale.map(item => `<li>${item}</li>`).join('');
    }

    // Update Plain-English Summary
    const plainEnglishText = document.querySelector('#layer2 .plain-english p:first-of-type');
    if (plainEnglishText && level2.plainEnglish) {
        plainEnglishText.textContent = level2.plainEnglish;
    }

    // Update defensive guidance
    const defensiveGuidance = document.querySelector('#layer2 .plain-english p:last-of-type');
    if (defensiveGuidance && level2.defensiveGuidance) {
        defensiveGuidance.textContent = level2.defensiveGuidance;
    }
}

// Helper functions
function getFragilityEmoji(color) {
    const emojiMap = {
        'GREEN': '🟢',
        'YELLOW': '🟡',
        'ORANGE': '🟠',
        'RED': '🔴'
    };
    return emojiMap[color.toUpperCase()] || '⚪';
}

function getFragilityColorCode(color) {
    const colorMap = {
        'GREEN': 'var(--green)',
        'YELLOW': 'var(--yellow)',
        'ORANGE': 'var(--orange)',
        'RED': 'var(--red)'
    };
    return colorMap[color.toUpperCase()] || 'var(--text-primary)';
}

function getPostureColor(posture) {
    if (posture.toLowerCase().includes('defensive')) return 'var(--orange)';
    if (posture.toLowerCase().includes('aggressive')) return 'var(--green)';
    return 'var(--text-primary)';
}

// Initialize page
async function initDeltaPage() {
    console.log('Initializing Delta page...');
    const data = await fetchLatestAnalysis();
    
    if (data) {
        populateDeltaLayer1(data);
        populateDeltaLayer2(data);
        console.log('Delta page populated with API data');
    } else {
        console.error('Failed to load analysis data');
    }
}

// Run on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDeltaPage);
} else {
    initDeltaPage();
}

