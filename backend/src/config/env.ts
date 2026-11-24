export function databaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is required")
  return url
}

export function serverAddress() {
  const port = Number(process.env.PORT ?? 8000)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535")
  }
  return { host: process.env.HOST ?? "127.0.0.1", port }
}
