import { tokenHash } from "../auth/service.ts"

export async function listSocieties(db: import("pg").Pool, token: string) {
  const { rows } = await db.query(
    `SELECT s.id, s.name, m.role
     FROM sessions AS session
     LEFT JOIN society_members AS m ON m.user_id = session.user_id
     LEFT JOIN societies AS s ON s.id = m.society_id
     WHERE session.token_hash = $1 AND session.expires_at > now()
     ORDER BY s.name, s.id`,
    [tokenHash(token)],
  )
  return rows.length ? rows.filter(row => row.id !== null) : null
}
