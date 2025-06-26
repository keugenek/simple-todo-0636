
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { getTasks } from '../handlers/get_tasks';
import { type CreateTaskInput } from '../schema';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array if no tasks exist', async () => {
    const tasks = await getTasks();
    expect(tasks).toEqual([]);
  });

  it('should return all tasks when tasks exist', async () => {
    // Insert some test tasks directly into the database
    const input1: CreateTaskInput = { description: 'Buy groceries' };
    const input2: CreateTaskInput = { description: 'Walk the dog' };
    const input3: CreateTaskInput = { description: 'Read a book' };

    await db.insert(tasksTable).values([
      input1,
      input2,
      input3
    ]).execute();

    const tasks = await getTasks();

    expect(tasks).toHaveLength(3);

    // Verify the first task
    const task1 = tasks.find(t => t.description === input1.description);
    expect(task1).toBeDefined();
    expect(task1!.id).toBeDefined();
    expect(task1!.description).toEqual(input1.description);
    expect(task1!.completed).toBeFalse();
    expect(task1!.created_at).toBeInstanceOf(Date);
    expect(task1!.updated_at).toBeInstanceOf(Date);

    // Verify the second task
    const task2 = tasks.find(t => t.description === input2.description);
    expect(task2).toBeDefined();
    expect(task2!.id).toBeDefined();
    expect(task2!.description).toEqual(input2.description);
    expect(task2!.completed).toBeFalse();
    expect(task2!.created_at).toBeInstanceOf(Date);
    expect(task2!.updated_at).toBeInstanceOf(Date);

    // Verify the third task
    const task3 = tasks.find(t => t.description === input3.description);
    expect(task3).toBeDefined();
    expect(task3!.id).toBeDefined();
    expect(task3!.description).toEqual(input3.description);
    expect(task3!.completed).toBeFalse();
    expect(task3!.created_at).toBeInstanceOf(Date);
    expect(task3!.updated_at).toBeInstanceOf(Date);
  });

  it('should correctly retrieve tasks with different completion statuses', async () => {
    // Insert tasks with mixed completion statuses
    await db.insert(tasksTable).values([
      { description: 'Completed task 1', completed: true },
      { description: 'Pending task 1', completed: false },
      { description: 'Completed task 2', completed: true },
    ]).execute();

    const tasks = await getTasks();

    expect(tasks).toHaveLength(3);

    const completedTasks = tasks.filter(t => t.completed);
    const pendingTasks = tasks.filter(t => !t.completed);

    expect(completedTasks).toHaveLength(2);
    expect(pendingTasks).toHaveLength(1);

    expect(completedTasks.some(t => t.description === 'Completed task 1')).toBeTrue();
    expect(completedTasks.some(t => t.description === 'Completed task 2')).toBeTrue();
    expect(pendingTasks.some(t => t.description === 'Pending task 1')).toBeTrue();

    // Verify types for all tasks
    tasks.forEach(task => {
      expect(task.id).toBeNumber();
      expect(task.description).toBeString();
      expect(task.completed).toBeBoolean();
      expect(task.created_at).toBeInstanceOf(Date);
      expect(task.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should retrieve tasks with default `completed` status as false', async () => {
    // Insert a task without explicitly setting 'completed'
    await db.insert(tasksTable).values({ description: 'Task with default completion' }).execute();

    const tasks = await getTasks();

    expect(tasks).toHaveLength(1);
    const task = tasks[0];
    expect(task.description).toEqual('Task with default completion');
    expect(task.completed).toBeFalse(); // Should be false due to schema default
  });
});
