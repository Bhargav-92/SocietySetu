import pg from "pg"
import { databaseUrl } from "../config/env.ts"

export function createPool() {
  return new pg.Pool({ connectionString: databaseUrl() })
}
