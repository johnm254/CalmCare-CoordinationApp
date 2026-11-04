#!/usr/bin/env node
// Run every migration in supabase/migrations/ in order.
// Each migration runs in its own transaction and its own try/catch — if one
// fails, the rest still execute.  Results are tracked in _schema_migrations.
//
// Usage:
//   DB_PASSWORD=yourpassword node supabase/scripts/run_all_migrations.cjs
//
// Get DB password:
//   supabase.com/dashboard/project/rtlhckntjrhdhbaqzxoy/settings/database

const { Client } = require("pg")
const fs = require("fs")
const path = require("path")

// ── Config ────────────────────────────────────────────────────────────────────

const DB_PASSWORD = process.env.DB_PASSWORD
if (!DB_PASSWORD) {
  console.error("❌  Set DB_PASSWORD env var first:")
  console.error("   DB_PASSWORD=yourpassword node supabase/scripts/run_all_migrations.cjs")
  process.exit(1)
}

const CONNECTION_STRING =
  `postgresql://postgres.rtlhckntjrhdhbaqzxoy:${DB_PASSWORD}` +
  `@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`

const MIGRATIONS_DIR = path.join(__dirname, "..", "migrations")

// ── Helpers ───────────────────────────────────────────────────────────────────

async function ensureTrackingTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      id          SERIAL       PRIMARY KEY,
      filename    TEXT         UNIQUE NOT NULL,
      applied_at  TIMESTAMPTZ  DEFAULT NOW(),
      success     BOOLEAN      NOT NULL,
      error_msg   TEXT
    )
  `)
}

async function appliedMigrations(client) {
  const { rows } = await client.query(
    "SELECT filename FROM _schema_migrations WHERE success = true"
  )
  return new Set(rows.map((r) => r.filename))
}

async function recordResult(client, filename, success, errorMsg = null) {
  await client.query(
    `INSERT INTO _schema_migrations (filename, success, error_msg)
     VALUES ($1, $2, $3)
     ON CONFLICT (filename) DO UPDATE
       SET success    = EXCLUDED.success,
           applied_at = NOW(),
           error_msg  = EXCLUDED.error_msg`,
    [filename, success, errorMsg]
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  console.log("✔  Connected to Supabase\n")

  await ensureTrackingTable(client)

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()

  if (files.length === 0) {
    console.log("No migration files found in", MIGRATIONS_DIR)
    await client.end()
    return
  }

  const applied = await appliedMigrations(client)

  let passed = 0
  let failed = 0
  let skipped = 0

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`⏭   ${file}  (already applied)`)
      skipped++
      continue
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8")

    // Each migration runs inside its own transaction so a failure is fully
    // rolled back and does not corrupt the schema for subsequent migrations.
    try {
      await client.query("BEGIN")
      await client.query(sql)
      await client.query("COMMIT")
      await recordResult(client, file, true)
      console.log(`✔   ${file}`)
      passed++
    } catch (err) {
      try { await client.query("ROLLBACK") } catch {}
      await recordResult(client, file, false, err.message)
      console.error(`❌  ${file}`)
      console.error(`    ${err.message.split("\n")[0]}`)
      failed++
      // Continue — do NOT exit; next migration still runs
    }
  }

  await client.end()

  const total = files.length
  console.log(
    `\n── Summary ──────────────────────────────────────────────\n` +
    `   Total     : ${total}\n` +
    `   Applied   : ${passed}\n` +
    `   Skipped   : ${skipped}\n` +
    `   Failed    : ${failed}\n` +
    `─────────────────────────────────────────────────────────`
  )

  if (failed > 0) {
    console.error(`\n${failed} migration(s) failed — check errors above.`)
    process.exit(1)
  }
}

run().catch((err) => {
  console.error("Fatal:", err.message)
  process.exit(2)
})
