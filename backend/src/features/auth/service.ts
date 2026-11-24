import { createHash, randomBytes } from "node:crypto"
import { verifyPassword } from "./password.ts"

const fallbackHash = "0".repeat(32) + ":" + "0".repeat(128)
const sessionLifetimeSeconds = 86400

export function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function signIn(db: import("pg").Pool, email: string, password: string) {
  const { rows: [user] } = await db.query(
    "SELECT id, email, password_hash FROM users WHERE email = $1",
    [email],
  )
  if (!(await verifyPassword(password, user?.password_hash ?? fallbackHash)) || !user) return null

  const token = randomBytes(32).toString("base64url")
  await db.query(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + $3 * interval '1 second')",
    [tokenHash(token), user.id, sessionLifetimeSeconds],
  )
  return { accessToken: token, tokenType: "Bearer", expiresIn: sessionLifetimeSeconds, user: { id: user.id, email: user.email } }
}
