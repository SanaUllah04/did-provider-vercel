// app/api/verify-human-challenge/route.ts
import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const CORRECT_ORDER = ['circle', 'triangle', 'square'];  // Fixed solution for anti-bot

export async function POST(req: Request) {
  const { puzzleId, userOrder } = await req.json();
  if (!puzzleId || !Array.isArray(userOrder) || userOrder.length !== 3) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const stored = await kv.get<{ shapes: string[] }>(`puzzle:${puzzleId}`);
  if (!stored) return NextResponse.json({ error: 'Invalid or expired puzzle' }, { status: 403 });

  const isValid = userOrder.every((shape, i) => shape === CORRECT_ORDER[i]);
  if (isValid) await kv.del(`puzzle:${puzzleId}`);  // Clean up

  return NextResponse.json({ valid: isValid });
}