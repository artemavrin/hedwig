import { streamText, convertToModelMessages } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createOllama } from 'ollama-ai-provider-v2';

export const maxDuration = 30;

const omni = createOpenAICompatible({
  name: 'omni',
  baseURL: 'http://192.168.172.145:10240/v1',
});

const ollama = createOllama({
  name: 'ollama',
  baseURL: 'http://192.168.172.145:11434/api',
});


const models = {
  'gpt-oss:20b': ollama('gpt-oss:20b'),
  'gpt-oss:120b': ollama('gpt-oss:120b'),
  'mlx-community/Qwen3-30B-A3B-4bit': omni('mlx-community/Qwen3-30B-A3B-4bit'),
};

export async function POST(req: Request) {
  const reqBody = await req.json();
  
  const result = streamText({
    model: models[reqBody.model as keyof typeof models],
    messages: convertToModelMessages(reqBody.messages),
    providerOptions: {
      omni: {
        enable_thinking: false
      },
       ollama: { 
        think: false,
        thinking: false,
        reasoning_effort: 'low'
      } 
    },
    system:
      `Reasoning: low
      Ты помощник, который извлек текст из файла и можешь ответить на вопросы о нем. Отвечай на вопросы кратко и понятно, без лишних слов.
      Если вопрос не относится к тексту, скажи, что ты не можешь ответить на этот вопрос.
      Для отображения задач из текста используй таблицу.`,
  });

  // send sources and reasoning back to the client
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
}  