import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors({
  origin: 'https://webauthn-poc-nine.vercel.app', // frontend URL
  credentials: true
}));
app.use(express.json());

// In-memory storage for users and their credentials
const users = new Map();
const challenges = new Map();

// Helper function to generate random challenge
const generateChallenge = () => {
  return crypto.randomBytes(32);
};

// Helper function to encode buffer as base64url
const base64urlEncode = (buffer) => {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

// Helper function to decode base64url to buffer
const base64urlDecode = (str) => {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
};

app.post('/register/start', (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  if (users.has(username)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  // Generate challenge
  const challenge = generateChallenge();
  challenges.set(username, challenge);

  // Create registration options
  const publicKeyCredentialCreationOptions = {
    challenge: base64urlEncode(challenge),
    rp: {
      name: 'WebAuthn Demo',
      id: process.env.RP_ID || 'localhost'
    },
    user: {
      id: base64urlEncode(Buffer.from(username)),
      name: username,
      displayName: username
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 }, // ES256
      { type: 'public-key', alg: -257 } // RS256
    ],
    timeout: 60000,
    attestation: 'none',
    authenticatorSelection: {
      userVerification: 'preferred'
    },
    extensions: {
      credProps: true
    }
  };

  res.json(publicKeyCredentialCreationOptions);
});

app.post('/register/complete', (req, res) => {
  const { username, credential } = req.body;
  
  if (!challenges.has(username)) {
    return res.status(400).json({ error: 'No challenge found for user' });
  }

  // Store the credential for the user
  users.set(username, {
    username,
    credential,
    registeredAt: new Date().toISOString()
  });
  
  challenges.delete(username);
  res.json({ success: true });
});

app.post('/login/start', (req, res) => {
  const { username } = req.body;
  
  if (!users.has(username)) {
    return res.status(400).json({ error: 'User not found' });
  }

  const challenge = generateChallenge();
  challenges.set(username, challenge);

  const user = users.get(username);
  
  const publicKeyCredentialRequestOptions = {
    challenge: base64urlEncode(challenge),
    allowCredentials: [{
      id: user.credential.id,
      type: 'public-key',
      transports: ['internal']
    }],
    timeout: 60000,
    userVerification: 'preferred',
    rpId: process.env.RP_ID || 'localhost'
  };

  res.json(publicKeyCredentialRequestOptions);
});

app.post('/login/complete', (req, res) => {
  const { username } = req.body;
  
  if (!challenges.has(username)) {
    return res.status(400).json({ error: 'No challenge found for user' });
  }

  const user = users.get(username);
  challenges.delete(username);
  
  res.json({
    success: true,
    user: {
      username: user.username,
      credentialId: user.credential.id,
      registeredAt: user.registeredAt
    }
  });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});