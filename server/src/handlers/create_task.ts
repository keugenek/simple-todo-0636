
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput, type Task } from '../schema';

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  try {
    // Insert task record
    // `completed`, `created_at`, and `updated_at` fields have database defaults
    // and will be automatically populated upon insertion.
    const result = await db.insert(tasksTable)
      .values({
        description: input.description,
      })
      .returning()
      .execute();

    // The `returning()` method already gives us the full Task object with generated IDs and timestamps
    const task = result[0];

    return {
      ...task,
      created_at: new Date(task.created_at), // Ensure Date object
      updated_at: new Date(task.updated_at), // Ensure Date object
    };
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
};
