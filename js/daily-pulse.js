// Daily Market Pulse - Frontend Logic
// API Base URL
const API_BASE_URL = 'https://cyclescope-daily-pulse-production.up.railway.app/api';

// State
let currentNewsletter = null;
let audioElement = null;
let isPlaying = false;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Daily Pulse page loaded');
    initializeAudioPlayer();
    loadLatestNewsletter();
    loadArchive();
});

// Initialize Audio Player
function initializeAudioPlayer() {
    audioElement = document.getElementById('audioElement');
    const playPauseBtn = document.getElementById('playPauseBtn');
    
    if (!audioElement || !playPauseBtn) {
        console.error('Audio elements not found');
        return;
    }

    // Play/Pause button
    playPauseBtn.addEventListener('click', togglePlayPause);

    // Update time display
    audioElement.addEventListener('timeupdate', () => {
        if (audioElement.currentTime) {
            document.getElementById('currentTime').textContent = formatTime(audioElement.currentTime);
        }
    });

    audioElement.addEventListener('loadedmetadata', () => {
        document.getElementById('totalTime').textContent = formatTime(audioElement.duration);
    });

    // Handle audio end
    audioElement.addEventListener('ended', () => {
        isPlaying = false;
        updatePlayPauseButton();
        document.getElementById('currentTime').textContent = '0:00';
    });
}

// Toggle Play/Pause
function togglePlayPause() {
    if (!audioElement || !audioElement.src) {
        console.error('No audio loaded');
        return;
    }

    if (isPlaying) {
        audioElement.pause();
        isPlaying = false;
    } else {
        audioElement.play();
        isPlaying = true;
    }
    
    updatePlayPauseButton();
}

// Update Play/Pause Button UI
function updatePlayPauseButton() {
    const playIcon = document.querySelector('.play-icon');
    const pauseIcon = document.querySelector('.pause-icon');
    
    if (isPlaying) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'inline';
    } else {
        playIcon.style.display = 'inline';
        pauseIcon.style.display = 'none';
    }
}

// Progress bar removed - time updates handled in timeupdate listener

// Format time (seconds to MM:SS)
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Load Latest Newsletter
async function loadLatestNewsletter() {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/newsletter/latest`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const newsletter = data.newsletter || data;
        currentNewsletter = newsletter;
        
        displayNewsletter(newsletter);
        hideLoading();
        
    } catch (error) {
        console.error('Error loading newsletter:', error);
        showError(error.message);
    }
}

// Display Newsletter
function displayNewsletter(newsletter) {
    // Update date
    const date = new Date(newsletter.publish_date || newsletter.publishDate);
    document.getElementById('pulseDate').textContent = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Update title
    document.getElementById('pulseTitle').textContent = newsletter.title;

    // Update hook (now in header card)
    document.getElementById('pulseHook').textContent = newsletter.hook;

    // Update sections
    const sectionsContainer = document.getElementById('newsletterSections');
    sectionsContainer.innerHTML = '';
    
    newsletter.sections.forEach(section => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'newsletter-section';
        sectionDiv.innerHTML = `
            <h3>${section.heading}</h3>
            <p>${section.content}</p>
        `;
        sectionsContainer.appendChild(sectionDiv);
    });

    // Update conclusion
    document.getElementById('conclusionText').textContent = newsletter.conclusion;

    // Update sources
    displaySources(newsletter.sources || []);

    // Setup audio
    const audioUrl = newsletter.audio_url || newsletter.audioUrl;
    if (audioUrl) {
        audioElement.src = audioUrl;
        setupAudioDownload(audioUrl, newsletter.publish_date || newsletter.publishDate);
    }

    // Setup text download
    setupTextDownload(newsletter);



    // Show content
    document.getElementById('newsletterContent').style.display = 'block';
}

// Display Sources
function displaySources(sources) {
    const sourcesList = document.getElementById('sourcesList');
    const sourcesSection = document.getElementById('sourcesSection');
    
    if (!sources || sources.length === 0) {
        sourcesSection.style.display = 'none';
        return;
    }

    sourcesSection.style.display = 'block';
    sourcesList.innerHTML = '';

    sources.forEach((source, index) => {
        const sourceItem = document.createElement('a');
        sourceItem.className = 'source-item';
        sourceItem.href = source.url;
        sourceItem.target = '_blank';
        sourceItem.rel = 'noopener noreferrer';
        sourceItem.innerHTML = `
            <span class="source-number">${index + 1}</span>
            <span class="source-title">${source.title || 'Source'}</span>
            <span class="source-icon">↗</span>
        `;
        sourcesList.appendChild(sourceItem);
    });
}

// Load Archive
async function loadArchive() {
    try {
        const response = await fetch(`${API_BASE_URL}/newsletter/history?limit=365`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        displayArchive(data.newsletters || []);
        
    } catch (error) {
        console.error('Error loading archive:', error);
        document.getElementById('archiveList').innerHTML = '<p class="error-text">Failed to load archive</p>';
    }
}

// Display Archive
function displayArchive(newsletters) {
    const archiveList = document.getElementById('archiveList');
    
    if (!newsletters || newsletters.length === 0) {
        archiveList.innerHTML = '<p class="archive-empty">No historical newsletters available yet</p>';
        return;
    }

    archiveList.innerHTML = '';

    newsletters.forEach(newsletter => {
        const date = new Date(newsletter.publishDate);
        const archiveItem = document.createElement('div');
        archiveItem.className = 'archive-item';
        archiveItem.innerHTML = `
            <div class="archive-date">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            <div class="archive-title">${newsletter.title}</div>
            <button class="archive-view-btn" onclick="loadNewsletterByDate('${newsletter.publish_date || newsletter.publishDate}')">View</button>
        `;
        archiveList.appendChild(archiveItem);
    });
}

// Load Newsletter by Date
async function loadNewsletterByDate(date) {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/newsletter/${date}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const newsletter = data.newsletter || data;
        currentNewsletter = newsletter;
        
        displayNewsletter(newsletter);
        hideLoading();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error loading newsletter:', error);
        showError(error.message);
    }
}

// Show Loading State
function showLoading() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('errorState').style.display = 'none';
    document.getElementById('newsletterContent').style.display = 'none';
}

// Hide Loading State
function hideLoading() {
    document.getElementById('loadingState').style.display = 'none';
}

// Show Error State
function showError(message) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('newsletterContent').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
}

// Setup Audio Download
function setupAudioDownload(audioUrl, publishDate) {
    const downloadBtn = document.getElementById('downloadWav');
    
    // Simply set href and download attributes
    downloadBtn.href = audioUrl;
    downloadBtn.download = `daily-pulse-${publishDate}.wav`;
    
    // Remove onclick to let browser handle download naturally
    downloadBtn.onclick = null;
}

// Setup Text Download
function setupTextDownload(newsletter) {
    const downloadBtn = document.getElementById('downloadText');
    
    downloadBtn.onclick = (e) => {
        e.preventDefault();
        
        // Format newsletter as text
        const date = new Date(newsletter.publish_date || newsletter.publishDate);
        const dateStr = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        let textContent = `DAILY MARKET PULSE
${dateStr}
${'='.repeat(60)}

${newsletter.title}

${newsletter.hook}

`;
        
        // Add sections
        newsletter.sections.forEach(section => {
            textContent += `
${section.heading.toUpperCase()}
${'-'.repeat(60)}

${section.content}

`;
        });
        
        // Add conclusion
        textContent += `
LOOKING AHEAD
${'-'.repeat(60)}

${newsletter.conclusion}

`;
        
        // Add sources
        if (newsletter.sources && newsletter.sources.length > 0) {
            textContent += `
SOURCES
${'-'.repeat(60)}

`;
            newsletter.sources.forEach((source, index) => {
                textContent += `${index + 1}. ${source.title || 'Source'}\n   ${source.url}\n\n`;
            });
        }
        
        // Create blob and download
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `daily-pulse-${newsletter.publish_date || newsletter.publishDate}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
}
