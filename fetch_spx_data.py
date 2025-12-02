#!/usr/bin/env python3
"""
Fetch S&P 500 (^GSPC) price data using Manus Data API
"""
import sys
import json
from datetime import datetime, timedelta

# Import Manus Data API client
sys.path.insert(0, '/opt/.manus/.sandbox-runtime')
from data_api import ApiClient

def fetch_spx_prices(days=30):
    """
    Fetch S&P 500 closing prices for the specified number of days
    
    Args:
        days (int): Number of days to fetch (default: 30)
    
    Returns:
        list: Array of {date, price} objects
    """
    try:
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days * 2)  # Fetch extra to account for weekends
        
        # Convert to Unix timestamps (as strings for API)
        end_timestamp = str(int(end_date.timestamp()))
        start_timestamp = str(int(start_date.timestamp()))
        
        # Initialize API client
        client = ApiClient()
        
        # Call Yahoo Finance API through Manus Data API Hub
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
            
            # Build price array
            prices = []
            for i, timestamp in enumerate(timestamps):
                if closes[i] is not None:
                    date = datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d')
                    prices.append({
                        'date': date,
                        'price': round(closes[i], 2)
                    })
            
            # Return most recent N trading days
            return prices[-days:]
        
        return []
        
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        return []

if __name__ == '__main__':
    # Get days parameter from command line
    days = int(sys.argv[1]) if len(sys.argv) > 1 else 30
    
    # Fetch prices
    prices = fetch_spx_prices(days)
    
    # Output as JSON
    print(json.dumps({'prices': prices}))
