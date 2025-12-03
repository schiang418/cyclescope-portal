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
    // Update date - use updated_at (actual completion date)
    const date = new Date(newsletter.updated_at || newsletter.updatedAt);
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

    // Group newsletters by month and week
    const grouped = groupByMonthAndWeek(newsletters);
    
    archiveList.innerHTML = '';

    // Render each month
    Object.keys(grouped).forEach((monthKey, index) => {
        const monthData = grouped[monthKey];
        const monthDiv = document.createElement('div');
        monthDiv.className = 'archive-month';
        if (index > 0) monthDiv.classList.add('collapsed'); // Collapse all except current month
        
        // Month header
        const monthHeader = document.createElement('div');
        monthHeader.className = 'archive-month-header';
        monthHeader.innerHTML = `
            <span class="archive-month-icon">▼</span>
            <span class="archive-month-title">${monthData.label}</span>
            <span class="archive-month-count">${monthData.count}</span>
        `;
        monthHeader.onclick = () => monthDiv.classList.toggle('collapsed');
        monthDiv.appendChild(monthHeader);
        
        // Weeks container
        const weeksDiv = document.createElement('div');
        weeksDiv.className = 'archive-weeks';
        
        // Render each week
        Object.keys(monthData.weeks).forEach(weekKey => {
            const weekData = monthData.weeks[weekKey];
            const weekDiv = document.createElement('div');
            weekDiv.className = 'archive-week';
            
            // Week header
            const weekHeader = document.createElement('div');
            weekHeader.className = 'archive-week-header';
            weekHeader.textContent = weekData.label;
            weekDiv.appendChild(weekHeader);
            
            // Week items
            const weekItems = document.createElement('div');
            weekItems.className = 'archive-week-items';
            
            weekData.newsletters.forEach(newsletter => {
                const date = new Date(newsletter.publishDate || newsletter.publish_date);
                const archiveItem = document.createElement('div');
                archiveItem.className = 'archive-item';
                archiveItem.innerHTML = `
                    <div class="archive-weekday">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div class="archive-date">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    <div class="archive-title">${newsletter.title}</div>
                    <button class="archive-view-btn" onclick="loadNewsletterByDate('${newsletter.publish_date || newsletter.publishDate}')">View</button>
                `;
                weekItems.appendChild(archiveItem);
            });
            
            weekDiv.appendChild(weekItems);
            weeksDiv.appendChild(weekDiv);
        });
        
        monthDiv.appendChild(weeksDiv);
        archiveList.appendChild(monthDiv);
    });
}

// Group newsletters by month and week
function groupByMonthAndWeek(newsletters) {
    const grouped = {};
    
    newsletters.forEach(newsletter => {
        const date = new Date(newsletter.publishDate || newsletter.publish_date);
        const year = date.getFullYear();
        const month = date.getMonth();
        
        // Month key: YYYY-MM
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        
        // Get week of month (1-5)
        const dayOfMonth = date.getDate();
        const weekOfMonth = Math.ceil(dayOfMonth / 7);
        const weekKey = `week-${weekOfMonth}`;
        
        // Initialize month if not exists
        if (!grouped[monthKey]) {
            grouped[monthKey] = {
                label: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
                count: 0,
                weeks: {}
            };
        }
        
        // Initialize week if not exists
        if (!grouped[monthKey].weeks[weekKey]) {
            const weekStart = new Date(year, month, (weekOfMonth - 1) * 7 + 1);
            const weekEnd = new Date(year, month, Math.min(weekOfMonth * 7, new Date(year, month + 1, 0).getDate()));
            grouped[monthKey].weeks[weekKey] = {
                label: `Week ${weekOfMonth} (${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
                newsletters: []
            };
        }
        
        // Add newsletter to week
        grouped[monthKey].weeks[weekKey].newsletters.push(newsletter);
        grouped[monthKey].count++;
    });
    
    // Sort newsletters within each week by date (newest first)
    Object.values(grouped).forEach(monthData => {
        Object.values(monthData.weeks).forEach(weekData => {
            weekData.newsletters.sort((a, b) => {
                const dateA = new Date(a.publishDate || a.publish_date);
                const dateB = new Date(b.publishDate || b.publish_date);
                return dateB - dateA;
            });
        });
    });
    
    return grouped;
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
