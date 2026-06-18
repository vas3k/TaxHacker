import { beforeAll, describe, expect, it } from "vitest"
import { decryptSecret, encryptSecret, isEncrypted } from "./encryption"

beforeAll(() => {
  process.env.BETTER_AUTH_SECRET = "test-secret-key-for-encryption-unit-tests"
})

describe("encryption", () => {
  it("round-trips a secret", () => {
    const plain = "app-password-1234"
    const enc = encryptSecret(plain)
    expect(enc).not.toBe(plain)
    expect(enc.startsWith("v1:")).toBe(true)
    expect(decryptSecret(enc)).toBe(plain)
  })

  it("produces a different ciphertext each call (random IV)", () => {
    expect(encryptSecret("same")).not.toBe(encryptSecret("same"))
  })

  it("passes through unencrypted (legacy plaintext) values", () => {
    expect(decryptSecret("legacy-plaintext")).toBe("legacy-plaintext")
    expect(isEncrypted("legacy-plaintext")).toBe(false)
    expect(isEncrypted("v1:aaa:bbb:ccc")).toBe(true)
  })

  it("round-trips empty string", () => {
    expect(decryptSecret(encryptSecret(""))).toBe("")
  })
})
