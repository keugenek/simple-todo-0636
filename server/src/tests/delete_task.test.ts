
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

// Helper function to create a task for tests
const createTestTask = async (description: string): Promise<number> => {
  const input: CreateTaskInput = { description };
  const result = await db.insert(tasksTable)
    .values(input)
    .returning({ id: tasksTable.id })
    .execute();
  return result[0].id;
};

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task successfully', async () => {
    // Arrange: Create a task to be deleted
    const taskIdToDelete = await createTestTask('Task to delete');

    // Act: Call the delete handler
    await deleteTask({ id: taskIdToDelete });

    // Assert: Verify the task no longer exists in the database
    const deletedTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskIdToDelete))
      .execute();

    expect(deletedTask).toHaveLength(0);
  });

  it('should throw an error if the task to delete does not exist', async () => {
    // Arrange: Use a non-existent ID
    const nonExistentTaskId = 999;

    // Act & Assert: Expect the handler to throw an error
    await expect(deleteTask({ id: nonExistentTaskId }))
      .rejects.toThrow(`Task with ID ${nonExistentTaskId} not found.`);

    // Assert: Ensure no tasks were accidentally deleted (optional, but good for robustness)
    const allTasks = await db.select().from(tasksTable).execute();
    expect(allTasks).toHaveLength(0); // Assuming no tasks were pre-created for this specific test
  });

  it('should only delete the specified task and leave others untouched', async () => {
    // Arrange: Create multiple tasks
    const taskId1 = await createTestTask('Task One');
    const taskId2 = await createTestTask('Task Two (to delete)');
    const taskId3 = await createTestTask('Task Three');

    // Act: Delete only taskId2
    await deleteTask({ id: taskId2 });

    // Assert: Verify taskId2 is gone, and others remain
    const remainingTasks = await db.select()
      .from(tasksTable)
      .orderBy(tasksTable.id) // Order for consistent comparison
      .execute();

    expect(remainingTasks).toHaveLength(2);
    expect(remainingTasks.map(task => task.id)).toEqual([taskId1, taskId3]);
    expect(remainingTasks.find(task => task.id === taskId2)).toBeUndefined();
    expect(remainingTasks.find(task => task.id === taskId1)).toBeDefined();
    expect(remainingTasks.find(task => task.id === taskId3)).toBeDefined();
  });

  it('should handle deleting the first task created', async () => {
    const taskId1 = await createTestTask('First task');
    const taskId2 = await createTestTask('Second task');

    await deleteTask({ id: taskId1 });

    const remainingTasks = await db.select().from(tasksTable).execute();
    expect(remainingTasks).toHaveLength(1);
    expect(remainingTasks[0].id).toEqual(taskId2);
  });

  it('should handle deleting the last task created', async () => {
    const taskId1 = await createTestTask('First task');
    const taskId2 = await createTestTask('Second task');

    await deleteTask({ id: taskId2 });

    const remainingTasks = await db.select().from(tasksTable).execute();
    expect(remainingTasks).toHaveLength(1);
    expect(remainingTasks[0].id).toEqual(taskId1);
  });
});
