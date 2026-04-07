import { useRouter } from 'next/router';
import { useState } from 'react';

export default function CheckinPage() {
  const router = useRouter();
  const { id } = router.query;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/checkin-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkinId: id,
          data: {
            submittedAt: new Date().toISOString(),
            // Add your check-in data here later
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit check-in');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setSubmitting(false);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  };

  if (!id) {
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
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-white hover:text-gray-200 mb-3 flex items-center text-sm sm:text-base"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold">Check-in</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4">
        {success ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 sm:px-6 py-4 rounded-lg text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Check-in Submitted!</h2>
            <p className="text-sm sm:text-base">Thank you for completing this check-in. Redirecting to dashboard...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800">Check-in #{router.query.id?.slice(-1)}</h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-sm sm:text-base">
                {error}
              </div>
            )}

            {/* Placeholder for check-in questions */}
            <div className="mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-600 text-center text-base sm:text-lg">
                Your check-in questions will appear here.
              </p>
              <p className="text-gray-500 text-center mt-2 text-sm sm:text-base">
                You can add them later.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 sm:px-6 py-2 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400 text-sm sm:text-base"
              >
                {submitting ? 'Submitting...' : 'Submit Check-in'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
