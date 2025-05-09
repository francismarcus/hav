import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export interface CompressionInput {
  query: string;
  context: string;
}
const noOutputStr = 'NO_RELEVANT_CONTENT';


/*
  Unused for now
  Was tested for window expansion
*/

export async function compression(input: CompressionInput): Promise<string> {
  const { query, context } = input;

  const { text } = await generateText({
    model: openai('gpt-4'),
    prompt: `Given the following question and context, extract any part of the context *AS IS* that is relevant to answer the question. If none of the context is relevant return ${noOutputStr}.

Remember, *DO NOT* edit the extracted parts of the context.

> Question: ${query}
> Context:
>>>
${context}
>>>
Extracted relevant parts:`,
  });

  if (text.includes(noOutputStr)) {
    return '';
  }

  return text;
}
