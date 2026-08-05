// Run locally with: node scripts/hash-password.mjs "your-chosen-password"
// It never sends your password anywhere — everything happens on your machine.
// Copy the printed value into the ADMIN_PASSWORD_HASH secret in Cloudflare.

import { webcrypto as crypto } from 'node:crypto';

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "your-chosen-password"');
  process.exit(1);
}

const encoder = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));

const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'PBKDF2' }, false, [
  'deriveBits',
]);

const bits = await crypto.subtle.deriveBits(
  { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
  keyMaterial,
  256,
);

const toHex = (buf) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const saltHex = toHex(salt);
const hashHex = toHex(bits);

console.log('\nPaste this whole value as your ADMIN_PASSWORD_HASH secret:\n');
console.log(`${saltHex}:${hashHex}`);
console.log('');
