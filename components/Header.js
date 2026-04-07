import { useRouter } from 'next/router';

export default function Header({ title, showLogout = true }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 shadow-lg">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <h1 className="text-3xl font-bold">{title}</h1>
        {showLogout && (
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
}
