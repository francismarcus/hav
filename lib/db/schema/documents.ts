import { sql } from 'drizzle-orm';
import { text, varchar, timestamp, pgTable, jsonb } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { nanoid } from '@/lib/utils';

export const documentMetadataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  source: z.string().optional(),
});

export type DocumentMetadata = z.infer<typeof documentMetadataSchema>;

export const documents = pgTable('documents', {
  id: varchar('id', { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at')
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at')
    .notNull()
    .default(sql`now()`),
});

export const insertDocumentSchema = createSelectSchema(documents)
  .extend({
    metadata: documentMetadataSchema,
  })
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export type NewDocumentParams = z.infer<typeof insertDocumentSchema>;
