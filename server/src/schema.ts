
import { z } from 'zod';

// Task schema for output
export const taskSchema = z.object({
  id: z.number(),
  description: z.string(),
  completed: z.boolean(),
  created_at: z.coerce.date(), // Automatically converts string timestamps to Date objects
  updated_at: z.coerce.date(), // Automatically converts string timestamps to Date objects
});

export type Task = z.infer<typeof taskSchema>;

// Input schema for creating tasks
export const createTaskInputSchema = z.object({
  description: z.string().min(1, 'Description cannot be empty'), // Task description must not be empty
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating tasks (description and/or completion status)
export const updateTaskInputSchema = z.object({
  id: z.number().int().positive(), // Task ID must be a positive integer
  description: z.string().min(1, 'Description cannot be empty').optional(), // Description is optional for update, but if provided, must not be empty
  completed: z.boolean().optional(), // Completion status is optional for update
}).refine(data => data.description !== undefined || data.completed !== undefined, {
  message: "At least one of 'description' or 'completed' must be provided for update.",
  path: ['description', 'completed'],
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Input schema for deleting tasks
export const deleteTaskInputSchema = z.object({
  id: z.number().int().positive(), // Task ID must be a positive integer
});

export type DeleteTaskInput = z.infer<typeof deleteTaskInputSchema>;
