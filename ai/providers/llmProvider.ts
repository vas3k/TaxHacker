import { ChatOpenAI } from "@langchain/openai"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatMistralAI } from "@langchain/mistralai"
import { BaseMessage, HumanMessage } from "@langchain/core/messages"

export type LLMProvider = "openai" | "google" | "mistral"

export interface LLMConfig {
  provider: LLMProvider
  apiKey: string
  model: string
}

export interface LLMSettings {
  providers: LLMConfig[]
}

export interface LLMRequest {
  prompt: string
  schema?: Record<string, unknown>
  attachments?: any[]
}

export interface LLMResponse {
  output: Record<string, string>
  tokensUsed?: number
  provider: LLMProvider
  error?: string
}

async function requestLLMUnified(config: LLMConfig, req: LLMRequest): Promise<LLMResponse> {
  try {
    const temperature = 0;
    let model: any;
    if (config.provider === "openai") {
      model = new ChatOpenAI({
        apiKey: config.apiKey,
        model: config.model,
        temperature: temperature,
      });
    } else if (config.provider === "google") {
      model = new ChatGoogleGenerativeAI({
        apiKey: config.apiKey,
        model: config.model,
        temperature: temperature,
      });
    } else if (config.provider === "mistral") {
      model = new ChatMistralAI({
        apiKey: config.apiKey,
        model: config.model,
        temperature: temperature,
      });
    } else {
      return {
        output: {},
        provider: config.provider,
        error: "Unknown provider",
      };
    }

    const structuredModel = model.withStructuredOutput(req.schema, { 'name': 'transaction'});

    let message_content: any = [{ type: "text", text: req.prompt }];
    if (req.attachments && req.attachments.length > 0) {
      const images = req.attachments.map(att => ({
        type: "image_url",
        image_url: {
          url: `data:${att.contentType};base64,${att.base64}`
        },
      }));
      message_content.push(...images);
    }
    const messages: BaseMessage[] = [
      new HumanMessage({ content: message_content })
    ];

    const response = await structuredModel.invoke(messages);

    return {
      output: response,
      provider: config.provider,
    };
  } catch (error: any) {
    return {
      output: {},
      provider: config.provider,
      error: error instanceof Error ? error.message : `${config.provider} request failed`,
    };
  }
}

export async function requestLLM(settings: LLMSettings, req: LLMRequest): Promise<LLMResponse> {
  for (const config of settings.providers) {
    if (!config.apiKey || !config.model) {
      console.info('Skipping provider:', config.provider);
      continue;
    }
    console.info('Use provider:', config.provider);

    const response = await requestLLMUnified(config, req);

    if (!response.error) {
      return response;
    }
    else {
      console.error(response.error)
    }
  }

  return {
    output: {},
    provider: settings.providers[0]?.provider || "openai",
    error: "All LLM providers failed or are not configured",
  };
}
