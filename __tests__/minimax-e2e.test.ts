import { describe, it, expect } from "vitest"

const API_KEY = process.env.MINIMAX_API_KEY
const BASE_URL = "https://api.minimax.io/v1"

describe.skipIf(!API_KEY)("MiniMax E2E", () => {
  it("completes basic chat request", async () => {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "MiniMax-M2.7",
        messages: [{ role: "user", content: 'Say "test passed"' }],
        max_tokens: 20,
      }),
    })

    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.choices[0].message.content).toBeTruthy()
  }, 30000)

  it("handles streaming response", async () => {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "MiniMax-M2.7",
        messages: [{ role: "user", content: "Count 1 to 3" }],
        max_tokens: 50,
        stream: true,
      }),
    })

    expect(response.ok).toBe(true)
    const reader = response.body!.getReader()
    let chunks = 0

    while (true) {
      const { done } = await reader.read()
      if (done) break
      chunks++
    }

    expect(chunks).toBeGreaterThan(1)
  }, 30000)

  it("supports structured JSON output", async () => {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "MiniMax-M2.7",
        messages: [
          {
            role: "user",
            content:
              'Extract the amount and currency from: "I paid $42.50 for lunch". Respond with JSON only: {"amount": "...", "currency": "..."}',
          },
        ],
        max_tokens: 100,
      }),
    })

    expect(response.ok).toBe(true)
    const data = await response.json()
    const content = data.choices[0].message.content
    expect(content).toBeTruthy()
    // Verify it contains JSON-like content
    expect(content).toContain("42.50")
  }, 30000)
})
