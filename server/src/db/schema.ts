
import { serial, text, pgTable, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  description: text('description').notNull(),
  completed: boolean('completed').notNull().default(false), // Default to false
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()), // Automatically update on row modification
});

// TypeScript type for the table schema (Select and Insert operations)
export type Task = typeof tasksTable.$inferSelect;
export type NewTask = typeof tasksTable.$inferInsert;

// Important: Export all tables for proper query building
export const tables = { tasks: tasksTable };
