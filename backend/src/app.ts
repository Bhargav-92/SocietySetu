import { createServer } from "node:http"
import type { Pool } from "pg"
import { login } from "./features/auth/routes.ts"
import { societies } from "./features/societies/routes.ts"
import { HttpError, json } from "./http.ts"

export function createApp(db: Pool) {
  return createServer(async (request, response) => {
    try {
      const path = request.url?.split("?")[0]
      if (request.method === "POST" && path === "/v1/auth/login") {
        await login(request, response, db)
      } else if (request.method === "GET" && path === "/v1/societies") {
        await societies(request, response, db)
      } else {
        json(response, 404, { error: "Route not found" })
      }
    } catch (error) {
      if (error instanceof HttpError) {
        json(response, error.status, { error: error.message })
      } else {
        console.error("Request failed", error)
        json(response, 500, { error: "Internal server error" })
      }
    }
  })
}
