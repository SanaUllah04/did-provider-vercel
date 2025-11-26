/* server.js
   Node.js server to manage DID File.txt with signature verification
   Place this file next to app.js
*/

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
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

// Save new DID with public key to DID File.txt
app.post('/save-did', async (req, res) => {
  try {
    const { did, publicKey, timestamp } = req.body;
    
    if (!did || !publicKey) {
      return res.json({ success: false, message: 'No DID or public key provided' });
    }

    // Read existing DIDs
    let content = '';
    try {
      content = await fs.readFile(DID_FILE, 'utf-8');
    } catch (error) {
      content = '';
    }

    // Check if DID already exists
    const lines = content.split('\n').filter(line => line.trim());
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.did === did) {
          return res.json({ success: false, message: 'DID already exists' });
        }
      } catch (e) {
        // Skip invalid lines
      }
    }

    // Append new DID entry as JSON
    const entry = JSON.stringify({ did, publicKey, timestamp }) + '\n';
    await fs.appendFile(DID_FILE, entry);

    console.log(`✓ DID saved: ${did}`);
    res.json({ success: true, message: 'DID saved successfully' });

  } catch (error) {
    console.error('Error saving DID:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify DID and signature
app.post('/verify-did', async (req, res) => {
  try {
    const { did, challenge, signature, publicKey } = req.body;

    if (!did) {
      return res.json({ exists: false, signatureValid: false, message: 'No DID provided' });
    }

    // Read DID File.txt
    const content = await fs.readFile(DID_FILE, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    // Find the DID entry
    let didEntry = null;
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.did === did) {
          didEntry = entry;
          break;
        }
      } catch (e) {
        // Skip invalid lines
      }
    }

    if (!didEntry) {
      console.log(`✗ DID not found: ${did}`);
      return res.json({ exists: false, signatureValid: false });
    }

    // Verify signature if provided
    if (challenge && signature && publicKey) {
      const isValid = await verifySignature(challenge, signature, publicKey);
      
      if (isValid) {
        console.log(`✓ DID verified with valid signature: ${did}`);
        return res.json({ exists: true, signatureValid: true });
      } else {
        console.log(`✗ Invalid signature for DID: ${did}`);
        return res.json({ exists: true, signatureValid: false });
      }
    }

    // If no signature provided, just check existence
    console.log(`✓ DID exists: ${did}`);
    res.json({ exists: true, signatureValid: false });

  } catch (error) {
    console.error('Error verifying DID:', error);
    res.status(500).json({ exists: false, signatureValid: false, message: error.message });
  }
});

// Verify ECDSA signature
async function verifySignature(challenge, signatureBase64, publicKeyJwk) {
  try {
    // Convert base64 signature to buffer
    const signatureBuffer = Buffer.from(signatureBase64, 'base64');

    // Create verify object
    const verify = crypto.createVerify('SHA256');
    verify.update(challenge);

    // Convert JWK to PEM format
    const publicKeyPem = jwkToPem(publicKeyJwk);

    // Verify signature
    const isValid = verify.verify(publicKeyPem, signatureBuffer);
    
    return isValid;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Convert JWK to PEM format for crypto verification
function jwkToPem(jwk) {
  // For P-256 curve
  const x = Buffer.from(base64UrlDecode(jwk.x), 'hex');
  const y = Buffer.from(base64UrlDecode(jwk.y), 'hex');

  // Create DER format public key
  const prefix = Buffer.from([
    0x30, 0x59, // SEQUENCE, length 89
    0x30, 0x13, // SEQUENCE, length 19
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, // OID ecPublicKey
    0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, // OID prime256v1
    0x03, 0x42, 0x00, 0x04 // BIT STRING, length 66, uncompressed point
  ]);

  const publicKeyDer = Buffer.concat([prefix, x, y]);
  const publicKeyPem = 
    '-----BEGIN PUBLIC KEY-----\n' +
    publicKeyDer.toString('base64').match(/.{1,64}/g).join('\n') +
    '\n-----END PUBLIC KEY-----';

  return publicKeyPem;
}

// Helper: Decode base64url to hex
function base64UrlDecode(str) {
  // Convert base64url to base64
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  // Pad if necessary
  while (str.length % 4) str += '=';
  // Decode and convert to hex
  return Buffer.from(str, 'base64').toString('hex');
}

// Legacy endpoint for backward compatibility
app.get('/check-did', async (req, res) => {
  try {
    const did = req.query.did;

    if (!did) {
      return res.json({ exists: false });
    }

    const content = await fs.readFile(DID_FILE, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.did === did) {
          return res.json({ exists: true });
        }
      } catch (e) {
        // Skip invalid lines
      }
    }

    res.json({ exists: false });

  } catch (error) {
    console.error('Error checking DID:', error);
    res.json({ exists: false });
  }
});

// Optional: View all DIDs (for debugging)
app.get('/list-dids', async (req, res) => {
  try {
    const content = await fs.readFile(DID_FILE, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const dids = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
    
    res.json({ 
      total: dids.length,
      dids: dids.map(d => ({ did: d.did, timestamp: d.timestamp }))
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
    console.log(`🔐 Signature verification enabled`);
    console.log(`\n✓ Ready to accept DID registrations and verifications\n`);
  });
}).catch(error => {
  console.error('Failed to initialize server:', error);
});