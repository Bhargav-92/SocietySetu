import { readdir, readFile } from "node:fs/promises"
import { createPool } from "./pool.ts"

const directory = new URL("../../migrations/", import.meta.url)
const pool = createPool()

try {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    await client.query("SELECT pg_advisory_xact_lock(872031)")
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`)
    const { rows } = await client.query("SELECT filename FROM schema_migrations")
    const applied = new Set(rows.map(row => row.filename))
    for (const filename of (await readdir(directory)).sort()) {
      if (!filename.endsWith(".sql") || applied.has(filename)) continue
      await client.query(await readFile(new URL(filename, directory), "utf8"))
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [filename])
      console.log("Applied", filename)
    }
    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
} finally {
  await pool.end()
}
