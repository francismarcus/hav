import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

interface EvaluationResult {
  score: number;
  explanation: string;
  retrieved: string;
}

interface Params {
  question: string;
  reference: string;
}

export async function recallEval(
  test: Params,
  retriever: (question: string) => Promise<string>
): Promise<EvaluationResult> {
  const retrievedContext = await retriever(test.question);

  const { object } = await generateObject({
    model: openai('gpt-4o'),
    system: `You are an evaluation assistant. Your task is to determine which claims from the reference context are supported by the retrieved context.
    A claim is considered supported if the retrieved context contains the same information, even if worded differently.
    
    Scoring Formula:
    Score = number of claims in the reference supported by the retrieved context / total number of claims in the reference
    
    For example:
    - If reference has 4 claims and 3 are supported, score = 3/4 = 0.75
    - If reference has 2 claims and both are supported, score = 2/2 = 1.0
    - If reference has 3 claims and none are supported, score = 0/3 = 0.0`,
    schema: z.object({
      score: z
        .number()
        .min(0)
        .max(1)
        .describe('The recall score (supported claims / total claims)'),
      explanation: z.string().describe('Brief explanation of the score'),
    }),
    prompt: `Reference Context:\n${test.reference}\n\nRetrieved Context:\n${retrievedContext}\n\nEvaluate which claims are supported and provide a score:`,
  });

  return {
    score: object.score,
    explanation: object.explanation,
    retrieved: retrievedContext,
  };
}
