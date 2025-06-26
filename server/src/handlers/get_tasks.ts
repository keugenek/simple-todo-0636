
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';

export const getTasks = async (): Promise<Task[]> => {
  try {
    const tasks = await db.select().from(tasksTable).execute();
    return tasks;
  } catch (error) {
    console.error('Failed to retrieve tasks:', error);
    throw error;
  }
};
