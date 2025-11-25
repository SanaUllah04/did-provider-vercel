/* server.js
   Node.js server to manage DID File.txt
   Place this file next to app.js
*/

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

const DID_FILE = path.join(__dirname, 'DID File.txt');

// Initialize DID File.txt if it doesn't exist
async function initializeDIDFile() {
  try {
    await fs.access(DID_FILE);
    console.log('✓ DID File.txt found');
  } catch (error) {
    // File doesn't exist, create it
    await fs.writeFile(DID_FILE, '');
    console.log('✓ DID File.txt created');
  }
}

// Save new DID to DID File.txt
app.post('/save-did', async (req, res) => {
  try {
    const { did, timestamp } = req.body;
    
    if (!did) {
      return res.json({ success: false, message: 'No DID provided' });
    }

    // Read existing DIDs
    let content = '';
    try {
      content = await fs.readFile(DID_FILE, 'utf-8');
    } catch (error) {
      // File might not exist yet
      content = '';
    }

    // Check if DID already exists
    const existingDIDs = content.split('\n').filter(line => line.trim());
    if (existingDIDs.includes(did)) {
      return res.json({ success: false, message: 'DID already exists' });
    }

    // Append new DID
    const entry = `${did}\n`;
    await fs.appendFile(DID_FILE, entry);

    console.log(`✓ DID saved: ${did}`);
    res.json({ success: true, message: 'DID saved successfully' });

  } catch (error) {
    console.error('Error saving DID:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify DID exists in DID File.txt
app.post('/verify-did', async (req, res) => {
  try {
    const { did } = req.body;

    if (!did) {
      return res.json({ exists: false, message: 'No DID provided' });
    }

    // Read DID File.txt
    const content = await fs.readFile(DID_FILE, 'utf-8');
    const dids = content.split('\n').filter(line => line.trim());

    // Check if DID exists
    const exists = dids.includes(did);

    if (exists) {
      console.log(`✓ DID verified: ${did}`);
    } else {
      console.log(`✗ DID not found: ${did}`);
    }

    res.json({ exists });

  } catch (error) {
    console.error('Error verifying DID:', error);
    res.status(500).json({ exists: false, message: error.message });
  }
});

// Legacy endpoint for backward compatibility
app.get('/check-did', async (req, res) => {
  try {
    const did = req.query.did;

    if (!did) {
      return res.json({ exists: false });
    }

    const content = await fs.readFile(DID_FILE, 'utf-8');
    const dids = content.split('\n').filter(line => line.trim());
    const exists = dids.includes(did);

    res.json({ exists });

  } catch (error) {
    console.error('Error checking DID:', error);
    res.json({ exists: false });
  }
});

// Optional: View all DIDs (for debugging)
app.get('/list-dids', async (req, res) => {
  try {
    const content = await fs.readFile(DID_FILE, 'utf-8');
    const dids = content.split('\n').filter(line => line.trim());
    
    res.json({ 
      total: dids.length,
      dids: dids 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = 3000;

initializeDIDFile().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📄 DID File: ${DID_FILE}`);
    console.log(`\n✓ Ready to accept DID registrations and verifications\n`);
  });
}).catch(error => {
  console.error('Failed to initialize server:', error);
});