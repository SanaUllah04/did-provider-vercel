'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const SHAPES = ['circle', 'square', 'triangle'];
const CORRECT_ORDER = ['circle', 'triangle', 'square'];

export default function Verify() {
  const params = useSearchParams();
  const puzzleId = params.get('puzzleId');
  const shapes = params.get('shapes')?.split(',') || SHAPES;  // From query
  const router = useRouter();

  const [dragged, setDragged] = useState<string[]>([]);
  const [status, setStatus] = useState('');

  const onDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const shape = e.dataTransfer.getData('text');
    if (!dragged.includes(shape)) {
      const newDragged = [...dragged];
      newDragged[index] = shape;  // Place at specific slot
      setDragged(newDragged.filter(Boolean));  // Filter empties
      if (newDragged.length === 3) checkOrder(newDragged);
    }
  };

  const checkOrder = async (order: string[]) => {
    const res = await fetch('/api/verify-human-challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ puzzleId, userOrder: order }),
    });
    const { valid } = await res.json();

    if (valid) {
      const genRes = await fetch('/api/generate-did', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puzzleId }),
      });
      const { did, publicKey, signature } = await genRes.json();

      // Directly validate
      const valRes = await fetch('/api/validate-did', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did, signature, publicKey }),
      });
      const { valid: isValid } = await valRes.json();

      if (isValid) {
        document.cookie = `did=${did}; path=/; max-age=31536000; secure; samesite=strict`;
        router.push('/dashboard');
      } else {
        setStatus('Invalid DID');
      }
    } else {
      setStatus('Wrong order - try again');
      setDragged([]);
    }
  };

  if (!puzzleId) return <div>Invalid access</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl mb-6">Human Verification</h1>
      <p className="mb-6 text-center">Drag the shapes into the slots in this order: Circle → Triangle → Square</p>

      <div className="flex flex-wrap gap-4 mb-8 justify-center">
        {shapes.map((s) => (
          <div
            key={s}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text', s)}
            className="w-20 h-20 bg-blue-500 rounded flex items-center justify-center text-4xl cursor-grab active:cursor-grabbing"
          >
            {s === 'circle' ? '○' : s === 'square' ? '□' : '△'}
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            onDrop={(e) => onDrop(e, i)}
            onDragOver={(e) => e.preventDefault()}
            className="w-24 h-24 border-2 border-dashed border-white rounded flex items-center justify-center text-4xl"
          >
            {dragged[i] ? (dragged[i] === 'circle' ? '○' : dragged[i] === 'square' ? '□' : '△') : ''}
          </div>
        ))}
      </div>

      {status && <p className="mt-6 text-red-300">{status}</p>}
    </div>
  );
}