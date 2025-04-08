import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Step 1: Get login options from backend
      const startResponse = await fetch(`${import.meta.env.VITE_API_BASE}/login/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const options = await startResponse.json();
      if (!startResponse.ok) throw new Error(options.error || 'Failed to start login');

      // Step 2: Decode challenge
      options.challenge = Uint8Array.from(
          atob(options.challenge.replace(/-/g, '+').replace(/_/g, '/')),
          c => c.charCodeAt(0)
      );

      // Step 3: Trigger WebAuthn prompt (discoverable credentials)
      const credential = await navigator.credentials.get({
        publicKey: options
      }) as PublicKeyCredential;

      const credentialResponse = credential.response as AuthenticatorAssertionResponse;

      // Step 4: Send credential to backend
      const completeResponse = await fetch(`${import.meta.env.VITE_API_BASE}/login/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: {
            id: credential.id,
            rawId: Array.from(new Uint8Array(credential.rawId)),
            type: credential.type,
            response: {
              authenticatorData: Array.from(new Uint8Array(credentialResponse.authenticatorData)),
              clientDataJSON: Array.from(new Uint8Array(credentialResponse.clientDataJSON)),
              signature: Array.from(new Uint8Array(credentialResponse.signature)),
              userHandle: credentialResponse.userHandle
                  ? Array.from(new Uint8Array(credentialResponse.userHandle))
                  : null
            }
          }
        })
      });

      const result = await completeResponse.json();
      if (result.success) {
        localStorage.setItem('user', JSON.stringify(result.user));
        setStatus('Login successful!');
        setTimeout(() => navigate('/profile'), 2000);
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      setStatus(error instanceof Error ? error.message : 'Login failed');
    }
  };

  return (
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Login with Passkey</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <button
                type="submit"
                className="w-full py-2 px-4 text-white bg-indigo-600 rounded-md shadow hover:bg-indigo-700"
            >
              Use Passkey
            </button>
          </form>
          {status && (
              <p className="mt-4 text-center text-sm font-medium text-gray-900">{status}</p>
          )}
        </div>
  );
}

export default Login;
