import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';

const model = openai.embedding('text-embedding-ada-002');

export const generateEmbedding = async (input: string): Promise<number[]> => {
  const value = input.replaceAll('\n', ' ');
  const { embedding } = await embed({
    model,
    value,
  });
  return embedding;
};
