import { describe, expect, it } from "vitest"
import { validateImapTarget } from "./imap-validation"

describe("validateImapTarget", () => {
  it("rejects localhost names", async () => {
    await expect(validateImapTarget("localhost", 993)).rejects.toThrow(/localhost/i)
  })

  it("rejects disallowed ports", async () => {
    await expect(validateImapTarget("imap.example.com", 587)).rejects.toThrow(/port/i)
  })

  it("rejects private IP addresses", async () => {
    await expect(validateImapTarget("192.168.1.10", 993)).rejects.toThrow(/private/i)
  })

  it("rejects direct IP literals by default", async () => {
    await expect(validateImapTarget("8.8.8.8", 993)).rejects.toThrow(/direct ip/i)
  })

  it("accepts public hostnames that resolve to public IPs", async () => {
    const result = await validateImapTarget("imap.example.com", 993, {
      resolveHost: async () => ["1.1.1.1"],
    })

    expect(result.host).toBe("imap.example.com")
    expect(result.resolvedIps).toEqual(["1.1.1.1"])
  })
})
