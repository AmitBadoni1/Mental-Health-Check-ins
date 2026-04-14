import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const router = useRouter();
  const [checkins, setCheckins] = useState([]);
  const [currentCheckin, setCurrentCheckin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCheckins();
  }, []);

  const fetchCheckins = async () => {
    try {
      const response = await fetch('/api/checkins');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to load check-ins');
        setLoading(false);
        return;
      }

      setCheckins(data.checkins);
      // Set current check-in as the first unlocked uncompleted one
      const current = data.checkins.find(c => c.isUnlocked && !c.isCompleted);
      setCurrentCheckin(current);
      setLoading(false);
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 sm:p-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Mental Health Check-ins</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold text-sm sm:text-base w-full sm:w-auto"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Check-ins List */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800">Check-in Progress</h2>
            <div className="space-y-3 sm:space-y-4">
              {checkins.map((checkin) => (
                <div
                  key={checkin.id}
                  onClick={() => {
                    if (checkin.isUnlocked && !checkin.isCompleted) {
                      router.push(`/checkin/${checkin.id}`);
                    }
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    currentCheckin?.id === checkin.id
                      ? 'border-blue-500 bg-blue-50 shadow-md cursor-pointer'
                      : checkin.isCompleted
                      ? 'border-gray-200 bg-gray-50'
                      : checkin.isUnlocked
                      ? 'border-blue-200 bg-blue-50 cursor-pointer hover:shadow-md'
                      : 'border-gray-200 bg-gray-50 opacity-50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div
                        className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-white text-sm sm:text-base ${
                          currentCheckin?.id === checkin.id
                            ? 'bg-blue-600'
                            : checkin.isCompleted
                            ? 'bg-green-500'
                            : checkin.isUnlocked
                            ? 'bg-blue-400'
                            : 'bg-gray-400'
                        }`}
                      >
                        {checkin.number}
                      </div>
                      <div className="flex-grow">
                        <h3
                          className={`font-semibold text-sm sm:text-base ${
                            currentCheckin?.id === checkin.id ? 'text-lg text-gray-900' : 'text-gray-600'
                          }`}
                        >
                          Check-in {checkin.number}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          {checkin.isCompleted
                            ? `Completed on ${new Date(checkin.completedAt).toLocaleDateString()}`
                            : checkin.isUnlocked
                            ? 'Available now'
                            : 'Locked until the prior check-in is completed'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {checkin.isCompleted && (
                        <span className="text-green-600 font-semibold text-xs sm:text-sm">✓ Complete</span>
                      )}
                      {!checkin.isCompleted && checkin.isUnlocked && (
                        <span className="text-blue-600 font-semibold text-xs sm:text-sm">→ Start</span>
                      )}
                      {!checkin.isUnlocked && (
                        <span className="text-gray-400 font-semibold text-xs sm:text-sm">🔒 Locked</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Check-in Info */}
          {currentCheckin && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 sm:p-6 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">Current Check-in</h3>
              <p className="text-sm sm:text-base text-blue-800">
                You are currently on <strong>Check-in {currentCheckin.number}</strong>. Click on it above to begin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
