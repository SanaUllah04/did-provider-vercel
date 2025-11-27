# 🎬 DID Authentication System

A secure, decentralized identity (DID) authentication system with advanced CAPTCHA verification and cryptographic signature validation.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

---

## 🌟 Features

### 🔐 Security
- **ECDSA P-256 Cryptography** - Industry-standard elliptic curve signatures
- **SHA-256 Hashing** - Secure key derivation and challenge generation
- **Two-Factor Authentication** - DID + Cryptographic signature verification
- **Bot Detection** - Advanced human behavior analysis

### 🎯 User Experience
- **Interactive Slider CAPTCHA** - Engaging puzzle-based verification
- **Decentralized Identity** - No personal data collection
- **Persistent Authentication** - Secure localStorage key management
- **Responsive Design** - Works on desktop and mobile devices

### 🛠️ Technical
- **Local File Storage** - DIDs stored in `DID File.txt`
- **Real-time Verification** - Instant signature validation
- **No Database Required** - Simple file-based system
- **Modern Web Standards** - WebCrypto API + Node.js crypto

---

## 📁 Project Structure

```
did-auth-system/
├── index.html          # Main application interface
├── styles.css          # Application styling
├── app.js             # Client-side logic & CAPTCHA
├── server.js          # Node.js backend & verification
├── DID File.txt       # Auto-generated DID storage
├── package.json       # Dependencies
└── README.md          # Documentation
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v14.0.0 or higher)
- **npm** (comes with Node.js)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone or download the project**
   ```bash
   cd your-project-folder
   ```

2. **Create `package.json`**
   ```json
   {
     "name": "did-auth-system",
     "version": "1.0.0",
     "description": "DID Authentication with CAPTCHA",
     "main": "server.js",
     "scripts": {
       "start": "node server.js"
     },
     "dependencies": {
       "express": "^4.18.2"
     }
   }
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

---

## 💻 Usage

### 🆕 Registration Flow

1. Click **"Sign up with DID"**
2. Complete the **slider puzzle CAPTCHA**
   - Drag the slider to match the puzzle piece position
   - System analyzes movement patterns for human behavior
3. **DID is generated** using ECDSA P-256 cryptography
4. Your credentials are saved:
   - **Private key** → Browser localStorage
   - **Public key + DID** → Server's `DID File.txt`
5. Return to home screen

### 🔑 Login Flow

1. Click **"Login with DID"**
2. Enter your **DID** (e.g., `did:human:abc123...`)
3. System automatically:
   - Retrieves your private key from browser
   - Creates a cryptographic signature
   - Sends signature to server for verification
4. Server validates:
   - ✅ DID exists in `DID File.txt`
   - ✅ Signature matches stored public key
5. **Login successful!** → Access dashboard

---

## 🔒 Security Architecture

### Cryptographic Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    REGISTRATION PHASE                        │
└─────────────────────────────────────────────────────────────┘

User Browser                                    Server
═════════════                                  ════════

1. Complete CAPTCHA ────────────────────────→
                                               2. Validate human behavior
3. Generate ECDSA keypair
   (P-256 curve)
   
4. Private Key → localStorage
   Public Key → Send to server  ─────────────→
                                               5. Store in DID File.txt
                                                  - DID
                                                  - Public Key
                                                  - Timestamp

┌─────────────────────────────────────────────────────────────┐
│                      LOGIN PHASE                             │
└─────────────────────────────────────────────────────────────┘

User Browser                                    Server
═════════════                                  ════════

1. Enter DID
2. Retrieve Private Key
   from localStorage
   
3. Create challenge:
   "login-{DID}-{timestamp}"
   
4. Sign challenge with
   private key (ECDSA)
   
5. Send to server:
   - DID
   - Challenge
   - Signature        ─────────────────────→
                                               6. Read DID File.txt
                                               7. Find matching DID
                                               8. Retrieve Public Key
                                               9. Verify signature
                                               
                      ←─────────────────────  10. Return result:
                                                  ✓ Valid / ✗ Invalid
11. Login or deny access
```

### Key Security Features

#### 🛡️ ECDSA P-256 Signatures
- **Elliptic Curve Cryptography** - 256-bit security level
- **Industry Standard** - Used by Bitcoin, TLS, SSH
- **Efficient** - Small keys, fast operations

#### 🔐 Challenge-Response Authentication
- **Unique challenges** - Timestamp-based, prevents replay attacks
- **Cryptographic proof** - Must own private key to generate valid signature
- **Zero-knowledge** - Private key never transmitted

#### 🤖 Bot Detection Heuristics
- **Movement analysis** - Velocity variance tracking
- **Timing validation** - 1-45 second window
- **Interaction patterns** - Minimum event threshold
- **Natural behavior** - Human-like acceleration/deceleration

---

## 📄 DID File Format

`DID File.txt` stores one JSON object per line:

```json
{"did":"did:human:a1b2c3d4e5f6g7h8i9j0","publicKey":{"kty":"EC","crv":"P-256","x":"yRtivlHYA_obX1...","y":"r0gMQ7jaI7Ea1W..."},"timestamp":1700000000000}
{"did":"did:human:9z8y7x6w5v4u3t2s1r0q","publicKey":{"kty":"EC","crv":"P-256","x":"8KmPqNxZjV2Tc...","y":"5LpYwQsRhGnMvF..."},"timestamp":1700000001000}
```

### Field Descriptions

| Field | Description | Example |
|-------|-------------|---------|
| `did` | Decentralized Identifier | `did:human:abc123...` |
| `publicKey` | ECDSA public key (JWK format) | `{"kty":"EC","crv":"P-256",...}` |
| `timestamp` | Registration time (Unix ms) | `1700000000000` |

---

## 🌐 API Endpoints

### POST `/save-did`
Register a new DID with public key.

**Request:**
```json
{
  "did": "did:human:abc123...",
  "publicKey": {
    "kty": "EC",
    "crv": "P-256",
    "x": "...",
    "y": "..."
  },
  "timestamp": 1700000000000
}
```

**Response:**
```json
{
  "success": true,
  "message": "DID saved successfully"
}
```

---

### POST `/verify-did`
Verify DID and validate signature.

**Request:**
```json
{
  "did": "did:human:abc123...",
  "challenge": "login-did:human:abc123...-1700000000000",
  "signature": "MEQCIH3t6teT9txWDZv...",
  "publicKey": {
    "kty": "EC",
    "crv": "P-256",
    "x": "...",
    "y": "..."
  }
}
```

**Response:**
```json
{
  "exists": true,
  "signatureValid": true
}
```

---

### GET `/list-dids`
List all registered DIDs (debugging).

**Response:**
```json
{
  "total": 2,
  "dids": [
    {
      "did": "did:human:abc123...",
      "timestamp": 1700000000000
    }
  ]
}
```

---

## 🧪 Testing

### Test Registration
1. Navigate to `http://localhost:3000`
2. Click "Sign up with DID"
3. Complete slider puzzle (drag to match position)
4. Verify DID appears in result screen
5. Check `DID File.txt` for new entry

### Test Login
1. Copy a DID from `DID File.txt`
2. Click "Login with DID"
3. Paste the DID
4. Click "Login"
5. Should see "DID and signature verified!"

### Test Signature Verification
1. Open browser console (F12)
2. Attempt login
3. Look for debug logs:
   ```
   → Creating signature...
   → Verifying signature...
   ✓ DID verified with VALID signature
   ```

### Test Bot Detection
Try to "cheat" the CAPTCHA:
- Complete puzzle too fast (< 1 second) → Should fail
- Complete puzzle too slow (> 45 seconds) → Should fail
- Move slider in perfectly straight line → May fail (bot-like)

---

## 🔧 Configuration

### Server Port
Change in `server.js`:
```javascript
const PORT = 3000; // Change to your preferred port
```

### Bot Detection Thresholds
Adjust in `app.js`:
```javascript
function analyzeInteractionPattern(duration) {
  if (duration < 1) return false;     // Min time (seconds)
  if (duration > 45) return false;    // Max time (seconds)
  // ... variance threshold for movement detection
  return variance > 0.01;             // Adjust sensitivity
}
```

### CAPTCHA Difficulty
Modify in `app.js`:
```javascript
state.targetPosition = 150 + Math.random() * 150; // Puzzle position range
const tolerance = 15; // How close user must match (pixels)
```

---

## 🐛 Troubleshooting

### Issue: Server won't start
**Solution:** Check if port 3000 is already in use
```bash
# Find process using port 3000
lsof -i :3000    # Mac/Linux
netstat -ano | findstr :3000    # Windows

# Change port in server.js if needed
```

### Issue: "Cannot connect to server"
**Solution:** Ensure server is running
```bash
npm start
# Should see: 🚀 Server running on http://localhost:3000
```

### Issue: Signature verification fails
**Solution:** 
1. Clear browser localStorage
2. Re-register with new DID
3. Check browser console for detailed error logs

### Issue: CAPTCHA too difficult/easy
**Solution:** Adjust tolerance in `app.js`:
```javascript
const tolerance = 15; // Increase for easier, decrease for harder
```

### Issue: "DID not found in this browser"
**Solution:** 
- User must login from same browser where they registered
- Private keys are stored in localStorage (browser-specific)
- To transfer DID, user would need to export/import keypair

---

## 📊 Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 60+ | ✅ Fully Supported |
| Firefox | 57+ | ✅ Fully Supported |
| Safari | 11+ | ✅ Fully Supported |
| Edge | 79+ | ✅ Fully Supported |
| Opera | 47+ | ✅ Fully Supported |

**Requirements:**
- WebCrypto API support
- localStorage support
- Canvas API support
- ES6+ JavaScript support

---

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- [ ] Add biometric authentication support
- [ ] Implement DID export/import functionality
- [ ] Add multiple CAPTCHA types
- [ ] Create admin dashboard
- [ ] Add rate limiting
- [ ] Implement session management
- [ ] Add unit tests
- [ ] Create Docker container

---

## 📜 License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2024 DID Auth System

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Support

For issues and questions:
- 🐛 **Bug Reports:** Open an issue on GitHub
- 💡 **Feature Requests:** Open an issue with [Feature Request] tag
- 📧 **Email:** support@example.com
- 📚 **Documentation:** See inline code comments

---

## 🙏 Acknowledgments

- **WebCrypto API** - W3C standard for browser cryptography
- **ECDSA P-256** - NIST standardized elliptic curve
- **Express.js** - Fast, unopinionated web framework
- **Node.js crypto** - Built-in cryptographic functionality

---

## 📈 Roadmap

### Version 1.0 (Current)
- ✅ Slider CAPTCHA
- ✅ ECDSA signature verification
- ✅ Local file storage
- ✅ Basic authentication flow

### Version 1.1 (Planned)
- 🔄 Multi-factor authentication options
- 🔄 DID recovery mechanism
- 🔄 Enhanced bot detection
- 🔄 Session management

### Version 2.0 (Future)
- 📋 Database integration option
- 📋 API rate limiting
- 📋 Advanced analytics
- 📋 Admin dashboard

---

<div align="center">

**Built with ❤️ for decentralized identity**

[⬆ Back to Top](#-did-authentication-system)

</div>