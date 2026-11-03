/**
 * run-migrations.mjs
 * Pushes all SQL migrations to the live Supabase project
 * using the Management API + personal access token.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=<your-pat> node run-migrations.mjs
 *
 * Get a PAT at: https://supabase.com/dashboard/account/tokens
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECT_REF = 'rtlhckntjrhdhbaqzxoy';
const PAT         = process.env.SUPABASE_ACCESS_TOKEN;

if (!PAT) {
  console.error('Error: SUPABASE_ACCESS_TOKEN env var is required.');
  console.error('Get one at https://supabase.com/dashboard/account/tokens');
  console.error('Then run:  SUPABASE_ACCESS_TOKEN=sbp_xxx node run-migrations.mjs');
  process.exit(1);
}

const migrationsDir = path.join(__dirname, 'supabase', 'migrations');

const files = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`Found ${files.length} migration files.\n`);

for (const file of files) {
  const sql  = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  process.stdout.write(`Running ${file} … `);

  const res  = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${PAT}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    console.error(`FAILED (${res.status})\n${body}`);
    process.exit(1);
  }

  console.log('OK');
}

console.log('\nAll migrations applied successfully.');
