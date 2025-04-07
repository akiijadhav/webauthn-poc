import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Start authentication process
      const startResponse = await fetch(`${import.meta.env.VITE_API_BASE}/login/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      const options = await startResponse.json();
      
      if (!startResponse.ok) {
        throw new Error(options.error);
      }

      // Convert base64url challenge to ArrayBuffer
      options.challenge = Uint8Array.from(
        atob(options.challenge.replace(/-/g, '+').replace(/_/g, '/')),
        c => c.charCodeAt(0)
      );

      // Convert credential IDs to ArrayBuffer
      options.allowCredentials = options.allowCredentials.map((credential: { id: string; }) => ({
        ...credential,
        id: Uint8Array.from(
          atob(credential.id.replace(/-/g, '+').replace(/_/g, '/')),
          c => c.charCodeAt(0)
        )
      }));

      // Get credentials using WebAuthn API
      const credential = await navigator.credentials.get({
        publicKey: options
      }) as PublicKeyCredential;

      const credentialResponse = credential.response as AuthenticatorAssertionResponse;
      
      // Complete authentication
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
              signature: Array.from(new Uint8Array(credentialResponse.signature))
            }
          }
        })
      });

      const result = await completeResponse.json();
      
      if (result.success) {
        localStorage.setItem('user', JSON.stringify(result.user));
        setStatus('Login successful!');
        setTimeout(() => navigate('/profile'), 2000);
      }
    } catch (error) {
      console.error('Login error:', error);
      setStatus(error instanceof Error ? error.message : 'Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
      <h2 className="text-2xl font-bold mb-4">Login with WebAuthn</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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