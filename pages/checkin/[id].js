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

      <div className="bg-blue-500 text-white p-4 text-center">
        <h1 className="text-xl font-bold">Check-in {checkinNumber}</h1>
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

              <button
                onClick={() => setStep("breathing-intro")}
                disabled={surveyRatings.reaction === null || surveyRatings.deadline === null}
                className="bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded-lg w-full"
              >
                Continue
              </button>
            </>
          )}

          {step === "breathing-intro" && (
            <>
              <h2 className="text-lg font-bold mb-4">
                Relaxation Task
              </h2>

              <p className="text-gray-600 mb-4">
                You will now follow a short breathing exercise.
                When the screen says inhale, breathe in slowly.
                When it says hold, pause your breath.
                When it says exhale, breathe out slowly.
                Keep following the instructions until the exercise ends.
              </p>

              <button
                onClick={startBreathing}
                className="bg-green-500 text-white w-full py-3 rounded-lg"
              >
                Start
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}