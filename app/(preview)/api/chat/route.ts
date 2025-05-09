import { retriever } from '@/lib/ai/query-expansion';
import { db } from '@/lib/db';
import { chats } from '@/lib/db/schema/chat';
import { chatIsHuman } from '@/lib/redis';
import { openai } from '@ai-sdk/openai';
import { generateText, streamText, tool } from 'ai';
import {
  bookMeeting,
  findTimeslots,
  createTicket,
  getInformation,
  prompt,
} from '@/lib/ai/agent';
import { after } from 'next/server';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, chatId } = await req.json();

  const isHuman = await chatIsHuman(chatId);

  after(async () => {
    const { text } = await generateText({
      model: openai('gpt-4o'),
      messages,
      system: `Summarize the conversation in a few sentences.`,
    });

    await db
      .insert(chats)
      .values({ chatId, summary: text })
      .onConflictDoUpdate({
        target: chats.chatId,
        set: { summary: text },
      });
  });

  const result = streamText({
    model: openai('gpt-4o'),
    messages,
    system: isHuman
      ? `You are a helpful assistant helping users find information about the courses and programs offered by Udacity.
      Your only goal is to offer the user a follow-up call with a human.
      Use the findTimeslots and bookMeeting tools to help schedule a call.
      Keep responses focused on scheduling the call.
      Do not ask any further questions or provide additional information.
      `
      : prompt,
    tools: isHuman
      ? {
          findTimeslots,
          bookMeeting,
        }
      : {
          getInformation,
          createTicket,
          findTimeslots,
          bookMeeting,
        },
  });

  return result.toDataStreamResponse();
}
