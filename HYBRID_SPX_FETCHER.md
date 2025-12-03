# Hybrid SPX Data Fetcher

## Overview

This implementation combines **Yahoo Finance API** (fast, reliable) with **Gemini + Google Search** (multi-source verification) to provide the most accurate S&P 500 closing prices.

## Strategy

### Historical Data (> 1 day old)
- **Source**: Yahoo Finance API
- **Speed**: < 2 seconds
- **Reliability**: High
- **Verification**: Not needed (settled data)

### Latest Trading Day (0-1 days old)
- **Primary Source**: Yahoo Finance API
- **Verification**: Gemini + Google Search
- **Multi-source**: Cross-references Bloomberg, Morningstar, Investing.com, etc.
- **Fallback**: If Gemini unavailable, use Yahoo Finance data

## Files

### `fetch_spx_data_hybrid.py`
Main script that implements the hybrid fetching logic.

**Usage**:
```bash
python3 fetch_spx_data_hybrid.py <days>
```

**Environment Variables**:
- `GEMINI_API_KEY`: Google Gemini API key (required for verification)

**Output Format**:
```json
{
  "prices": [
    {
      "date": "2025-12-02",
      "price": 6829.37,
      "source": "Verified: Morningstar, Investing.com",
      "verified": true
    }
  ],
  "latest_verified": true
}
```

### `server.js`
Updated to use the hybrid fetcher when running in Manus sandbox.

**Logic**:
1. Check if running in Manus sandbox (`/opt/.manus/.sandbox-runtime`)
2. If yes + `fetch_spx_data_hybrid.py` exists → use hybrid fetcher
3. Otherwise → use Node.js HTTP fetcher (Railway compatibility)

### `requirements.txt`
Python dependencies for the hybrid fetcher.

```
google-genai>=0.3.0
```

## Testing Results

| Date | Yahoo Finance | Gemini Verification | Status |
|------|---------------|---------------------|--------|
| 2025-12-02 | 6829.37 | ✅ Verified (Morningstar, Investing.com) | SUCCESS |
| 2025-12-03 | 6821.62 | ⏳ Pending (Market just closed) | FALLBACK |
| 2025-11-30 | N/A | ❌ Weekend (Sunday) | CORRECT |
| 2025-11-27 | N/A | ❌ Thanksgiving Holiday | CORRECT |

## Deployment

### Railway
1. Add `GEMINI_API_KEY` to Railway environment variables
2. Railway will use the Node.js HTTP fetcher (no Python dependencies)
3. Gemini verification will not run on Railway

### Manus Sandbox
1. Set `GEMINI_API_KEY` environment variable
2. Run `pip install -r requirements.txt` (if not already installed)
3. Hybrid fetcher will automatically be used

## Benefits

✅ **Accuracy**: Multi-source verification for latest data  
✅ **Speed**: Fast Yahoo Finance API for historical data  
✅ **Reliability**: Graceful fallback if Gemini unavailable  
✅ **Transparency**: Shows data sources in response  
✅ **Flexibility**: Works with or without Gemini API

## Future Improvements

1. **Cache Gemini Results**: Avoid redundant API calls for the same date
2. **Timezone Handling**: Better handling of ET vs UTC timezone differences
3. **Confidence Scoring**: Add confidence levels based on source agreement
4. **Historical Verification**: Option to verify older dates if needed
