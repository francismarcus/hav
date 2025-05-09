import { nanoid } from '@/lib/utils';
import {
  index,
  pgTable,
  text,
  varchar,
  vector,
  jsonb,
} from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { createSelectSchema } from 'drizzle-zod';
import { documents } from './documents';

export const chunkMetadataSchema = z.object({
  previousNode: z.string().optional(),
  nextNode: z.string().optional(),
  source: z.object({
    title: z.string(),
    description: z.string(),
    url: z.string(),
  }),
});

export type ChunkMetadata = z.infer<typeof chunkMetadataSchema>;

export const chunks = pgTable(
  'chunks',
  {
    id: varchar('id', { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    documentId: varchar('document_id', { length: 191 }).references(
      () => documents.id,
      { onDelete: 'cascade' }
    ),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }).notNull(),
    metadata: jsonb('metadata').notNull().$type<ChunkMetadata>(),
  },
  (table) => ({
    embeddingIndex: index('chunks_embedding_index').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops')
    ),
  })
);

export const insertChunkSchema = createSelectSchema(chunks)
  .extend({
    metadata: chunkMetadataSchema,
  })
  .omit({ id: true });

export type NewChunkParams = z.infer<typeof insertChunkSchema>;
