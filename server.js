const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Load environment variables from .env file
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables endpoint for client-side access
app.get('/api/config', (req, res) => {
  res.json({
    FUSION_VERSION: process.env.FUSION_VERSION || 'v1',
    API_BASE_URL: process.env.API_BASE_URL || 'https://cyclescope-secular-production.up.railway.app',
  });
});

// S&P 500 prices endpoint
app.get('/api/spx-prices', (req, res) => {
  const days = req.query.days || 30;
  
  // Use hybrid fetcher that combines Yahoo Finance + Gemini verification
  // - Historical data: Yahoo Finance (fast)
  // - Latest date: Gemini + Google Search (verified)
  const hybridScriptPath = path.join(__dirname, 'fetch_spx_data_hybrid.py');
  const httpScriptPath = path.join(__dirname, 'fetch_spx_data_http.js');
  
  // Prefer hybrid Python version for Manus sandbox, Node.js version for Railway
  const useHybridScript = fs.existsSync('/opt/.manus/.sandbox-runtime') && fs.existsSync(hybridScriptPath);
  const scriptPath = useHybridScript ? hybridScriptPath : httpScriptPath;
  const command = useHybridScript ? `python3 ${scriptPath} ${days}` : `node ${scriptPath} ${days}`;
  
  // Pass environment variables to child process
  const env = { ...process.env };
  if (useHybridScript && process.env.GEMINI_API_KEY) {
    env.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    console.log(`Using hybrid script with Gemini verification`);
  } else {
    console.log(`Using ${useHybridScript ? 'hybrid' : 'HTTP'} script without Gemini`);
  }
  
  console.log(`Executing: ${command}`);
  console.log(`GEMINI_API_KEY set: ${!!env.GEMINI_API_KEY}`);
  
  exec(command, { env }, (error, stdout, stderr) => {
    // Log stderr even if no error (for debugging)
    if (stderr) {
      console.log('Script stderr:', stderr);
    }
    
    if (error) {
      console.error('Error fetching SPX data:', error);
      console.error('stderr:', stderr);
      return res.status(500).json({ error: 'Failed to fetch SPX data' });
    }
    
    try {
      const data = JSON.parse(stdout);
      console.log('SPX data fetched:', data.latest_verified ? 'VERIFIED' : 'not verified');
      res.json(data);
    } catch (e) {
      console.error('Error parsing SPX data:', e);
      console.error('stdout:', stdout);
      res.status(500).json({ error: 'Failed to parse SPX data' });
    }
  });
});

// Serve static files
app.use(express.static(__dirname));

// Route all HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/delta', (req, res) => {
  res.sendFile(path.join(__dirname, 'delta.html'));
});

app.get('/gamma', (req, res) => {
  res.sendFile(path.join(__dirname, 'gamma.html'));
});

app.get('/fusion', (req, res) => {
  res.sendFile(path.join(__dirname, 'fusion.html'));
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ CycleScope Portal running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
});

