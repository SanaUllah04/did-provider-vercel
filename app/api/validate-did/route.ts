// app/api/validate-did/route.ts
import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { verifySignature, getProviderKeypair } from '@/lib/crypto';

export async function POST(req: Request) {
  const { did, signature, publicKey } = await req.json();
  if (!did || !signature || !publicKey) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const stored = await kv.get<{ did: string; publicKey: string; signature: string }>(`did:${did}`);
  if (!stored || stored.signature !== signature || stored.publicKey !== publicKey) {
    return NextResponse.json({ valid: false });
  }

  const { pub: providerPub } = await getProviderKeypair();
  const pubKeyBytes = Buffer.from(publicKey, 'hex');
  const valid = verifySignature(providerPub, did, signature);

  return NextResponse.json({ valid });
}