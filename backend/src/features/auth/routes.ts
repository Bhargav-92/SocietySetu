import type { IncomingMessage, ServerResponse } from "node:http"
import type { Pool } from "pg"
import { HttpError, json, readJson } from "../../http.ts"
import { signIn } from "./service.ts"

export async function login(request: IncomingMessage, response: ServerResponse, db: Pool) {
  const input = await readJson(request) as { email?: unknown; password?: unknown } | null
  const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : ""
  const password = input?.password
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      typeof password !== "string" || !password || password.length > 256) {
    throw new HttpError(400, "A valid email and password are required")
  }

  const session = await signIn(db, email, password)
  if (!session) throw new HttpError(401, "Invalid email or password")
  json(response, 200, session)
}
