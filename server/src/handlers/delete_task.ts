
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTask = async (input: DeleteTaskInput): Promise<void> => {
  try {
    const result = await db.delete(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    // Drizzle's delete operation returns a QueryResult with rowCount
    // If no rows were affected, the task was not found.
    if (result.rowCount === 0) {
      throw new Error(`Task with ID ${input.id} not found.`);
    }
  } catch (error) {
    console.error(`Error deleting task with ID ${input.id}:`, error);
    throw error;
  }
};
