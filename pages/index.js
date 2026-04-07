import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to auth page
    router.push('/auth');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <p className="text-lg sm:text-xl text-gray-600">Redirecting...</p>
    </div>
  );
}
