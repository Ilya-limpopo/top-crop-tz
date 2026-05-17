// Tiny CLI: hashes a password with argon2id and prints the result so the
// admin can paste it into ADMIN_PASSWORD_HASH in .env.
//
//   node scripts/hash-password.js "my secret"
//   npm run admin:hash -- "my secret"

import argon2 from 'argon2';

const pw = process.argv[2];
if (!pw) {
  console.error('Usage: node scripts/hash-password.js "<password>"');
  process.exit(2);
}

const hash = await argon2.hash(pw, { type: argon2.argon2id });
console.log(hash);
