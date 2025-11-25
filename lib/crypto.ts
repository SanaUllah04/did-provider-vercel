// lib/crypto.ts
import { ed25519 } from '@noble/curves/ed25519';
import { base58btc } from '@scure/base';

// multicodec code for ed25519-pub = 0xed
const ED25519_MULTICODEC = Uint8Array.from([0xed, 0x01]);

export function generateKeyPair() {
  const privKey = ed25519.utils.randomPrivateKey();
  const pubKey = ed25519.getPublicKey(privKey);
  return { privKey, pubKey };
}

export function createDidKey(pubKey: Uint8Array): string {
  const prefixed = Uint8Array.from([...ED25519_MULTICODEC, ...pubKey]);
  return `did:key:z${base58btc.encode(prefixed)}`;
}

export function signMessage(privKey: Uint8Array, msg: string): string {
  return Buffer.from(ed25519.sign(sha256(msg), privKey)).toString('hex');  // Use sha256 for message hash
}

export function verifySignature(pubKey: Uint8Array, msg: string, sigHex: string): boolean {
  try {
    const sig = Buffer.from(sigHex, 'hex');
    return ed25519.verify(sig, sha256(msg), pubKey);
  } catch {
    return false;
  }
}

import { sha256 } from '@noble/hashes/sha256';

// Provider's long-term keypair (stored in KV for persistence)
let cachedProviderKeypair: { priv: Uint8Array; pub: Uint8Array } | null = null;

export async function getProviderKeypair(): Promise<{ priv: Uint8Array; pub: Uint8Array }> {
  if (cachedProviderKeypair) return cachedProviderKeypair;

  const { kv } = await import('@vercel/kv');
  let stored = await kv.get<{ priv: string; pub: string }>('provider_keypair');

  if (!stored) {
    const { privKey, pubKey } = generateKeyPair();
    stored = {
      priv: Buffer.from(privKey).toString('hex'),
      pub: Buffer.from(pubKey).toString('hex'),
    };
    await kv.set('provider_keypair', stored);
  }

  cachedProviderKeypair = {
    priv: Buffer.from(stored.priv, 'hex'),
    pub: Buffer.from(stored.pub, 'hex'),
  };
  return cachedProviderKeypair;
}