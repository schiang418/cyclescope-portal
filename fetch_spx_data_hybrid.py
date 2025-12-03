#!/usr/bin/env python3
"""
Hybrid S&P 500 Data Fetcher
- Historical data: Yahoo Finance API (fast, reliable)
- Latest date: Google Gemini API with Search Grounding (multi-source verification)
"""
import sys
import json
import os
import re
from datetime import datetime, timedelta

# Import Manus Data API client for Yahoo Finance
sys.path.insert(0, '/opt/.manus/.sandbox-runtime')
from data_api import ApiClient

# Import Google Gemini (only if needed for latest date)
try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("Warning: google-genai not installed. Latest date verification disabled.", file=sys.stderr)


def clean_json_text(text):
    """Extract JSON from markdown-wrapped text"""
    text = text.strip()
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if match:
        return match.group(1)
    return text


def fetch_latest_spx_with_gemini(target_date):
    """
    Fetch SPX closing price for a specific date using Gemini + Google Search
    Returns: dict with type, date, spx_value, source
    """
    if not GEMINI_AVAILABLE:
        return None
    
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        print("Warning: GEMINI_API_KEY not set. Skipping Gemini verification.", file=sys.stderr)
        return None
    
    try:
        client = genai.Client(api_key=api_key)
        
        prompt = f"""
Act as a financial data auditor. Check the S&P 500 (SPX) closing status for {target_date}.

Procedure:
1. Check Market Status (Open/Closed) for {target_date}.
2. Use Google Search to find the official SPX closing value.
3. **VERIFICATION**: Cross-reference at least 2 distinct reliable financial sources (e.g., Bloomberg, CBOE, Yahoo Finance) to confirm the number.

You must output exactly ONE JSON object based on the data availability.

SCENARIO 1: Market was OPEN and Verified Closing Data is Available.
Output Format:
{{
    "type": "SPX_DATA_FOUND",
    "date": "{target_date}",
    "spx_value": <numeric_float_value>,
    "source": "<source_domain_or_name>"
}}

SCENARIO 2: Market was CLOSED, Date is Future, or Data is Not Yet Available.
Output Format:
{{
    "type": "SPX_DATA_UNAVAILABLE",
    "date": "{target_date}",
    "reason": "<Specific Reason>", 
    "details": "Market Status: CLOSED or PENDING"
}}

Valid Reasons for Scenario 2:
- "Weekend (Saturday/Sunday)"
- "Market Holiday: <Holiday Name>"
- "Future Date"
- "Market just closed, settlement data pending"

Return ONLY the JSON.
"""
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
                temperature=0.0
            )
        )
        
        raw_text = response.text
        cleaned_json_str = clean_json_text(raw_text)
        data = json.loads(cleaned_json_str)
        
        return data
        
    except Exception as e:
        print(f"Gemini API error: {e}", file=sys.stderr)
        return None


def fetch_spx_prices_yahoo(days=30):
    """
    Fetch historical S&P 500 closing prices using Yahoo Finance API
    
    Args:
        days (int): Number of days to fetch
    
    Returns:
        list: Array of {date, price} objects
    """
    try:
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days * 2)  # Fetch extra for weekends
        
        # Convert to Unix timestamps
        end_timestamp = str(int(end_date.timestamp()))
        start_timestamp = str(int(start_date.timestamp()))
        
        # Initialize API client
        client = ApiClient()
        
        # Call Yahoo Finance API
        response = client.call_api(
            'YahooFinance/get_stock_chart',
            query={
                'symbol': '^GSPC',
                'period1': start_timestamp,
                'period2': end_timestamp,
                'interval': '1d'
            }
        )
        
        # Extract price data
        if 'chart' in response and 'result' in response['chart']:
            result = response['chart']['result'][0]
            timestamps = result['timestamp']
            closes = result['indicators']['quote'][0]['close']
            
            # Get current time in Eastern Time to filter out intraday data
            import pytz
            et_tz = pytz.timezone('America/New_York')
            now_et = datetime.now(et_tz)
            today_et = now_et.date()
            
            # Market closes at 4:00 PM ET
            market_close_hour = 16.0
            current_hour = now_et.hour + (now_et.minute / 60.0)
            
            # Build price array, filtering out intraday data
            prices = []
            for i, timestamp in enumerate(timestamps):
                if closes[i] is not None:
                    price_datetime = datetime.fromtimestamp(timestamp, tz=et_tz)
                    price_date = price_datetime.date()
                    
                    # Skip today's data if market hasn't closed yet
                    if price_date == today_et and current_hour < market_close_hour:
                        print(f"⏭ Skipping intraday data for {price_date} (market still open)", file=sys.stderr)
                        continue
                    
                    prices.append({
                        'date': price_date.strftime('%Y-%m-%d'),
                        'price': round(closes[i], 2),
                        'source': 'Yahoo Finance'
                    })
            
            return prices
        
        return []
        
    except Exception as e:
        print(f"Yahoo Finance API error: {e}", file=sys.stderr)
        return []


def fetch_spx_prices_hybrid(days=30):
    """
    Hybrid SPX data fetcher:
    - Historical data: Yahoo Finance (fast)
    - Latest date: Gemini + Google Search (verified)
    
    Args:
        days (int): Number of days to fetch
    
    Returns:
        dict: {prices: [...], latest_verified: bool}
    """
    # Fetch historical data from Yahoo Finance
    yahoo_prices = fetch_spx_prices_yahoo(days)
    
    if not yahoo_prices:
        return {'prices': [], 'latest_verified': False}
    
    # Get the latest date from Yahoo data
    latest_yahoo_date = yahoo_prices[-1]['date']
    latest_yahoo_price = yahoo_prices[-1]['price']
    
    # Check if we should verify the latest date with Gemini
    # Only verify if it's the most recent trading day (today or yesterday)
    latest_date_obj = datetime.strptime(latest_yahoo_date, '%Y-%m-%d')
    days_ago = (datetime.now().date() - latest_date_obj.date()).days
    
    latest_verified = False
    
    # Only verify if the latest Yahoo data is from today or yesterday
    # (meaning it's the most recent market close)
    if days_ago <= 1 and GEMINI_AVAILABLE:
        print(f"Verifying latest trading day {latest_yahoo_date} with Gemini...", file=sys.stderr)
        
        gemini_result = fetch_latest_spx_with_gemini(latest_yahoo_date)
        
        if gemini_result:
            if gemini_result.get('type') == 'SPX_DATA_FOUND':
                gemini_price = gemini_result.get('spx_value')
                gemini_source = gemini_result.get('source', 'Gemini Search')
                
                # Compare prices (allow 0.5% difference)
                if gemini_price and abs(gemini_price - latest_yahoo_price) / latest_yahoo_price < 0.005:
                    # Prices match - update with Gemini source
                    yahoo_prices[-1]['price'] = gemini_price
                    yahoo_prices[-1]['source'] = f"Verified: {gemini_source}"
                    yahoo_prices[-1]['verified'] = True
                    latest_verified = True
                    print(f"✓ Latest price verified: {gemini_price} ({gemini_source})", file=sys.stderr)
                else:
                    # Prices don't match - flag for review
                    print(f"⚠ Price mismatch: Yahoo={latest_yahoo_price}, Gemini={gemini_price}", file=sys.stderr)
                    yahoo_prices[-1]['warning'] = f"Gemini shows {gemini_price}"
            elif gemini_result.get('type') == 'SPX_DATA_UNAVAILABLE':
                reason = gemini_result.get('reason', 'Unknown')
                print(f"ℹ Gemini verification unavailable: {reason}", file=sys.stderr)
                # Keep Yahoo Finance data as-is
                yahoo_prices[-1]['note'] = f"Gemini: {reason}"
        else:
            print(f"⚠ Gemini API failed, using Yahoo Finance data", file=sys.stderr)
    
    # Return most recent N trading days
    return {
        'prices': yahoo_prices[-days:],
        'latest_verified': latest_verified
    }


if __name__ == '__main__':
    # Get days parameter from command line
    days = int(sys.argv[1]) if len(sys.argv) > 1 else 30
    
    # Fetch prices with hybrid approach
    result = fetch_spx_prices_hybrid(days)
    
    # Output as JSON
    print(json.dumps(result))
