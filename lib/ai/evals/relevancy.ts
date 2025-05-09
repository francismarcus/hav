import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

interface Params {
  input: string;
  output: string;
}

interface Result {
  score: number;
  explanation: string;
  statements: string[];
}

export async function evaluateAnswerRelevancy(test: Params): Promise<Result> {
  const { object } = await generateObject({
    model: openai('gpt-4'),
    system: `You are an evaluation assistant. Your task is to:
    1. First, extract all distinct statements from the output
    2. Then, evaluate the relevancy of each statement to the input question
    
    A statement is a complete thought or claim that can stand on its own.
    Break down the output into individual statements, ensuring each statement is self-contained and meaningful.
    Do not combine multiple statements into one.
    Do not include statements that are just connecting words or phrases.
    
    A relevant statement:
    1. Directly addresses the input question
    2. Provides information that is pertinent to the question
    3. Stays focused on the topic of the question
    4. Does not include irrelevant information
    
    Calculate the overall score as: number of relevant statements / total number of statements`,
    schema: z.object({
      statements: z
        .array(z.string())
        .describe('List of individual statements extracted from the output'),
      score: z
        .number()
        .min(0)
        .max(1)
        .describe(
          'The relevancy score (relevant statements / total statements)'
        ),
      explanation: z
        .string()
        .describe(
          'Detailed explanation of which statements are relevant and which are not'
        ),
      statementEvaluations: z
        .array(
          z.object({
            statement: z.string(),
            isRelevant: z.boolean(),
            reason: z.string(),
          })
        )
        .describe('Evaluation of each individual statement'),
    }),
    prompt: `Input Question:\n${test.input}\n\nOutput to evaluate:\n${test.output}\n\n1. Extract all distinct statements from the output\n2. Evaluate the relevancy of each statement to the input question`,
  });

  return {
    score: object.score,
    explanation: object.explanation,
    statements: object.statements,
  };
}
