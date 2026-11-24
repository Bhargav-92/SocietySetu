import assert from "node:assert/strict"
import { once } from "node:events"
import { test } from "node:test"
import type { Pool } from "pg"
import { createApp } from "../src/app.ts"
import { hashPassword } from "../src/features/auth/password.ts"
import { tokenHash } from "../src/features/auth/service.ts"

test("sign-in grants access to the account's societies", async t => {
  const password = "test-password-123"
  const user = { id: "user-a", email: "admin@example.com", password_hash: await hashPassword(password) }
  const memberships = [
    { userId: "user-a", id: "society-a", name: "Park View", role: "admin" },
    { userId: "user-b", id: "society-b", name: "Hill View", role: "member" },
  ]
  const sessions = new Map<string, string>()
  const db = {
    async query(sql: string, values: string[]) {
      if (sql.startsWith("SELECT id, email")) {
        return { rows: values[0] === user.email ? [user] : [] }
      }
      if (sql.startsWith("INSERT INTO sessions")) {
        sessions.set(values[0], values[1])
        return { rows: [] }
      }
      assert.match(sql, /m\.user_id = session\.user_id/)
      assert.match(sql, /session\.expires_at > now\(\)/)
      const userId = sessions.get(values[0])
      const rows = memberships.filter(row => row.userId === userId)
        .map(({ id, name, role }) => ({ id, name, role }))
      return { rows: userId && !rows.length ? [{ id: null }] : rows }
    },
  }
  const server = createApp(db as unknown as Pool)
  server.listen(0, "127.0.0.1")
  t.after(() => new Promise<void>(resolve => server.close(() => resolve())))
  await once(server, "listening")
  const address = server.address()
  assert(address && typeof address !== "string")
  const base = "http://127.0.0.1:" + address.port
  const signIn = (candidate: string) => fetch(base + "/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: " ADMIN@example.com ", password: candidate }),
  })
  const societies = (token: string) => fetch(base + "/v1/societies", {
    headers: { Authorization: "Bearer " + token },
  })

  assert.equal((await societies("x".repeat(43))).status, 401)
  assert.equal((await signIn("wrong-password")).status, 401)
  const login = await signIn(password)
  assert.equal(login.status, 200)
  const session = await login.json()
  assert.equal(session.expiresIn, 86400)
  assert.equal(sessions.get(tokenHash(session.accessToken)), user.id)
  assert.deepEqual(session.user, { id: user.id, email: user.email })
  const result = await societies(session.accessToken)
  assert.equal(result.status, 200)
  assert.deepEqual(await result.json(), {
    societies: [{ id: "society-a", name: "Park View", role: "admin" }],
  })
  sessions.set(tokenHash(session.accessToken), "user-without-memberships")
  assert.deepEqual(await (await societies(session.accessToken)).json(), { societies: [] })
})
