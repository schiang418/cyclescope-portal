#!/usr/bin/env node
/**
 * Fetch S&P 500 (^GSPC) price data using Yahoo Finance API
 * Pure Node.js version - no Python dependencies required
 */

async function fetchSPXPrices(days = 30) {
  try {
    // Calculate date range (fetch extra to account for weekends/holidays)
    const endDate = Math.floor(Date.now() / 1000);
    const startDate = endDate - (days * 2 * 24 * 60 * 60);
    
    // Yahoo Finance API endpoint
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?period1=${startDate}&period2=${endDate}&interval=1d`;
    
    // Fetch data
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract price data
    if (data.chart && data.chart.result && data.chart.result.length > 0) {
      const result = data.chart.result[0];
      const timestamps = result.timestamp;
      const closes = result.indicators.quote[0].close;
      
      // Build price array
      const prices = [];
      for (let i = 0; i < timestamps.length; i++) {
        if (closes[i] !== null && closes[i] !== undefined) {
          const date = new Date(timestamps[i] * 1000);
          const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
          prices.push({
            date: dateStr,
            price: Math.round(closes[i] * 100) / 100
          });
        }
      }
      
      // Return most recent N trading days
      return prices.slice(-days);
    }
    
    return [];
    
  } catch (error) {
    console.error('Error fetching SPX data:', error.message);
    return [];
  }
}

// Main execution
const days = parseInt(process.argv[2]) || 30;

fetchSPXPrices(days)
  .then(prices => {
    console.log(JSON.stringify({ prices }));
  })
  .catch(error => {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  });
