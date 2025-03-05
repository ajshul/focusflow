import React, { useEffect } from "react";
import { ArrowLeft, Mail, Brain, Check, Eye, EyeOff } from "lucide-react";
import { Task, UserProfile } from "../../models/types";
import PomodoroTimer from "../pomodoro/PomodoroTimer";
import TaskBreakdown from "./TaskBreakdown";
import ChatInterface from "../chat/ChatInterface";
import { useTaskContext } from "../../context/TaskContext";
import { useAppStateContext } from "../../context/AppStateContext";
import { useChat } from "../../hooks/useChat";
import { useEmailDraft } from "../../hooks/useEmailDraft";

interface TaskDetailProps {
  task: Task;
  user: UserProfile;
  threadId: string;
  onBackToTasks: () => void;
  onOpenCoach: () => void;
}

const TaskDetail: React.FC<TaskDetailProps> = ({
  task,
  user,
  threadId,
  onBackToTasks,
  onOpenCoach,
}) => {
  const { completeTask, generateTaskBreakdown } = useTaskContext();
  const { focusMode, setFocusMode, setShowEmailModal } = useAppStateContext();

  // Get the context for the chat
  const getTaskContext = () => ({
    currentTask: task.title,
    timeOfDay: getCurrentTimeOfDay(),
    energyLevel: "medium",
  });

  // Initialize chat with a custom hook
  const {
    messages,
    isGenerating,
    inputValue,
    handleInputChange,
    sendMessage,
    initializeChat,
  } = useChat(user, threadId, getTaskContext);

  // Email functionality with a custom hook
  const {
    emailDraft,
    isLoading: emailLoading,
    emailRecipients,
    emailSubject,
    setEmailRecipients,
    setEmailSubject,
    handleCreateEmail,
  } = useEmailDraft(user, threadId, () => setShowEmailModal(true));

  // Welcome message when a task is selected
  useEffect(() => {
    initializeChat(
      `I see you're working on "${task.title}". How can I help you with this task?`
    );

    // Generate breakdown if not available
    if (!task.breakdown) {
      generateTaskBreakdown(task);
    }
  }, [task.id]); // Re-run only if task ID changes

  // Helper to get time of day
  const getCurrentTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  };

  // Task completion handler
  const handleCompleteTask = () => {
    completeTask(task.id);

    // Add a celebratory message
    sendMessage(
      "🎉 Great job completing this task! What would you like to focus on next?"
    );
  };

  // Quick suggestions for the chat
  const quickSuggestions = [
    {
      text: "How to approach this?",
      message: "How should I approach this task?",
    },
    {
      text: "What's the first step?",
      message: "What's the first small step I should take?",
    },
    {
      text: "I'm feeling stuck",
      message: "I'm feeling stuck. Help me get started.",
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-4">
        <div className="flex items-center">
          <button
            type="button"
            className="mr-3 bg-indigo-500 rounded-full p-1 hover:bg-indigo-400 transition-colors"
            onClick={onBackToTasks}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-medium">{task.title}</h1>
            <p className="text-indigo-200 text-sm">Due {task.dueTime}</p>
          </div>
          <button
            type="button"
            className={`p-2 rounded-full ${
              focusMode ? "bg-yellow-400" : "bg-indigo-500"
            } hover:opacity-90 transition-opacity`}
            onClick={() => setFocusMode(!focusMode)}
            title={focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
          >
            {focusMode ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div
        className={`flex-grow overflow-auto ${focusMode ? "bg-gray-100" : ""}`}
      >
        {/* Pomodoro Timer Section */}
        <PomodoroTimer user={user} threadId={threadId} focusMode={focusMode} />

        {/* Task Breakdown Section */}
        <TaskBreakdown task={task} focusMode={focusMode} />

        {/* Context section - only show if not in focus mode */}
        {!focusMode && task.context && (
          <div className="p-4 border-b">
            <h2 className="font-medium text-indigo-700 mb-3">Context</h2>
            <div className="bg-gray-50 p-3 rounded-md">
              <p>{task.context}</p>
            </div>
          </div>
        )}

        {/* Suggestions section - only show if not in focus mode */}
        {!focusMode && task.suggestions && (
          <div className="p-4 border-b">
            <h2 className="font-medium text-indigo-700 mb-3">Suggestions</h2>
            <div className="space-y-2">
              {task.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="bg-indigo-50 p-3 rounded-md text-indigo-700"
                >
                  <p>{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI conversation section */}
        <ChatInterface
          user={user}
          threadId={threadId}
          messages={messages}
          isGenerating={isGenerating}
          handleSendMessage={sendMessage}
          handleInputChange={handleInputChange}
          inputValue={inputValue}
          title="Task Assistant"
          quickSuggestions={quickSuggestions}
          focusMode={focusMode}
        />
      </div>

      {/* Action Buttons */}
      <div className="bg-white border-t border-gray-200 p-3 flex justify-around">
        <button
          type="button"
          className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
          onClick={() => handleCreateEmail(task)}
        >
          <Mail size={20} className="mr-1" />
          <span>Create Email</span>
        </button>
        <button
          type="button"
          className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
          onClick={() => {
            onOpenCoach();
            sendMessage(`I need help with my task: "${task.title}"`);
          }}
        >
          <Brain size={20} className="mr-1" />
          <span>Ask Coach</span>
        </button>
        <button
          type="button"
          className="flex items-center text-green-600 hover:text-green-800 transition-colors"
          onClick={handleCompleteTask}
        >
          <Check size={20} className="mr-1" />
          <span>Complete</span>
        </button>
      </div>
    </div>
  );
};

export default TaskDetail;
