import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const deriveKey = promisify(scrypt)

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex")
  const key = await deriveKey(password, salt, 64)
  return salt + ":" + key.toString("hex")
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(":")
  if (!/^[0-9a-f]{32}$/.test(salt ?? "") || !/^[0-9a-f]{128}$/.test(key ?? "")) return false
  return timingSafeEqual(await deriveKey(password, salt, 64), Buffer.from(key, "hex"))
}
