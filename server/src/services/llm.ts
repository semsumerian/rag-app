import OpenAI from 'openai';
import { config } from '../config';
import { ChatMessage } from '../types';

const openai = new OpenAI({
  baseURL: config.lmStudio.baseURL,
  apiKey: 'not-needed'
});

interface Source {
  filename: string;
  content: string;
  relevance: number;
}

export async function* generateChatResponse(
  message: string,
  sources: Source[],
  history: ChatMessage[] = []
): AsyncGenerator<string> {
  const systemPrompt = buildSystemPrompt(sources);
  
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(msg => ({
      role: msg.role,
      content: msg.content
    }) as OpenAI.Chat.ChatCompletionMessageParam),
    { role: 'user', content: message }
  ];
  
  try {
    const stream = await openai.chat.completions.create({
      model: config.lmStudio.llmModel,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2048
    });
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw new Error('Failed to generate response');
  }
}

function buildSystemPrompt(sources: Source[]): string {
  if (sources.length === 0) {
    return 'You are a helpful assistant. Answer the user\'s question based on your knowledge.';
  }

  // Limit to top 3 most relevant sources to avoid context overflow
  const limitedSources = sources.slice(0, 3);

  const context = limitedSources
    .map((source, index) => `\n[Document ${index + 1}: ${source.filename}]\n${source.content.substring(0, 1000)}`)
    .join('\n');

  return `You are a helpful assistant. Answer the user's question based on the following context from uploaded documents. If the answer cannot be found in the context, say so clearly.

Context:
${context}

Answer the user's question based on the context above. Be concise and accurate.`;
}
