import React, { useRef } from "react";
import { PlusCircle, Calendar, Brain, Settings } from "lucide-react";
import TaskItem from "./TaskItem";
import { Task, UserProfile } from "../../models/types";
import { useTaskContext } from "../../context/TaskContext";
import { useAppStateContext } from "../../context/AppStateContext";

interface TaskListProps {
  user: UserProfile;
  onOpenCoach: () => void;
  onSelectTask: (task: Task) => void;
  onOpenSettings: () => void;
}

const TaskList: React.FC<TaskListProps> = ({
  user,
  onOpenCoach,
  onSelectTask,
  onOpenSettings,
}) => {
  const {
    filteredAndSortedTasks,
    taskFilter,
    setTaskFilter,
    taskSort,
    setTaskSort,
    tasks,
  } = useTaskContext();

  const { setShowAddTaskModal } = useAppStateContext();

  const taskListRef = useRef<HTMLDivElement>(null);

  // Progress calculation helpers
  const getCompletedTasksCount = () => tasks.filter((t) => t.completed).length;
  const getTasksByPriority = (priority: string) =>
    tasks.filter((t) => t.priority === priority && !t.completed).length;

  return (
    <div className="flex flex-col h-full">
      <div className="bg-indigo-600 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Today's Focus</h1>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className="p-2 bg-indigo-500 rounded-full"
              onClick={onOpenSettings}
              title="Memory Settings"
            >
              <Settings size={20} />
            </button>
            <button type="button" className="p-2 bg-indigo-500 rounded-full">
              <Calendar size={20} />
            </button>
            <button
              type="button"
              className="p-2 bg-indigo-500 rounded-full"
              onClick={onOpenCoach}
            >
              <Brain size={20} />
            </button>
          </div>
        </div>
        <p className="text-indigo-200 mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}{" "}
          • {tasks.length} tasks
        </p>
      </div>

      {/* Progress Dashboard */}
      <div className="p-4 bg-white border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">
            Today's Progress
          </h3>
          <span className="text-xs text-gray-500">
            {getCompletedTasksCount()}/{tasks.length} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
            style={{
              width: `${
                tasks.length > 0
                  ? (getCompletedTasksCount() / tasks.length) * 100
                  : 0
              }%`,
            }}
          ></div>
        </div>

        {/* Priority breakdown */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="font-medium">High Priority</div>
            <div className="text-red-600">
              {getTasksByPriority("high")} remaining
            </div>
          </div>
          <div>
            <div className="font-medium">Medium Priority</div>
            <div className="text-yellow-600">
              {getTasksByPriority("medium")} remaining
            </div>
          </div>
          <div>
            <div className="font-medium">Low Priority</div>
            <div className="text-green-600">
              {getTasksByPriority("low")} remaining
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="px-4 py-2 bg-indigo-50 flex items-center justify-between">
        <div className="space-x-1">
          <button
            type="button"
            className={`px-2 py-1 text-xs rounded-md ${
              taskFilter === "all" ? "bg-indigo-600 text-white" : "bg-white"
            }`}
            onClick={() => setTaskFilter("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`px-2 py-1 text-xs rounded-md ${
              taskFilter === "work" ? "bg-indigo-600 text-white" : "bg-white"
            }`}
            onClick={() => setTaskFilter("work")}
          >
            💼 Work
          </button>
          <button
            type="button"
            className={`px-2 py-1 text-xs rounded-md ${
              taskFilter === "personal"
                ? "bg-indigo-600 text-white"
                : "bg-white"
            }`}
            onClick={() => setTaskFilter("personal")}
          >
            👤 Personal
          </button>
          <button
            type="button"
            className={`px-2 py-1 text-xs rounded-md ${
              taskFilter === "health" ? "bg-indigo-600 text-white" : "bg-white"
            }`}
            onClick={() => setTaskFilter("health")}
          >
            🏥 Health
          </button>
        </div>

        <select
          className="text-xs border rounded-md p-1"
          value={taskSort}
          onChange={(e) =>
            setTaskSort(e.target.value as "priority" | "dueTime")
          }
        >
          <option value="priority">Sort: Priority</option>
          <option value="dueTime">Sort: Due Time</option>
        </select>
      </div>

      {/* Task List */}
      <div ref={taskListRef} className="p-4 bg-gray-50 flex-grow overflow-auto">
        {filteredAndSortedTasks.length > 0 ? (
          filteredAndSortedTasks.map((task) => (
            <TaskItem key={task.id} task={task} onSelect={onSelectTask} />
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p className="mb-4">No tasks match your current filters</p>
            <button
              type="button"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md"
              onClick={() => setShowAddTaskModal(true)}
            >
              Add a Task
            </button>
          </div>
        )}
      </div>

      {/* Add Task Button */}
      <div className="bg-white border-t border-gray-200 p-3 flex justify-center">
        <button
          type="button"
          className="bg-indigo-600 text-white rounded-full p-3 shadow-lg hover:bg-indigo-700 transition-colors"
          onClick={() => setShowAddTaskModal(true)}
        >
          <PlusCircle size={24} />
        </button>
      </div>
    </div>
  );
};

export default TaskList;
