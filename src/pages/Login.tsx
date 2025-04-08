import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Get login options from backend
      const startResponse = await fetch(`${import.meta.env.VITE_API_BASE}/login/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }) // Send the typed username
      });

      const options = await startResponse.json();

      if (!startResponse.ok) {
        throw new Error(options.error || 'Failed to start login');
      }

      // Decode challenge
      options.challenge = Uint8Array.from(
          atob(options.challenge.replace(/-/g, '+').replace(/_/g, '/')),
          c => c.charCodeAt(0)
      );

      // Decode allowCredentials if present (optional step — skip if using discoverable credentials only)
      if (options.allowCredentials) {
        options.allowCredentials = options.allowCredentials.map((cred: any) => ({
          ...cred,
          id: Uint8Array.from(
              atob(cred.id.replace(/-/g, '+').replace(/_/g, '/')),
              c => c.charCodeAt(0)
          )
        }));
      }

      // Trigger browser WebAuthn
      const credential = await navigator.credentials.get({
        publicKey: options
      }) as PublicKeyCredential;

      const credentialResponse = credential.response as AuthenticatorAssertionResponse;

      // Send credential to backend for verification
      const completeResponse = await fetch(`${import.meta.env.VITE_API_BASE}/login/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
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
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        <h2 className="text-2xl font-bold mb-4">Login with Passkey</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username or Email
            </label>
            <input
                type="text"
                id="username"
                name="username"
                autoComplete="username webauthn" // Important for Google Password Manager!
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => console.log('Focus - allow Google to suggest passkeys')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                required
            />
          </div>
          <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Login
          </button>
        </form>
        {status && (
            <p className="mt-4 text-center text-sm font-medium text-gray-900">
              {status}
            </p>
        )}
      </div>
  );
}

export default Login;
