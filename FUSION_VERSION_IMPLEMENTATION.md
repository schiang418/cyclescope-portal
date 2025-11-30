# FUSION_VERSION Implementation Guide

## Overview

The `FUSION_VERSION` environment variable allows cyclescope-portal to switch between two different Fusion display implementations:

- **v1** (default): Existing Fusion display using Gamma + Delta synthesis
- **v2**: New implementation using Secular Assistant analysis from cyclescope-secular backend

## Environment Variable

### Setting FUSION_VERSION

**Local Development:**
```bash
# In .env file
FUSION_VERSION=v2
API_BASE_URL=https://cyclescope-secular-production.up.railway.app
```

**Railway Deployment:**
1. Go to Railway project settings
2. Add environment variable:
   - Name: `FUSION_VERSION`
   - Value: `v1` or `v2`
3. Add API base URL:
   - Name: `API_BASE_URL`
   - Value: `https://cyclescope-secular-production.up.railway.app`

## Architecture

### File Structure

```
cyclescope-portal/
├── server.js                          # Express server with /api/config endpoint
├── .env                               # Local environment variables
├── .env.example                       # Environment variable template
├── js/
│   ├── config-loader.js              # Client-side config loader
│   ├── secular-api-client.js         # Secular API client
│   ├── update-fusion-v2.js           # Fusion V2 display logic
│   ├── api-client.js                 # Existing API client (V1)
│   └── update-portal.js              # Main portal updater (modified)
└── index.html                         # Main portal page
```

### Data Flow

**V1 Mode (FUSION_VERSION=v1):**
```
index.html → update-portal.js → api-client.js → Existing API
                               ↓
                         updateFusionSection(data)
```

**V2 Mode (FUSION_VERSION=v2):**
```
index.html → update-portal.js → secular-api-client.js → cyclescope-secular API
                               ↓
                         updateFusionSectionV2()
                               ↓
                         update-fusion-v2.js
```

## Fusion V2 Display Structure

### Layer 1

**Fields Displayed:**
1. **Secular Trend** (🔼)
   - Source: `secular_trend` from DB
   - Example: "Upward"

2. **Recent Behavior** (📊)
   - Paragraph 1: `recent_behavior_summary` from DB
   - Paragraph 2: `interpretation` from DB

3. **Risk Bias** (⚠️)
   - Source: `risk_bias` from DB
   - Example: "Moderate upward bias with caution for potential corrections."

**Styling:**
- Neutral color scheme (no color-coding)
- All sections use `var(--bg-secondary)` background
- Recent Behavior has blue left border for emphasis

### Layer 2

**Structure:**

1. **📈 S&P 500 Monthly Chart** (Top)
   - Gemini annotated chart from latest date folder
   - Source: `/data/{date}/annotated_chart.png`

2. **📊 Scenarios** (3-4 scenario cards)
   Each scenario includes:
   - **Scenario Name**: `scenario{id}_name`
   - **Probability**: `scenario{id}_probability` (blue badge, top-right)
   - **Path Summary**: `scenario{id}_path_summary` + `scenario{id}_technical_logic`
   - **Target Zone**: `scenario{id}_target_zone` + `scenario{id}_expected_move_min/max`
   - **Risk Profile**: `scenario{id}_risk_profile`

3. **📝 Secular Summary** (Bottom, gold border)
   - Combined: `overall_bias` + `secular_summary`

## API Integration

### Secular API Endpoints

**Base URL:** `https://cyclescope-secular-production.up.railway.app`

**Endpoints:**
- `GET /analysis/latest` - Get latest secular analysis
- `GET /data/{date}/annotated_chart.png` - Get annotated chart
- `GET /data/{date}/original_chart.png` - Get original chart

### API Response Structure

```json
{
  "success": true,
  "analysis": {
    "secular_trend": "Upward",
    "recent_behavior_summary": "...",
    "interpretation": "...",
    "risk_bias": "...",
    "scenario1_name": "Midline Reversion",
    "scenario1_probability": "0.5000",
    "scenario1_path_summary": "...",
    "scenario1_technical_logic": "...",
    "scenario1_target_zone": "...",
    "scenario1_expected_move_min": "-10.00",
    "scenario1_expected_move_max": "-18.00",
    "scenario1_risk_profile": "...",
    // ... scenario2, scenario3, scenario4
    "overall_bias": "...",
    "secular_summary": "...",
    "annotated_chart_url": "/data/2025-11-30/annotated_chart.png"
  },
  "timestamp": "2025-11-30T10:54:37.435Z"
}
```

## Testing

### Local Testing

1. **Start the portal server:**
   ```bash
   cd cyclescope-portal
   FUSION_VERSION=v2 node server.js
   ```

2. **Access test pages:**
   - Layer 1: `http://localhost:3000/test-fusion-v2.html`
   - Layer 2: `http://localhost:3000/test-fusion-v2-layer2.html`
   - Full portal: `http://localhost:3000/`

3. **Switch to V1:**
   ```bash
   FUSION_VERSION=v1 node server.js
   ```

### Verify Configuration

**Check config endpoint:**
```bash
curl http://localhost:3000/api/config
```

**Expected response:**
```json
{
  "FUSION_VERSION": "v2",
  "API_BASE_URL": "https://cyclescope-secular-production.up.railway.app"
}
```

## Deployment

### Railway Deployment Steps

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add FUSION_VERSION support"
   git push origin main
   ```

2. **Set Environment Variables in Railway:**
   - `FUSION_VERSION=v2`
   - `API_BASE_URL=https://cyclescope-secular-production.up.railway.app`

3. **Deploy:**
   - Railway will auto-deploy from GitHub
   - Verify deployment at your Railway URL

4. **Verify:**
   ```bash
   curl https://your-portal.railway.app/api/config
   ```

## Troubleshooting

### Issue: Fusion V2 not loading

**Check:**
1. Verify `FUSION_VERSION=v2` is set
2. Check browser console for errors
3. Verify secular API is accessible:
   ```bash
   curl https://cyclescope-secular-production.up.railway.app/analysis/latest
   ```

### Issue: Chart not displaying

**Check:**
1. Verify annotated chart URL is correct
2. Check network tab for 404 errors
3. Fallback to original chart if annotation fails

### Issue: V1 still showing instead of V2

**Check:**
1. Clear browser cache
2. Verify `/api/config` returns `FUSION_VERSION: "v2"`
3. Check browser console for config loading errors

## Migration Path

### Gradual Rollout

1. **Phase 1: Testing**
   - Deploy with `FUSION_VERSION=v1` (default)
   - Test V2 on staging environment

2. **Phase 2: Soft Launch**
   - Switch to `FUSION_VERSION=v2` for selected users
   - Monitor for issues

3. **Phase 3: Full Rollout**
   - Set `FUSION_VERSION=v2` as default
   - Keep V1 available for rollback

### Rollback Plan

If issues occur with V2:
```bash
# In Railway settings, change:
FUSION_VERSION=v1
```

Portal will immediately switch back to V1 display.

## Future Enhancements

- [ ] Add UI toggle for users to switch between V1 and V2
- [ ] Add loading states for chart images
- [ ] Implement caching for secular analysis data
- [ ] Add error boundaries for V2 display
- [ ] Create admin panel to manage FUSION_VERSION

## Support

For issues or questions:
- GitHub Issues: [cyclescope-portal repository]
- Documentation: This file
- API Status: Check cyclescope-secular health endpoint
