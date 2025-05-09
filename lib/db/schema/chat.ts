import { sql } from 'drizzle-orm';
import { text, varchar, timestamp, pgTable } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { nanoid } from '@/lib/utils';

export const chats = pgTable('chats', {
  id: varchar('id', { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  chatId: varchar('chat_id', { length: 191 }).notNull().unique(),
  summary: text('summary').notNull(),
  createdAt: timestamp('created_at')
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at')
    .notNull()
    .default(sql`now()`),
});

export const insertChatSchema = createSelectSchema(chats).extend({}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type NewChatParams = z.infer<typeof insertChatSchema>;
