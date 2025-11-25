// app/api/generate-did/route.ts
import { NextResponse } from 'next/server';
import { createDidKey, generateKeyPair, signMessage, getProviderKeypair } from '@/lib/crypto';
import { kv } from '@vercel/kv';

export async function POST(req: Request) {
  const { puzzleId } = await req.json();
  if (!puzzleId) return NextResponse.json({ error: 'Missing puzzleId' }, { status: 400 });

  // Verify puzzle was solved (existence check post-verification)
  const stored = await kv.get(`puzzle:${puzzleId}`);
  if (stored) return NextResponse.json({ error: 'Puzzle not verified' }, { status: 403 });

  const { pubKey } = generateKeyPair();
  const did = createDidKey(pubKey);
  const message = did;  // Sign the DID itself
  const { priv: providerPriv } = await getProviderKeypair();
  const signature = signMessage(providerPriv, message);

  const record = {
    did,
    publicKey: Buffer.from(pubKey).toString('hex'),
    signature,
    issuedAt: Date.now(),
  };

  await kv.set(`did:${did}`, record);  // Store for validation

  return NextResponse.json({
    did,
    publicKey: record.publicKey,
    signature,
  });
}