// Import required libraries
import express from 'express';           // Web framework
import cors from 'cors';                 // Middleware for handling Cross-Origin Resource Sharing
import crypto from 'crypto';             // Node's built-in crypto for generating random values
import dotenv from 'dotenv';             // Loads environment variables from .env file
dotenv.config();                         // Load .env configuration

const app = express();

// Configure CORS to allow frontend domains
app.use(cors({
  origin: ['https://webauthn-poc-nine.vercel.app', 'http://localhost:5173'], // Allowed frontends
  credentials: true                                                           // Allow credentials (cookies, etc)
}));
app.use(express.json()); // Enable JSON parsing for request bodies

// In-memory storage (for demo only)
const users = new Map();       // Stores registered users by username
const challenges = new Map();  // Temporarily stores challenges per user or login session

// Generate a random challenge (used during registration & login)
const generateChallenge = () => crypto.randomBytes(32);

// Encode a buffer to base64url format (used in WebAuthn)
const base64urlEncode = (buffer) => buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

// Decode base64url string to buffer
const base64urlDecode = (str) => {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
};

// ----------------------
// Registration Start
// ----------------------
app.post('/register/start', (req, res) => {
  const { username } = req.body; // Get username/email from client

  if (!username) return res.status(400).json({ error: 'Username is required' });
  if (users.has(username)) return res.status(400).json({ error: 'User already exists' });

  const challenge = generateChallenge();           // Generate challenge
  challenges.set(username, challenge);             // Store it mapped to username

  // WebAuthn options for registration
  const publicKeyCredentialCreationOptions = {
    challenge: base64urlEncode(challenge),         // Encode challenge for client
    rp: {
      name: 'WebAuthn Demo',                       // RP name shown to user
      id: process.env.RP_ID || 'localhost'         // RP ID (your domain)
    },
    user: {
      id: Buffer.from(username),                  // Unique user ID (ArrayBuffer)
      name: username,                              // Account username (e.g., email)
      displayName: username                        // Shown in browser dialogs
    },
    pubKeyCredParams: [                            // Allowed algorithms
      { type: 'public-key', alg: -7 },             // ES256
      { type: 'public-key', alg: -257 }            // RS256
    ],
    timeout: 60000,                                // Timeout for user interaction
    attestation: 'none',                           // No device attestation
    authenticatorSelection: {
      residentKey: 'required',                     // Enables discoverable credentials
      userVerification: 'preferred'                // Ask for biometrics/PIN if available
    },
    extensions: {
      credProps: true                              // Return additional properties
    }
  };

  res.json(publicKeyCredentialCreationOptions);     // Send options to client
});

// ----------------------
// Registration Complete
// ----------------------
app.post('/register/complete', (req, res) => {
  const { username, credential } = req.body;       // Get response from client

  if (!challenges.has(username)) return res.status(400).json({ error: 'No challenge found for user' });

  users.set(username, {                            // Save user credential in memory
    username,
    credential,
    registeredAt: new Date().toISOString()
  });

  challenges.delete(username);                     // Clean up challenge
  res.json({ success: true });
});

// ----------------------
// Login Start
// ----------------------
app.post('/login/start', (req, res) => {
  const challenge = generateChallenge();
  challenges.set('login', challenge);              // Store single login challenge

  // WebAuthn options for login
  const publicKeyCredentialRequestOptions = {
    challenge: base64urlEncode(challenge),         // Encode challenge
    timeout: 60000,                                // Time to interact with user
    userVerification: 'preferred',                 // Try to use biometrics/PIN
    rpId: process.env.RP_ID || 'localhost'         // Must match RP used during registration
    // No allowCredentials → show all discoverable credentials
  };

  res.json(publicKeyCredentialRequestOptions);     // Send to client
});

// ----------------------
// Login Complete
// ----------------------
app.post('/login/complete', (req, res) => {
  const { credential } = req.body;                // Get credential from navigator.credentials.get()

  const userHandle = Buffer.from(credential.response.userHandle).toString(); // Decode user handle
  const user = users.get(userHandle);             // Lookup stored user

  if (!user) return res.status(404).json({ error: 'User not found' });

  challenges.delete('login');                     // Cleanup challenge

  res.json({                                      // Send basic profile info
    success: true,
    user: {
      username: user.username,
      credentialId: user.credential.id,
      registeredAt: user.registeredAt
    }
  });
});

// ----------------------
// Start server
// ----------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
