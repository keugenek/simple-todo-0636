
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../server/src/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger, // Keep DialogTrigger as it will be used now
} from '@/components/ui/dialog';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTaskDescription, setNewTaskDescription] = useState<string>('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editDescription, setEditDescription] = useState<string>('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getTasks.query();
      // Sort tasks: incomplete first, then by creation date (newest first)
      // Then completed tasks, sorted by completion date (newest first)
      const sortedTasks = result.sort((a, b) => {
        if (a.completed === b.completed) {
          // Both incomplete or both complete, sort by created_at (newest first)
          return b.created_at.getTime() - a.created_at.getTime();
        }
        // Incomplete tasks come before complete tasks
        return a.completed ? 1 : -1;
      });
      setTasks(sortedTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskDescription.trim()) return;

    setIsLoading(true);
    try {
      const input: CreateTaskInput = { description: newTaskDescription.trim() };
      const response = await trpc.createTask.mutate(input);
      setTasks((prev: Task[]) => [response, ...prev]); // Add new task to the top
      setNewTaskDescription('');
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    setIsLoading(true);
    try {
      const input: UpdateTaskInput = { id: task.id, completed: !task.completed };
      const updatedTask = await trpc.updateTask.mutate(input);
      setTasks((prev: Task[]) => {
        const updatedTasks = prev.map((t: Task) =>
          t.id === updatedTask.id ? { ...updatedTask, created_at: new Date(updatedTask.created_at), updated_at: new Date(updatedTask.updated_at) } : t
        );
        // Re-sort to maintain order
        return updatedTasks.sort((a, b) => {
          if (a.completed === b.completed) {
            return b.created_at.getTime() - a.created_at.getTime();
          }
          return a.completed ? 1 : -1;
        });
      });
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      setTasks((prev: Task[]) => prev.filter((task: Task) => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setEditDescription(task.description);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTaskDescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editDescription.trim()) return;

    setIsLoading(true);
    try {
      const input: UpdateTaskInput = { id: editingTask.id, description: editDescription.trim() };
      const updatedTask = await trpc.updateTask.mutate(input);
      setTasks((prev: Task[]) => prev.map((t: Task) =>
        t.id === updatedTask.id ? { ...updatedTask, created_at: new Date(updatedTask.created_at), updated_at: new Date(updatedTask.updated_at) } : t
      ));
      setIsEditDialogOpen(false);
      setEditingTask(null);
      setEditDescription('');
    } catch (error) {
      console.error('Failed to update task description:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-900">My Todo List</h1>

      {/* Add New Task Form */}
      <form onSubmit={handleCreateTask} className="flex gap-2 mb-8">
        <Input
          type="text"
          placeholder="What needs to be done?"
          value={newTaskDescription}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaskDescription(e.target.value)}
          className="flex-grow border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
          disabled={isLoading}
          autoFocus
        />
        <Button type="submit" disabled={isLoading || !newTaskDescription.trim()} className="bg-gray-900 text-white hover:bg-gray-700">
          Add Task
        </Button>
      </form>

      {/* Task List */}
      {isLoading && tasks.length === 0 ? (
        <div className="text-center text-gray-500">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center text-gray-500">No tasks yet. Add one above!</div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task: Task) => (
            <Card key={task.id} className="flex items-center p-4 border border-gray-200 rounded-md shadow-sm bg-white">
              <Checkbox
                id={`task-${task.id}`}
                checked={task.completed}
                onCheckedChange={() => handleToggleComplete(task)}
                className="mr-3 w-5 h-5 border-gray-300 data-[state=checked]:bg-gray-900 data-[state=checked]:text-white"
                disabled={isLoading}
              />
              <label
                htmlFor={`task-${task.id}`}
                className={`flex-grow text-lg ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}
              >
                {task.description}
              </label>
              <div className="flex gap-2 ml-auto">
                <Dialog> {/* Wrap the edit button with Dialog */}
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(task)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-100"
                      disabled={isLoading}
                    >
                      Edit
                    </Button>
                  </DialogTrigger>
                  {/* The rest of the DialogContent is moved outside to be controlled by isEditDialogOpen */}
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600" disabled={isLoading}>
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-gray-900">Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-600">
                        This action cannot be undone. This will permanently delete your task: "{task.description}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteTask(task.id)}
                        className="bg-gray-900 text-white hover:bg-gray-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Edit Task</DialogTitle>
            <DialogDescription className="text-gray-600">
              Make changes to your task here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateTaskDescription} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="description" className="text-right text-gray-800">
                Description
              </label>
              <Input
                id="description"
                value={editDescription}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditDescription(e.target.value)}
                className="col-span-3 border border-gray-300 focus:ring-gray-500 focus:border-gray-500"
                disabled={isLoading}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading || !editDescription.trim()} className="bg-gray-900 text-white hover:bg-gray-700">
                {isLoading ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
