import { createApp } from "./app.ts"
import { serverAddress } from "./config/env.ts"
import { createPool } from "./db/pool.ts"

const address = serverAddress()
const pool = createPool()
pool.on("error", error => console.error("Idle database connection error", error))

const server = createApp(pool)
server.listen(address, () => console.log("Society Setu API listening at http://" + address.host + ":" + address.port))

function shutdown() {
  server.close(async () => {
    await pool.end()
  })
}

process.once("SIGINT", shutdown)
process.once("SIGTERM", shutdown)
