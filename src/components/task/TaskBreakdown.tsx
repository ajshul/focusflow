import React from "react";
import { Check } from "lucide-react";
import { Task } from "../../models/types";
import { useTaskContext } from "../../context/TaskContext";

interface TaskBreakdownProps {
  task: Task;
  focusMode?: boolean;
}

const TaskBreakdown: React.FC<TaskBreakdownProps> = ({
  task,
  focusMode = false,
}) => {
  const { toggleStepCompletion, generateTaskBreakdown, isGeneratingBreakdown } =
    useTaskContext();

  if (!task.breakdown || task.breakdown.length === 0) {
    return (
      <div className={`p-4 ${
        focusMode
          ? "bg-white rounded-lg shadow-lg mx-4 my-4 border"
          : "border-b"
      }`}>
        <div className="flex justify-between mb-4">
          <h2 className="font-medium text-indigo-700">Task Breakdown</h2>
          <button
            type="button"
            className="text-indigo-600 text-sm hover:text-indigo-800 transition-colors"
            onClick={() => generateTaskBreakdown(task)}
          >
            Generate
          </button>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md text-center">
          <p className="text-gray-500">
            {isGeneratingBreakdown ? "Generating task breakdown..." : "Ask me to break down this task for you"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 ${
        focusMode
          ? "bg-white rounded-lg shadow-lg mx-4 my-4 border"
          : "border-b"
      }`}
    >
      <div className="flex justify-between mb-4">
        <h2 className="font-medium text-indigo-700">Task Breakdown</h2>
        <button
          type="button"
          className="text-indigo-600 text-sm hover:text-indigo-800 transition-colors"
          onClick={() => generateTaskBreakdown(task)}
        >
          Regenerate
        </button>
      </div>

      {isGeneratingBreakdown && !task.breakdown ? (
        <div className="bg-gray-50 p-4 rounded-md text-center">
          <p className="text-gray-500">Generating task breakdown...</p>
        </div>
      ) : task.breakdown ? (
        <div className="space-y-2">
          {task.breakdown.map((step, index) => {
            const isCompleted = task.breakdownProgress?.[index] || false;
            return (
              <div
                key={index}
                className={`flex items-center bg-gray-50 p-3 rounded-md ${
                  isCompleted ? "opacity-70" : ""
                } hover:bg-gray-100 transition-colors`}
              >
                <button
                  type="button"
                  onClick={() => toggleStepCompletion(task.id, index)}
                  className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                    isCompleted
                      ? "bg-green-100 text-green-700 border border-green-300"
                      : "bg-indigo-100 text-indigo-700"
                  } hover:opacity-80 transition-opacity`}
                >
                  {isCompleted ? <Check size={14} /> : index + 1}
                </button>
                <span
                  className={isCompleted ? "line-through text-gray-500" : ""}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded-md text-center">
          <p className="text-gray-500">
            Ask me to break down this task for you
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskBreakdown;
