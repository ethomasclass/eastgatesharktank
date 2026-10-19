#!/usr/bin/env node
// Encrypts the teacher-only content (payouts, reveal cards, clues, answer notes) so the public
// site and the public repo never hold it in plain text. The site decrypts it in the browser with
// the teacher password.
//
//   node tools/teacher_bundle.mjs encrypt   content/teacher.json  ->  content/teacher.enc.json
//   node tools/teacher_bundle.mjs decrypt   content/teacher.enc.json  ->  content/teacher.json
//
// The password comes from TANK_PASSWORD, or you are asked for it. To change the password:
// decrypt with the old one, then encrypt with the new one.
import { readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { webcrypto as crypto } from 'node:crypto';

const ITER = 250000;
const PLAIN = new URL('../content/teacher.json', import.meta.url);
const SEALED = new URL('../content/teacher.enc.json', import.meta.url);
const b64 = (u8) => Buffer.from(u8).toString('base64');
const unb64 = (s) => new Uint8Array(Buffer.from(s, 'base64'));

async function key(password, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function ask() {
  if (process.env.TANK_PASSWORD) return process.env.TANK_PASSWORD;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question('Teacher password: ', (a) => { rl.close(); res(a.trim()); }));
}

const mode = process.argv[2];
const password = await ask();
if (!password) { console.error('No password given.'); process.exit(1); }

if (mode === 'encrypt') {
  const text = readFileSync(PLAIN, 'utf8');
  JSON.parse(text); // fail early on a typo
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(password, salt), new TextEncoder().encode(text)));
  writeFileSync(SEALED, JSON.stringify({ v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), data: b64(data) }) + '\n');
  console.log('Wrote content/teacher.enc.json');
} else if (mode === 'decrypt') {
  const s = JSON.parse(readFileSync(SEALED, 'utf8'));
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(s.iv) }, await key(password, unb64(s.salt)), unb64(s.data));
    writeFileSync(PLAIN, new TextDecoder().decode(plain));
    console.log('Wrote content/teacher.json (git ignores it; encrypt again after editing)');
  } catch { console.error('Wrong password.'); process.exit(1); }
} else {
  console.error('Usage: node tools/teacher_bundle.mjs encrypt|decrypt');
  process.exit(1);
}
