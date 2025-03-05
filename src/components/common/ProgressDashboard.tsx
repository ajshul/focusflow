import React from "react";
import { useTaskContext } from "../../context/TaskContext";

const ProgressDashboard: React.FC = () => {
  const { tasks } = useTaskContext();

  // Helper functions
  const getCompletedTasksCount = () => tasks.filter((t) => t.completed).length;
  const getTasksByPriority = (priority: string) =>
    tasks.filter((t) => t.priority === priority && !t.completed).length;

  // Calculate completion percentage
  const completionPercentage =
    tasks.length > 0 ? (getCompletedTasksCount() / tasks.length) * 100 : 0;

  return (
    <div className="p-4 bg-white border-b">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Today's Progress</h3>
        <span className="text-xs text-gray-500">
          {getCompletedTasksCount()}/{tasks.length} completed
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
          style={{
            width: `${completionPercentage}%`,
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
  );
};

export default ProgressDashboard;
