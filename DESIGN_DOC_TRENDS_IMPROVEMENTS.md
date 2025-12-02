# Trends Page Improvements - Design Document

## Overview
This document describes the comprehensive improvements made to the Trends Analysis page, including the addition of S&P 500 price data, chart alignment, and enhanced user experience features.

## Date
December 2, 2025

## Objectives
1. Add S&P 500 price trend visualization
2. Align all three charts (SPX, Gamma, Fragility) horizontally by date
3. Improve visual consistency and user experience
4. Add interactive tooltip for SPX price data

## Implementation

### 1. Backend Changes

#### 1.1 SPX Data API Endpoint (`server.js`)
Added new API endpoint `/api/spx-prices` that:
- Accepts `days` query parameter (default: 30)
- Executes Python script to fetch Yahoo Finance data via Manus Data API
- Returns JSON array of {date, price} objects
- Only includes market trading days (weekends/holidays filtered)

```javascript
app.get('/api/spx-prices', async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const { exec } = require('child_process');
  
  exec(`python3 ${__dirname}/fetch_spx_data.py ${days}`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const result = JSON.parse(stdout);
    res.json(result);
  });
});
```

#### 1.2 Python Data Fetcher (`fetch_spx_data.py`)
Created Python script that:
- Uses Manus Data API to access Yahoo Finance
- Fetches S&P 500 (^GSPC) historical prices
- Filters out null values
- Returns most recent N trading days
- Timestamps must be strings for API compatibility

### 2. Frontend Changes

#### 2.1 HTML Structure
Added SPX chart container before Gamma chart:
```html
<div class="trend-chart" id="spxChart">
  <h3>S&P 500 Price Trend (Last <span id="spxDays">30</span> Days)
    <span id="spxLatestDate" class="latest-date"></span>
  </h3>
  <div class="chart-area">
    <div class="y-axis" id="spxYAxis"></div>
    <div class="chart-container">
      <div class="data-points" id="spxDataPoints"></div>
    </div>
  </div>
</div>

<div id="customTooltip" class="custom-tooltip"></div>
```

#### 2.2 CSS Improvements

**Alignment fixes:**
- Set `.y-axis` width to 120px (matching `.domain-label`)
- Added `gap: 1rem` to `.domain-row` (matching `.chart-area`)
- Removed padding from all data containers
- Used `flex: 1` for all circle containers

**SPX chart styles:**
```css
#spxDataPoints {
  display: flex;
  align-items: center;
  height: 200px;
  position: relative;
}

.spx-point {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.spx-point:hover {
  transform: scale(1.2);
}
```

**Tooltip styles:**
```css
.custom-tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 1000;
}

.custom-tooltip.show {
  opacity: 1;
}
```

#### 2.3 JavaScript Functions

**fetchSPXPrices():**
```javascript
async function fetchSPXPrices(days) {
  const response = await fetch(`/api/spx-prices?days=${days}`);
  const data = await response.json();
  return data.prices || [];
}
```

**renderSPXTrend():**
- Calculates dynamic Y-axis range (500-point window)
- Creates data point circles with hover effects
- Adds data attributes for tooltip
- Displays latest date in title

**Date Alignment Logic in loadTrendAnalysis():**
```javascript
// Extract dates from both sources
const spxDates = new Set(spxPrices.map(p => p.date));
const historyDates = new Set(history.map(h => h.date));

// Find common dates (intersection)
const commonDates = [...spxDates].filter(d => historyDates.has(d)).sort();

// Filter both datasets to only include common dates
const alignedSPX = spxPrices.filter(p => commonDates.includes(p.date));
const alignedHistory = history.filter(h => commonDates.includes(h.date));
```

**Tooltip Event Listeners:**
```javascript
document.addEventListener('mouseenter', (e) => {
  if (e.target.classList.contains('spx-point')) {
    const date = e.target.dataset.date;
    const price = e.target.dataset.price;
    tooltip.textContent = `${formatDate(date)}: $${price}`;
    tooltip.classList.add('show');
  }
}, true);

document.addEventListener('mousemove', (e) => {
  if (tooltip.classList.contains('show')) {
    tooltip.style.left = (e.clientX + 10) + 'px';
    tooltip.style.top = (e.clientY - 30) + 'px';
  }
});

document.addEventListener('mouseleave', (e) => {
  if (e.target.classList.contains('spx-point')) {
    tooltip.classList.remove('show');
  }
}, true);
```

### 3. Key Technical Decisions

#### 3.1 Date Alignment Strategy
**Approach:** Use intersection of SPX and history dates
- **Rationale:** Ensures all three charts show data for the same trading days
- **Trade-off:** May exclude recent days if SPX data is delayed
- **Benefit:** Perfect horizontal alignment across all charts

#### 3.2 Y-Axis Standardization
**Decision:** Set all Y-axes to 120px width
- **Rationale:** Matches domain label width in Gamma chart
- **Benefit:** Consistent left margin across all charts

#### 3.3 Gap Standardization
**Decision:** Use 1rem gap between Y-axis and data container
- **Rationale:** Provides visual breathing room
- **Benefit:** Aligns data containers at same horizontal position

#### 3.4 Data Source
**Decision:** Use Manus Data API instead of direct Yahoo Finance
- **Rationale:** Avoids rate limiting (429 errors)
- **Benefit:** Reliable, consistent data access
- **Implementation:** Python script as bridge between Node.js and Manus API

### 4. Visual Design

#### 4.1 Color Scheme
- **SPX circles:** Blue (#4A9EFF) - represents market data
- **Gamma circles:** Traffic light system (🟢🟡🟠🔴)
- **Fragility circles:** Severity-based (🟡🟠🔴)

#### 4.2 Layout
- **Vertical stacking:** SPX → Gamma → Fragility
- **Consistent spacing:** 2rem between charts
- **Title alignment:** Left-aligned with right-side metadata

#### 4.3 Interactive Elements
- **Hover effect:** Scale(1.2) on SPX circles
- **Tooltip:** Black semi-transparent background, white text
- **Smooth transitions:** 0.2s for all animations

### 5. Data Flow

```
User Request
    ↓
Frontend: loadTrendAnalysis()
    ↓
Parallel Fetch:
    ├─ /api/spx-prices → Python script → Manus Data API → Yahoo Finance
    └─ /api/trend-history → Database
    ↓
Date Alignment (intersection)
    ↓
Render Three Charts:
    ├─ renderSPXTrend()
    ├─ renderGammaDomainTrends()
    └─ renderFragilityTrend()
    ↓
Display Aligned Charts
```

### 6. Testing Results

✅ **Functionality Tests:**
- SPX API returns correct data for 5/30/60/90 days
- Date alignment produces correct intersection
- All three charts render with same number of data points
- Tooltip displays correct date and price on hover

✅ **Visual Tests:**
- Container widths match (944px for all three)
- Container left positions match (228px for all three)
- Circles align vertically across charts
- Y-axis labels are readable and properly positioned

✅ **Browser Tests:**
- Chrome: ✅ All features working
- Responsive design: ✅ Adapts to viewport

### 7. Performance Considerations

- **API Caching:** Consider adding Redis cache for SPX data (updates once per day)
- **Lazy Loading:** Charts render on-demand when tab is selected
- **Data Limits:** Maximum 90 days to keep response size manageable

### 8. Future Enhancements

1. **Interactive Date Range Selector:** Allow custom date ranges
2. **Export Functionality:** Download chart data as CSV
3. **Comparison Mode:** Overlay multiple time periods
4. **Mobile Optimization:** Touch-friendly tooltips
5. **Real-time Updates:** WebSocket for live price updates during market hours

### 9. Known Limitations

1. **Weekend/Holiday Data:** SPX has no data for non-trading days, so recent days may be missing if market is closed
2. **Data Delay:** Yahoo Finance data may lag by 15-20 minutes during trading hours
3. **Historical Limit:** Yahoo Finance API typically provides 5+ years of data, but we limit to 90 days for performance

### 10. Maintenance Notes

- **Python Script Location:** `/home/ubuntu/cyclescope-portal/fetch_spx_data.py`
- **API Endpoint:** `/api/spx-prices` in `server.js`
- **Frontend Code:** `trends.html` lines 400-700 (approximate)
- **Dependencies:** Requires `data_api` module from Manus runtime

### 11. Deployment Checklist

- [x] Python script executable and tested
- [x] Node.js dependencies installed (dotenv)
- [x] API endpoint tested with curl
- [x] Frontend tested in browser
- [x] All three charts aligned
- [x] Tooltip functionality verified
- [x] Git commit created
- [ ] Pushed to GitHub
- [ ] Production deployment

## Conclusion

The Trends page improvements successfully add S&P 500 price visualization while maintaining perfect alignment with existing Gamma and Fragility charts. The implementation uses reliable data sources (Manus Data API), follows consistent design patterns, and provides an enhanced user experience through interactive tooltips.

**Key Achievement:** All three charts now display synchronized data for the same trading days, making it easy to correlate market price movements with gamma exposure and market fragility.
