#!/usr/bin/env node
// Usage: DB_PASSWORD=yourpassword node supabase/run_migration.js
// Get DB password from: supabase.com/dashboard/project/rtlhckntjrhdhbaqzxoy/settings/database

const { Client } = require("pg")
const fs = require("fs")
const path = require("path")

const DB_PASSWORD = process.env.DB_PASSWORD
if (!DB_PASSWORD) {
  console.error("❌  Set DB_PASSWORD env var first:")
  console.error("   DB_PASSWORD=yourpassword node supabase/run_migration.js")
  console.error(
    "   Get it from: supabase.com/dashboard/project/rtlhckntjrhdhbaqzxoy/settings/database",
  )
  process.exit(1)
}

const client = new Client({
  connectionString: `postgresql://postgres.rtlhckntjrhdhbaqzxoy:${DB_PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`,
  ssl: { rejectUnauthorized: false },
})

async function run() {
  await client.connect()
  console.log("✔ Connected to Supabase database")

  const sql = fs.readFileSync(
    path.join(__dirname, "migrations", "002_schema_patch.sql"),
    "utf8",
  )

  try {
    await client.query(sql)
    console.log("✔ Schema patch applied successfully")
  } catch (err) {
    console.error("❌ Migration error:", err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
