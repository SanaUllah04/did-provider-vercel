'use client';
import { useRouter } from 'next/navigation';

export default function Signup() {
  const router = useRouter();

  const startDidSignup = async () => {
    const res = await fetch('/api/request-human-verification', { method: 'POST' });
    if (!res.ok) return alert('Error starting verification');

    const { puzzleId, shapes } = await res.json();
    router.push(`/verify?puzzleId=${puzzleId}&shapes=${shapes.join(',')}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-900 to-purple-900 text-white flex items-center justify-center p-4">
      <div className="bg-black/30 p-8 rounded-xl max-w-md w-full text-center">
        <h1 className="text-3xl mb-6">Sign Up for Movie Site</h1>
        <button
          onClick={startDidSignup}
          className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg text-lg w-full"
        >
          Sign Up with DID (No Personal Info)
        </button>
      </div>
    </div>
  );
}