import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Step 1: Start registration
      const startResponse = await fetch(`${import.meta.env.VITE_API_BASE}/register/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      const options = await startResponse.json();
      if (!startResponse.ok) throw new Error(options.error);

      // Step 2: Convert challenge to ArrayBuffer
      options.challenge = Uint8Array.from(
          atob(options.challenge.replace(/-/g, '+').replace(/_/g, '/')),
          c => c.charCodeAt(0)
      );

      // Step 3: Create credentials using WebAuthn API
      const credential = await navigator.credentials.create({
        publicKey: options
      }) as PublicKeyCredential;

      const credentialResponse = credential.response as AuthenticatorAttestationResponse;

      // Step 4: Send credentials to server
      const completeResponse = await fetch(`${import.meta.env.VITE_API_BASE}/register/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          credential: {
            id: credential.id,
            rawId: Array.from(new Uint8Array(credential.rawId)),
            type: credential.type,
            response: {
              attestationObject: Array.from(new Uint8Array(credentialResponse.attestationObject)),
              clientDataJSON: Array.from(new Uint8Array(credentialResponse.clientDataJSON))
            }
          }
        })
      });

      const result = await completeResponse.json();
      if (result.success) {
        setStatus('Registration successful!');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setStatus(error instanceof Error ? error.message : 'Registration failed');
    }
  };

  return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Register with WebAuthn</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
                type="text"
                id="username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username webauthn"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
            />
          </div>
          <button
              type="submit"
              className="w-full py-2 px-4 text-white bg-indigo-600 rounded-md shadow hover:bg-indigo-700"
          >
            Register
          </button>
        </form>
        {status && (
            <p className="mt-4 text-center text-sm font-medium text-gray-900">{status}</p>
        )}
      </div>
  );
}

export default Register;
