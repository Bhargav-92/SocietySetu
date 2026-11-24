import type { IncomingMessage, ServerResponse } from "node:http"
import type { Pool } from "pg"
import { HttpError, json } from "../../http.ts"
import { listSocieties } from "./service.ts"

export async function societies(request: IncomingMessage, response: ServerResponse, db: Pool) {
  const match = /^Bearer ([A-Za-z0-9_-]{43})$/i.exec(request.headers.authorization ?? "")
  const rows = match ? await listSocieties(db, match[1]) : null
  if (!rows) {
    response.setHeader("WWW-Authenticate", "Bearer")
    throw new HttpError(401, "A valid session is required")
  }
  json(response, 200, { societies: rows })
}
