// The teacher-only content (payouts, reveal cards, clues, answer notes) is shipped encrypted in
// content/teacher.enc.json. The teacher password unlocks it in the browser; nothing readable is
// on the site or in the repository without it. See tools/teacher_bundle.mjs.
import { store } from './store.js';

const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
let cache = null;

async function decrypt(password) {
  const sealed = await (await fetch('content/teacher.enc.json', { cache: 'no-cache' })).json();
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: unb64(sealed.salt), iterations: sealed.iter, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(sealed.iv) }, key, unb64(sealed.data));
  return JSON.parse(new TextDecoder().decode(plain));
}

/** Returns the teacher bundle, or null if the password is wrong. */
export async function unlock(password) {
  try {
    cache = await decrypt(password);
    store.session.set('eastgate.pw', password);
    return cache;
  } catch { return null; }
}

/** The bundle if this browser tab was already unlocked. */
export async function unlocked() {
  if (cache) return cache;
  const pw = store.session.get('eastgate.pw');
  return pw ? unlock(pw) : null;
}

export function lock() { cache = null; store.session.del('eastgate.pw'); }
