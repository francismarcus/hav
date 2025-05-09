import {
  text,
  timestamp,
  pgTable,
  integer,
  varchar,
} from 'drizzle-orm/pg-core';
import { nanoid } from '@/lib/utils';
import { sql } from 'drizzle-orm';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { crawls } from './crawl';

export const scrape = pgTable('scrape', {
  id: varchar('id', { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  url: text('url').notNull(),
  markdown: text('markdown').notNull(),
  title: text('title'),
  description: text('description'),
  statusCode: integer('status_code'),
  crawlId: varchar('crawl_id', { length: 191 }).references(() => crawls.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at')
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at')
    .notNull()
    .default(sql`now()`),
});

export const insertScrapeSchema = createSelectSchema(scrape).extend({}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type NewScrapeParams = z.infer<typeof insertScrapeSchema>;
