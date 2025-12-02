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
  const scriptPath = path.join(__dirname, 'fetch_spx_data.py');
  
  exec(`python3 ${scriptPath} ${days}`, (error, stdout, stderr) => {
    if (error) {
      console.error('Error fetching SPX data:', error);
      return res.status(500).json({ error: 'Failed to fetch SPX data' });
    }
    
    try {
      const data = JSON.parse(stdout);
      res.json(data);
    } catch (e) {
      console.error('Error parsing SPX data:', e);
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

