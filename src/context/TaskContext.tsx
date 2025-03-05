import React, { createContext, useState, useContext, useEffect } from "react";
import { Task, UserProfile } from "../models/types";
import { storageService } from "../services/storage/browserStorage";
import { breakdownTask } from "../services/ai/memory";

// Sample tasks data
const initialTasks: Task[] = [
  {
    id: 1,
    title: "Email marketing team about Q2 strategy",
    dueTime: "11:00 AM",
    priority: "high",
    category: "work",
    estimatedTime: "20 min",
    breakdown: [
      "Review Q1 results",
      "Outline key Q2 objectives",
      "Draft email in professional tone",
    ],
    context: "Follow-up to yesterday's marketing meeting",
    suggestions: [
      "Include data from the recent customer survey",
      "Mention the new product launch timeline",
      "Ask about billboard design progress",
    ],
  },
  {
    id: 2,
    title: "Schedule doctor appointment",
    dueTime: "2:00 PM",
    priority: "medium",
    category: "health",
    estimatedTime: "10 min",
    breakdown: [
      "Find doctor's phone number",
      "Check calendar for available slots",
      "Make the call",
    ],
  },
  {
    id: 3,
    title: "Complete project proposal draft",
    dueTime: "4:30 PM",
    priority: "high",
    category: "work",
    estimatedTime: "1.5 hrs",
  },
  {
    id: 4,
    title: "Order anniversary gift",
    dueTime: "Today",
    priority: "medium",
    category: "personal",
    estimatedTime: "15 min",
  },
];

type TaskCategory = "work" | "personal" | "health";
type TaskPriority = "low" | "medium" | "high";
type TaskFilter = "all" | TaskCategory;
type TaskSort = "priority" | "dueTime";

interface TaskContextType {
  tasks: Task[];
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  taskFilter: TaskFilter;
  setTaskFilter: (filter: TaskFilter) => void;
  taskSort: TaskSort;
  setTaskSort: (sort: TaskSort) => void;
  addTask: (taskData: Omit<Task, "id">) => void;
  completeTask: (taskId: number | string) => void;
  toggleStepCompletion: (taskId: number | string, stepIndex: number) => void;
  generateTaskBreakdown: (task: Task) => Promise<void>;
  filteredAndSortedTasks: Task[];
  isGeneratingBreakdown: boolean;
}

export const TaskContext = createContext<TaskContextType | undefined>(
  undefined
);

export const TaskProvider: React.FC<{
  children: React.ReactNode;
  user: UserProfile;
}> = ({ children, user }) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");
  const [taskSort, setTaskSort] = useState<TaskSort>("priority");
  const [isGeneratingBreakdown, setIsGeneratingBreakdown] = useState(false);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    storageService.saveTasks(user.id, tasks);
  }, [tasks, user.id]);

  // Get filtered and sorted tasks
  const filteredAndSortedTasks = React.useMemo(() => {
    let filteredTasks = [...tasks];

    // Filter by category
    if (taskFilter !== "all") {
      filteredTasks = filteredTasks.filter(
        (task) => task.category === taskFilter
      );
    }

    // Filter out completed tasks
    filteredTasks = filteredTasks.filter((task) => !task.completed);

    // Sort tasks
    if (taskSort === "priority") {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      filteredTasks.sort(
        (a, b) =>
          (priorityWeight[b.priority as keyof typeof priorityWeight] || 0) -
          (priorityWeight[a.priority as keyof typeof priorityWeight] || 0)
      );
    } else {
      // Simple due time sorting
      filteredTasks.sort((a, b) => a.dueTime.localeCompare(b.dueTime));
    }

    return filteredTasks;
  }, [tasks, taskFilter, taskSort]);

  // Add a new task
  const addTask = (taskData: Omit<Task, "id">) => {
    const newTask: Task = {
      id: Date.now(), // Simple unique ID
      ...taskData,
    };

    setTasks((prevTasks) => [...prevTasks, newTask]);
    return newTask;
  };

  // Complete a task
  const completeTask = (taskId: number | string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? { ...task, completed: true, completedAt: new Date() }
          : task
      )
    );

    // If this is the currently selected task, update that too
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({
        ...selectedTask,
        completed: true,
        completedAt: new Date(),
      });
    }
  };

  // Toggle step completion in a task breakdown
  const toggleStepCompletion = (taskId: number | string, stepIndex: number) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === taskId) {
          const progress =
            task.breakdownProgress ||
            Array(task.breakdown?.length || 0).fill(false);
          progress[stepIndex] = !progress[stepIndex];

          // If all steps are complete, mark the whole task as complete
          if (progress.every((step) => step)) {
            return {
              ...task,
              breakdownProgress: progress,
              completed: true,
              completedAt: new Date(),
            };
          }

          return { ...task, breakdownProgress: progress };
        }
        return task;
      })
    );

    // Update selected task if needed
    if (selectedTask && selectedTask.id === taskId) {
      const progress =
        selectedTask.breakdownProgress ||
        Array(selectedTask.breakdown?.length || 0).fill(false);
      progress[stepIndex] = !progress[stepIndex];

      if (progress.every((step) => step)) {
        setSelectedTask({
          ...selectedTask,
          breakdownProgress: progress,
          completed: true,
          completedAt: new Date(),
        });
      } else {
        setSelectedTask({ ...selectedTask, breakdownProgress: progress });
      }
    }
  };

  // Generate task breakdown
  const generateTaskBreakdown = async (task: Task) => {
    if (!task.breakdown) {
      setIsGeneratingBreakdown(true);
      try {
        const steps = await breakdownTask(task.title, user);

        // Update the task with the breakdown
        const updatedTasks = tasks.map((t) =>
          t.id === task.id ? { ...t, breakdown: steps } : t
        );
        setTasks(updatedTasks);

        // If this is the selected task, update it too
        if (selectedTask && selectedTask.id === task.id) {
          setSelectedTask({ ...task, breakdown: steps });
        }
      } catch (error) {
        console.error("Failed to generate breakdown:", error);
      }
      setIsGeneratingBreakdown(false);
    }
  };

  const contextValue: TaskContextType = {
    tasks,
    selectedTask,
    setSelectedTask,
    taskFilter,
    setTaskFilter,
    taskSort,
    setTaskSort,
    addTask,
    completeTask,
    toggleStepCompletion,
    generateTaskBreakdown,
    filteredAndSortedTasks,
    isGeneratingBreakdown,
  };

  return (
    <TaskContext.Provider value={contextValue}>{children}</TaskContext.Provider>
  );
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTaskContext must be used within a TaskProvider");
  }
  return context;
};
