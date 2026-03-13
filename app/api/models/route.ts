import { NextRequest, NextResponse } from "next/server"
import { fetchModelsForProvider } from "@/lib/model-fetcher"
import { LLMProvider } from "@/ai/providers/llmProvider"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider, apiKey } = body

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: "Provider and API key are required" },
        { status: 400 }
      )
    }

    const validProviders: LLMProvider[] = ["openai", "google", "mistral"]
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider: ${provider}` },
        { status: 400 }
      )
    }

    const result = await fetchModelsForProvider(provider as LLMProvider, apiKey)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching models:", error)
    return NextResponse.json(
      { error: "Failed to fetch models", models: [] },
      { status: 500 }
    )
  }
}
