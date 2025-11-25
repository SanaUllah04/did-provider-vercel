// app/api/request-human-verification/route.ts
import { NextResponse } from 'next/server';
import { generatePuzzle } from '@/lib/puzzle';
import { kv } from '@vercel/kv';

export async function POST() {  // No input needed now, since internal
  const puzzle = generatePuzzle();
  await kv.set(`puzzle:${puzzle.id}`, { shapes: puzzle.shapes }, { ex: 600 });  // Expire in 10 min
  return NextResponse.json({ puzzleId: puzzle.id, shapes: puzzle.shapes });
}