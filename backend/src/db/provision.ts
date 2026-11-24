import { readFileSync } from "node:fs"
import { createPool } from "./pool.ts"
import { hashPassword } from "../features/auth/password.ts"

const email = process.argv[2]?.trim().toLowerCase() ?? ""
const name = process.argv[3]?.trim()
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !name) {
  throw new Error('Usage: npm run provision -- admin@example.com "Society Name" (password on stdin)')
}
const password = readFileSync(0, "utf8").replace(/\r?\n$/, "")
if (password.length < 12 || password.length > 256) {
  throw new Error("Provide a password between 12 and 256 characters on stdin")
}
const hash = await hashPassword(password)
const pool = createPool()
try {
  const { rows: [society] } = await pool.query(`
    WITH new_user AS (
      INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id
    ), new_society AS (
      INSERT INTO societies (name) VALUES ($3) RETURNING id
    )
    INSERT INTO society_members (user_id, society_id, role)
    SELECT new_user.id, new_society.id, 'admin' FROM new_user CROSS JOIN new_society
    RETURNING society_id
  `, [email, hash, name])
  console.log("Created society", society.society_id)
} finally {
  await pool.end()
}
