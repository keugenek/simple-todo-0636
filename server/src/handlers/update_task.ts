
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTask = async (input: UpdateTaskInput): Promise<Task> => {
  try {
    const { id, description, completed } = input;

    // Build the update payload dynamically based on provided fields
    const updatePayload: { description?: string; completed?: boolean } = {};
    if (description !== undefined) {
      updatePayload.description = description;
    }
    if (completed !== undefined) {
      updatePayload.completed = completed;
    }

    // Check if there's anything to update
    if (Object.keys(updatePayload).length === 0) {
      // This case should ideally be caught by Zod's .refine(), but good to have a runtime check
      const existingTask = await db.select().from(tasksTable).where(eq(tasksTable.id, id)).execute();
      if (existingTask.length > 0) {
        return existingTask[0]; // If nothing to update, return the existing task
      } else {
        throw new Error(`Task with ID ${id} not found.`); // Task not found if no payload and no existing task
      }
    }

    // Update task record
    const result = await db.update(tasksTable)
      .set(updatePayload)
      .where(eq(tasksTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Task with ID ${id} not found or could not be updated.`);
    }

    return result[0];
  } catch (error) {
    console.error(`Task update failed for ID ${input.id}:`, error);
    throw error;
  }
};
