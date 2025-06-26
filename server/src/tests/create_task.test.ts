
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateTaskInput = {
  description: 'Learn Drizzle ORM',
};

describe('createTask', () => {
  // Setup and teardown for each test
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task with default values', async () => {
    const result = await createTask(testInput);

    // Basic field validation for the returned object
    expect(result.description).toEqual(testInput.description);
    expect(result.completed).toEqual(false); // Should be false by default
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    // For a newly created task, created_at and updated_at should be very close
    expect(result.created_at.getTime()).toBeLessThanOrEqual(result.updated_at.getTime());
    expect(result.updated_at.getTime() - result.created_at.getTime()).toBeLessThan(1000); // Within 1 second
  });

  it('should save the task to the database', async () => {
    const result = await createTask(testInput);

    // Query the database directly to verify persistence
    const tasksInDb = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasksInDb).toHaveLength(1);
    const dbTask = tasksInDb[0];

    expect(dbTask.description).toEqual(testInput.description);
    expect(dbTask.completed).toEqual(false); // Default value from DB
    expect(dbTask.id).toEqual(result.id);
    expect(dbTask.created_at).toBeInstanceOf(Date);
    expect(dbTask.updated_at).toBeInstanceOf(Date);
    expect(dbTask.created_at.getTime()).toEqual(result.created_at.getTime());
    expect(dbTask.updated_at.getTime()).toEqual(result.updated_at.getTime());
  });
});
