import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

interface Params {
  input: string;
  context: string;
  output: string;
}

interface Result {
  score: number;
  explanation: string;
}

export async function evaluateFaithfulness(test: Params): Promise<Result> {
  const { object } = await generateObject({
    model: openai('gpt-4o'),
    system: `You are an evaluation assistant. Your task is to determine if the output is faithful to the retrieved context.
    A faithful output:
    1. Only contains information that is present in the retrieved context
    2. Does not add any information that cannot be inferred from the retrieved context
    3. Does not contradict any information in the retrieved context
    4. Does not infer any information that is not present in the retrieved context
    
    Scoring Formula:
    Score = number of claims in the output that are faithful to the retrieved context / total number of claims in the output
    
    For example:
    - If output has 4 claims and 3 are faithful, score = 3/4 = 0.75
    - If output has 2 claims and both are faithful, score = 2/2 = 1.0
    - If output has 3 claims and none are faithful, score = 0/3 = 0.0`,
    schema: z.object({
      score: z
        .number()
        .min(0)
        .max(1)
        .describe('The faithfulness score (faithful claims / total claims)'),
      explanation: z
        .string()
        .describe(
          'Detailed explanation of which claims are faithful and which are not'
        ),
    }),
    prompt: `Input Question:\n${test.input}\n\nRetrieved Context:\n${test.context}\n\nGenerated Output:\n${test.output}\n\nEvaluate the faithfulness of the output to the retrieved context:`,
  });

  return {
    score: object.score,
    explanation: object.explanation,
  };
}
