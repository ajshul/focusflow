import React, { useState } from "react";
import { X } from "lucide-react";
import { useTaskContext } from "../../context/TaskContext";
import { useAppStateContext } from "../../context/AppStateContext";

const AddTaskModal: React.FC = () => {
  const { addTask } = useTaskContext();
  const { setShowAddTaskModal } = useAppStateContext();

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<
    "work" | "personal" | "health"
  >("work");
  const [newTaskPriority, setNewTaskPriority] = useState<
    "low" | "medium" | "high"
  >("medium");
  const [newTaskDueTime, setNewTaskDueTime] = useState("");
  const [newTaskEstimatedTime, setNewTaskEstimatedTime] = useState("");

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      const newTask = {
        title: newTaskTitle,
        dueTime: newTaskDueTime || "Today",
        priority: newTaskPriority,
        category: newTaskCategory,
        estimatedTime: newTaskEstimatedTime || "15 min",
      };

      // Add the task using the context function
      addTask(newTask);

      // Reset form
      setNewTaskTitle("");
      setNewTaskCategory("work");
      setNewTaskPriority("medium");
      setNewTaskDueTime("");
      setNewTaskEstimatedTime("");

      // Close modal
      setShowAddTaskModal(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium">Add New Task</h2>
          <button type="button" onClick={() => setShowAddTaskModal(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title
            </label>
            <input
              type="text"
              className="w-full border rounded-md p-2"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="What do you need to do?"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                className="w-full border rounded-md p-2"
                value={newTaskCategory}
                onChange={(e) =>
                  setNewTaskCategory(
                    e.target.value as "work" | "personal" | "health"
                  )
                }
              >
                <option value="work">💼 Work</option>
                <option value="personal">👤 Personal</option>
                <option value="health">🏥 Health</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                className="w-full border rounded-md p-2"
                value={newTaskPriority}
                onChange={(e) =>
                  setNewTaskPriority(
                    e.target.value as "low" | "medium" | "high"
                  )
                }
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Time
              </label>
              <input
                type="text"
                className="w-full border rounded-md p-2"
                value={newTaskDueTime}
                onChange={(e) => setNewTaskDueTime(e.target.value)}
                placeholder="Today, 3:00 PM, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Est. Time
              </label>
              <input
                type="text"
                className="w-full border rounded-md p-2"
                value={newTaskEstimatedTime}
                onChange={(e) => setNewTaskEstimatedTime(e.target.value)}
                placeholder="15 min, 1 hr, etc."
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end space-x-2">
          <button
            type="button"
            className="px-4 py-2 border rounded-md"
            onClick={() => setShowAddTaskModal(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md"
            onClick={handleAddTask}
          >
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;
