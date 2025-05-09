import { sql } from 'drizzle-orm';

import { cosineDistance } from 'drizzle-orm';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { gt } from 'drizzle-orm';
import { desc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { chunks } from '../db/schema/chunks';
import { generateEmbedding } from './embedding';

export const findRelevantContent = async (userQuery: string) => {
  const userQueryEmbedded = await generateEmbedding(userQuery);
  const similarity = sql<number>`1 - (${cosineDistance(
    chunks.embedding,
    userQueryEmbedded
  )})`;
  const similarGuides = await db
    .select({ name: chunks.content, similarity, id: chunks.id })
    .from(chunks)
    .where(gt(similarity, 0.3))
    .orderBy((t) => desc(t.similarity))
    .limit(4);
  return similarGuides;
};

export async function expandQuery(
  query: string,
  numQueries: number = 3
): Promise<string[]> {
  const { object } = await generateObject({
    model: openai('gpt-4'),
    prompt: `Analyze this query: "${query}". Provide the following:
                     ${numQueries} similar questions that could help answer the user's query`,
    schema: z.object({
      queries: z
        .array(z.string())
        .min(numQueries)
        .max(numQueries)
        .describe(
          'List of query variations, each capturing a different aspect or phrasing of the original query'
        ),
    }),
  });

  return [query, ...object.queries.filter((v: string) => v !== query)];
}

export async function fetchSimilarContentForQueries(queries: string[]) {
  return await Promise.all(
    queries.map(async (query) => {
      return await findRelevantContent(query);
    })
  );
}

export async function retriever(
  query: string,
  numQueries: number = 3,
  topK: number = 5
) {
  const expandedQueries = await expandQuery(query, numQueries);
  const rankedLists = await fetchSimilarContentForQueries(expandedQueries);
  const topResults = getTopUniqueBySimilarity(rankedLists, topK);
  return topResults.map((item) => item.name).join('\n');
}

function getTopUniqueBySimilarity(
  rankedLists: Awaited<ReturnType<typeof findRelevantContent>>[],
  topK: number = 5
) {
  return Array.from(
    new Map(rankedLists.flat().map((item) => [item?.name, item])).values()
  )
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}
