import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto"

const PREFIX = "v1"
const ALGO = "aes-256-gcm"

let cachedKey: { secret: string; key: Buffer } | undefined

function getKey(): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET || "insecure-self-hosted-secret"
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required to encrypt/decrypt email credentials")
  }
  // scrypt is intentionally slow; memoize per secret so a batch sync derives the key once.
  if (cachedKey?.secret !== secret) {
    cachedKey = { secret, key: scryptSync(secret, "taxhacker-email-credentials", 32) }
  }
  return cachedKey.key
}

export function isEncrypted(value: string): boolean {
  return typeof value === "string" && value.startsWith(`${PREFIX}:`)
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, getKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [PREFIX, iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(":")
}

export function decryptSecret(stored: string): string {
  if (!isEncrypted(stored)) {
    return stored
  }
  const [, ivB64, tagB64, dataB64] = stored.split(":")
  const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, "base64"))
  decipher.setAuthTag(Buffer.from(tagB64, "base64"))
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8")
}
