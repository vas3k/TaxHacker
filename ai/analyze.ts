"use server"

import { ActionState } from "@/lib/actions"
import config from "@/lib/config"
import OpenAI from "openai"
import { AnalyzeAttachment } from "./attachments"
import { updateFile } from "@/models/files"
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"

export type AnalysisResult = {
  output: Record<string, string>
  tokensUsed: number
}

export async function analyzeTransaction(
  prompt: string,
  schema: Record<string, unknown>,
  attachments: AnalyzeAttachment[],
  apiKey: string,
  fileId: string,
  userId: string
): Promise<ActionState<AnalysisResult>> {
  console.log("RUNNING AI ANALYSIS")
  console.log("PROMPT:", prompt)
  console.log("SCHEMA:", schema)

  try {
    // Determine which AI provider to use
    const provider = config.ai.provider

    if (provider === "google") {
      return await analyzeWithGoogle(prompt, schema, attachments, apiKey, fileId, userId)
    } else {
      return await analyzeWithOpenAI(prompt, schema, attachments, apiKey, fileId, userId)
    }
  } catch (error) {
    console.error("AI Analysis error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to analyze invoice",
    }
  }
}

async function analyzeWithOpenAI(
  prompt: string,
  schema: Record<string, unknown>,
  attachments: AnalyzeAttachment[],
  apiKey: string,
  fileId: string,
  userId: string
): Promise<ActionState<AnalysisResult>> {
  const openai = new OpenAI({
    apiKey,
  })

  const response = await openai.responses.create({
    model: config.ai.modelName,
    input: [
      {
        role: "user",
        content: prompt,
      },
      {
        role: "user",
        content: attachments.map((attachment) => ({
          type: "input_image",
          detail: "auto",
          image_url: `data:${attachment.contentType};base64,${attachment.base64}`,
        })),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "transaction",
        schema: schema,
        strict: true,
      },
    },
  })

  console.log("OpenAI response:", response.output_text)
  console.log("OpenAI tokens used:", response.usage)

  const result = JSON.parse(response.output_text)

  await updateFile(fileId, userId, { cachedParseResult: result })

  return { success: true, data: { output: result, tokensUsed: response.usage?.total_tokens || 0 } }
}

async function analyzeWithGoogle(
  prompt: string,
  schema: Record<string, unknown>,
  attachments: AnalyzeAttachment[],
  apiKey: string,
  fileId: string,
  userId: string
): Promise<ActionState<AnalysisResult>> {
  // Initialize Google AI
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: config.ai.googleModelName });

  // Process images for Google's API
  const googleImages = await Promise.all(
    attachments.map(async (attachment) => {
      return {
        inlineData: {
          data: attachment.base64,
          mimeType: attachment.contentType
        }
      };
    })
  );

  // Add schema instructions to the prompt
  const schemaInstructions = `Return the result as a valid JSON object matching this schema: ${JSON.stringify(schema)}. The response must be a valid JSON object and nothing else.`;
  const fullPrompt = `${prompt}\n\n${schemaInstructions}`;

  // Configure safety settings
  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ];

  // Generate content
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: fullPrompt }, ...googleImages] }],
    generationConfig: {
      temperature: 0.4,
      topP: 0.95,
      topK: 40,
    },
    safetySettings
  });

  const response = result.response;
  const responseText = response.text();
  console.log("Google AI response:", responseText);

  try {
    // Extract JSON from response
    let jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                   responseText.match(/```\n([\s\S]*?)\n```/) ||
                   responseText.match(/{[\s\S]*?}/);

    let jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText;

    // Clean up the string to ensure it's valid JSON
    jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '').trim();

    const parsedResult = JSON.parse(jsonStr);

    await updateFile(fileId, userId, { cachedParseResult: parsedResult });

    // Google doesn't provide token usage info like OpenAI, so we'll use a rough estimate
    // based on prompt and response length
    const tokensEstimate = Math.ceil((fullPrompt.length + responseText.length) / 4);

    return {
      success: true,
      data: {
        output: parsedResult,
        tokensUsed: tokensEstimate
      }
    };
  } catch (error) {
    console.error("Error parsing Google AI response:", error);
    return {
      success: false,
      error: "Failed to parse AI response into valid JSON"
    };
  }
}
