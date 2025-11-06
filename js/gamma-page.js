// Gamma Page - Dynamic Data Loading
// This script fetches data from the API and populates the Gamma page

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

function updateGammaLayer1(gamma) {
    if (!gamma) return;
    
    // Update week of date
    const weekOfEl = document.querySelector('#gammaWeekOf');
    if (weekOfEl && gamma.asOfDate) {
        weekOfEl.textContent = new Date(gamma.asOfDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    }
    
    // Update cycle stage
    const cycleStageEl = document.querySelector('#gammaCycleStage');
    if (cycleStageEl && gamma.cycleStage) {
        cycleStageEl.textContent = gamma.cycleStage;
    }
    
    // Update macro posture
    const postureEl = document.querySelector('#gammaMacroPosture');
    if (postureEl && gamma.macroPosture) {
        postureEl.textContent = gamma.macroPosture;
        // Update color based on posture
        const postureColors = {
            'Bullish': 'var(--green)',
            'Caution': 'var(--yellow)',
            'Defensive': 'var(--orange)',
            'Risk-Off': 'var(--red)'
        };
        postureEl.style.color = postureColors[gamma.macroPosture] || 'var(--text-primary)';
    }
}

function updateGammaLayer2(gamma) {
    if (!gamma || !gamma.domainDetails) return;
    
    // Update overall summary
    const summaryEl = document.querySelector('.gamma-overall-summary');
    if (summaryEl && gamma.overallSummary) {
        summaryEl.textContent = gamma.overallSummary;
    }
    
    // Update domain details
    const domainDetailsContainer = document.querySelector('.gamma-domain-details');
    if (domainDetailsContainer && Array.isArray(gamma.domainDetails)) {
        // Clear existing content
        domainDetailsContainer.innerHTML = '';
        
        // Add each domain
        gamma.domainDetails.forEach(domain => {
            const domainEl = document.createElement('div');
            domainEl.className = 'domain-analysis';
            
            // Add color based on status
            const statusColors = {
                'Bullish': 'green',
                'Supportive': 'green',
                'Neutral': 'yellow',
                'Caution': 'yellow',
                'Risk': 'red',
                'Stress': 'red'
            };
            
            const colorClass = Object.keys(statusColors).find(key => 
                domain.status && domain.status.includes(key)
            );
            if (colorClass) {
                domainEl.classList.add(statusColors[colorClass]);
            }
            
            domainEl.innerHTML = `
                <h3>${domain.name}</h3>
                ${domain.summary ? `<p><strong>Summary:</strong> ${domain.summary}</p>` : ''}
                ${domain.observations ? `<p><strong>Observations:</strong> ${domain.observations}</p>` : ''}
                ${domain.interpretation ? `<p><strong>Interpretation:</strong> ${domain.interpretation}</p>` : ''}
            `;
            
            domainDetailsContainer.appendChild(domainEl);
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    const data = await fetchLatestAnalysis();
    
    if (data && data.gamma) {
        updateGammaLayer1(data.gamma);
        updateGammaLayer2(data.gamma);
    } else {
        console.error('No Gamma data available');
    }
});

