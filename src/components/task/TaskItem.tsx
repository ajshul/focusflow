import React from "react";
import { ChevronRight, Clock } from "lucide-react";
import { Task } from "../../models/types";

interface TaskItemProps {
  task: Task;
  onSelect: (task: Task) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onSelect }) => {
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case "work":
        return "💼 Work";
      case "health":
        return "🏥 Health";
      default:
        return "👤 Personal";
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow mb-3 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onSelect(task)}
    >
      <div className="p-4">
        <div className="flex justify-between">
          <h3 className="font-medium">{task.title}</h3>
          <span
            className={`px-2 py-1 rounded-full text-xs ${getPriorityClass(
              task.priority
            )}`}
          >
            {task.priority}
          </span>
        </div>

        <div className="flex mt-2 text-sm text-gray-500">
          <div className="flex items-center mr-4">
            <Clock size={14} className="mr-1" />
            <span>{task.dueTime}</span>
          </div>
          <div className="flex items-center">
            <Clock size={14} className="mr-1" />
            <span>{task.estimatedTime}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-2 bg-gray-50 flex justify-between items-center border-t">
        <span className="text-xs text-gray-500">
          {getCategoryEmoji(task.category)}
        </span>
        <ChevronRight size={16} className="text-gray-400" />
      </div>
    </div>
  );
};

export default TaskItem;
