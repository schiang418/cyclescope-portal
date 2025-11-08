// Fusion Page - Dynamic Data Loading
// This script fetches data from the API and populates the Fusion page

const API_BASE_URL = 'https://cyclescope-api-production.up.railway.app';

async function fetchLatestAnalysis() {
    try {
        const url = `${API_BASE_URL}/api/trpc/analysis.latest?batch=1&input=%7B%7D`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data[0] && data[0].result && data[0].result.data) {
            return data[0].result.data;
        }
        throw new Error('Invalid API response structure');
    } catch (error) {
        console.error('Failed to fetch analysis data:', error);
        return null;
    }
}

function updateFusionLayer1(fusion, delta) {
    if (!fusion) return;
    
    // Update phase
    const phaseEl = document.querySelector('#fusionPhase');
    if (phaseEl && delta && delta.phaseUsed) {
        phaseEl.textContent = delta.phaseUsed;
    }
    
    // Update fragility
    const fragilityEl = document.querySelector('#fusionFragility');
    if (fragilityEl && delta) {
        fragilityEl.textContent = `${delta.fragilityColor} ${delta.fragilityLabel}`;
        fragilityEl.className = `fragility-badge ${delta.fragilityColor.toLowerCase()}`;
    }
    
    // Update guidance
    const guidanceEl = document.querySelector('#fusionGuidance');
    if (guidanceEl && fusion.guidanceLabel) {
        guidanceEl.textContent = fusion.guidanceLabel;
    }
}

function updateFusionLayer2(fusion) {
    if (!fusion) return;
    
    // Update summary
    const summaryEl = document.querySelector('.fusion-summary');
    if (summaryEl && fusion.narrativeSummary) {
        summaryEl.textContent = fusion.narrativeSummary;
    }
    
    // Update guidance list
    const guidanceListEl = document.querySelector('.fusion-guidance-list');
    if (guidanceListEl && fusion.guidanceBullets) {
        // Parse JSON array if it's a string
        const guidancePoints = typeof fusion.guidanceBullets === 'string'
            ? JSON.parse(fusion.guidanceBullets)
            : fusion.guidanceBullets;
        if (Array.isArray(guidancePoints)) {
            guidanceListEl.innerHTML = guidancePoints
                .map(point => `<li>${point}</li>`)
                .join('');
        }
    }
    
    // Update close message
    const closeEl = document.querySelector('.fusion-close');
    if (closeEl && fusion.watchCommentary) {
        closeEl.textContent = fusion.watchCommentary;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    const data = await fetchLatestAnalysis();
    
    if (data) {
        updateFusionLayer1(data.fusion, data.delta);
        updateFusionLayer2(data.fusion);
    } else {
        console.error('No Fusion data available');
    }
});

