import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { tool } from 'ai';
import { retriever } from './query-expansion';

export const prompt = `You are a helpful assistant helping users find information about the courses and programs offered by Udacity.
First, use the getInformation tool to search for relevant information about the user's question.
Then, if you have found relevant information, use it to provide a clear and concise answer.
If you haven't found relevant information, use the createTicket tool to escalate the question.
If the user seems interested in a course or asks for a call, offer to book a follow-up call using the findTimeslots and bookMeeting tools.
Keep responses short and concise. Answer in a single sentence where possible.
If you are unsure, use the getInformation tool again with a different query.
Use your abilities as a reasoning machine to answer questions based on the information you do have.`;

export const findTimeslots = tool({
  description: `Find timeslots for a meeting with a human.`,
  parameters: z.object({
    day: z.string().describe('The day you need to find timeslots for'),
  }),
  execute: async ({ day }) => {
    return `I found the following timeslots for ${day}: 10:00 AM, 11:00 AM, 12:00 PM`;
  },
});

export const bookMeeting = tool({
  description: `Book a meeting for the user for a given timeslot.`,
  parameters: z.object({
    timeslot: z
      .string()
      .describe('The timeslot you need to book a meeting for'),
  }),
  execute: async ({ timeslot }) => {
    return `The meeting has been booked for ${timeslot}`;
  },
});

export const getInformation = tool({
  description: `get information from your knowledge base to answer questions.`,
  parameters: z.object({
    question: z.string().describe('the users question'),
  }),
  execute: async ({ question }) => {
    return await retriever(question);
  },
});

export const createTicket = tool({
  description: `Escalate to a human if you do not have the information to answer the users question.`,
  parameters: z.object({
    content: z
      .string()
      .describe('The question you need to escalate to a human'),
  }),
  execute: async ({ content }) => {
    return `I have created a ticket for your question: ${content}`;
  },
});

export const tools = {
  getInformation,
  createTicket,
  findTimeslots,
  bookMeeting,
};
