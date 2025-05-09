import { db } from '../db';
import { insertChunkSchema } from '../db/schema/chunks';
import {
  insertDocumentSchema,
  NewDocumentParams,
} from '../db/schema/documents';
import { Document, MarkdownNodeParser } from 'llamaindex';
import { documents } from '../db/schema/documents';
import { chunks as chunksTable } from '../db/schema/chunks';

import { openai } from '@ai-sdk/openai';
import { embedMany } from 'ai';

const embeddingModel = openai.embedding('text-embedding-ada-002');
const parser = new MarkdownNodeParser();

export const createDocument = async (input: NewDocumentParams) => {
  try {
    const parsed = insertDocumentSchema.parse(input);
    const [dbDocument] = await db.insert(documents).values(parsed).returning();

    const document = new Document({
      text: parsed.content.replace(/\n{3,}/g, '\n\n'),
      metadata: {
        source: parsed.metadata.source,
        title: parsed.metadata.title,
        description: parsed.metadata.description,
      },
    });

    const chunks = parser([document], {
      chunkSize: 512,
      chunkOverlap: 20,
    });

    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: chunks.map((chunk) => chunk.text),
    });

    const embeddedChunks = embeddings.map((embedding, index) => {
      const chunk = chunks[index];

      const previousNode =
        'nodeId' in (chunk.relationships.PREVIOUS || {})
          ? (chunk.relationships.PREVIOUS as any).nodeId
          : undefined;
      const nextNode =
        'nodeId' in (chunk.relationships.NEXT || {})
          ? (chunk.relationships.NEXT as any).nodeId
          : undefined;

      return {
        content: chunk.text,
        embedding,
        metadata: {
          previousNode,
          nextNode,
          source: {
            title: chunk.metadata.title,
            description: chunk.metadata.description,
            url: chunk.metadata.source,
          },
        },
      };
    });

    const parsedChunks = embeddedChunks.map((chunk) => {
      return insertChunkSchema.parse({
        content: chunk.content,
        documentId: dbDocument.id,
        metadata: chunk.metadata,
        embedding: chunk.embedding,
      });
    });

    console.log('Inserting chunks', parsedChunks.length);
    await db.insert(chunksTable).values(parsedChunks).returning();

    return 'Resource successfully created and embedded.';
  } catch (error) {
    return error instanceof Error && error.message.length > 0
      ? error.message
      : 'Error, please try again.';
  }
};
