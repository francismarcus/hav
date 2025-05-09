import { evaluateAnswerRelevancy } from '@/lib/ai/evals/relevancy';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { prompt, tools } from '@/lib/ai/agent';

const sample = [
  {
    question: 'What pay can I expect as an AI engineer?',
  },
  {
    question: 'What are some possible jobs from the programs?',
  },
  {
    question:
      'What are the steps to become a Deep Learning Engineer? and how long does it take?',
  },
  {
    question:
      'I am very interested in self-driving cars and things like that, do you have anything programs in that area?',
  },
  {
    question: 'What will I learn in the sensor fusion program?',
  },
];

async function evaluate() {
  for (const test of sample) {
    try {
      const { text } = await generateText({
        model: openai('gpt-4o'),
        system: prompt,
        messages: [
          {
            role: 'user',
            content: test.question,
          },
        ],
        tools,
        maxSteps: 5,
        onStepFinish: ({ text, toolCalls, toolResults, finishReason }) => {},
      });

      const result = await evaluateAnswerRelevancy({
        input: test.question,
        output: text,
      });

      console.log(
        'Question --->',
        test.question,
        'Score --->',
        result.score,
        'Explanation --->',
        result.explanation
      );
    } catch (error) {
      console.error('Error:', error);
    }
  }

  process.exit(0);
}

evaluate();
