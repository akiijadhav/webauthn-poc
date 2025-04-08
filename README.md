# 🔐 WebAuthn Passkey Demo

This is a modern full-stack demo showcasing **passwordless authentication using Passkeys** (WebAuthn). It supports:

- 🔑 Registering a passkey (biometric, PIN, or security key)
- 🧠 Discoverable credentials (syncs to Google Password Manager)
- 📱 Cross-device login (Android, Chrome, and more)
- ✅ Full support for the [WebAuthn Level 2](https://w3c.github.io/webauthn/) spec

## 🧱 Tech Stack

- **Frontend**: React + TypeScript + Tailwind
- **Backend**: Node.js + Express
- **API**: Native WebAuthn API (via `navigator.credentials`)
- **Deployment**:
    - Frontend: [Vercel](https://vercel.com)
    - Backend: [Render](https://render.com) or local dev

## ✨ Features

- `residentKey: 'required'` → Enables passkey syncing & discovery
- `userVerification: 'preferred'` → Supports biometrics or PIN
- 🔁 `autoComplete="username webauthn"` to trigger **Google Password Manager suggestions**
- Clean UX — works like [https://webauthn.io](https://webauthn.io)

---

## 🚀 Live Demo

🌐 [https://webauthn-poc-nine.vercel.app](https://webauthn-poc-nine.vercel.app)

Test it on:
- ✅ Chrome Desktop (with biometrics or PIN)
- ✅ Android (saved to your Google account)
- ✅ Cross-device login (select your Android phone during sign-in)

---

## 🛠️ Local Development

1. **Clone this repo**
   ```bash
   git@github.com:akiijadhav/webauthn-poc.git
