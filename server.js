const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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

