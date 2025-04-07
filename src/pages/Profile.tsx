import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  username: string;
  credentialId: string;
  registeredAt: string;
}

function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Username</h3>
          <p className="mt-1 text-sm text-gray-900">{user.username}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Credential ID</h3>
          <p className="mt-1 text-sm text-gray-900 break-all">{user.credentialId}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Registered At</h3>
          <p className="mt-1 text-sm text-gray-900">
            {new Date(user.registeredAt).toLocaleString()}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default Profile;