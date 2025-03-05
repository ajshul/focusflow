import React from "react";
import { ArrowLeft } from "lucide-react";
import { UserProfile } from "../../models/types";
import { useTaskContext } from "../../context/TaskContext";
import { useChat } from "../../hooks/useChat";
import ChatInterface from "../chat/ChatInterface";

interface LifeCoachViewProps {
  user: UserProfile;
  threadId: string;
  onBackToTasks: () => void;
}

const LifeCoachView: React.FC<LifeCoachViewProps> = ({
  user,
  threadId,
  onBackToTasks,
}) => {
  const { tasks } = useTaskContext();

  // Get context for chat
  const getCoachContext = () => {
    const hour = new Date().getHours();
    let timeOfDay = "morning";
    if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
    if (hour >= 17) timeOfDay = "evening";

    return {
      timeOfDay,
      energyLevel: "medium",
    };
  };

  // Initialize chat functionality
  const {
    messages,
    isGenerating,
    chatInputRef,
    handleInputChange,
    sendMessage,
  } = useChat(user, threadId, getCoachContext);

  // Chat presets
  const chatPresets = [
    {
      text: "How can I better prioritize my workload?",
      message: "How can I better prioritize my workload?",
    },
    {
      text: "I'm feeling overwhelmed. What should I focus on?",
      message: "I'm feeling overwhelmed. What should I focus on?",
    },
    {
      text: "Help me prepare for tomorrow's meetings",
      message: "Help me prepare for tomorrow's meetings",
    },
  ];

  // Task statistics
  const getHighPriorityCount = () =>
    tasks.filter((t) => t.priority === "high" && !t.completed).length;

  return (
    <div className="flex flex-col h-full">
      <div className="bg-teal-600 text-white p-4">
        <div className="flex items-center">
          <button
            type="button"
            className="mr-3 bg-teal-500 rounded-full p-1 hover:bg-teal-400 transition-colors"
            onClick={onBackToTasks}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-medium">Your Life Coach</h1>
            <p className="text-teal-200 text-sm">Available 24/7</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-50 flex-grow overflow-auto">
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h2 className="font-medium text-teal-700 mb-2">Today's Overview</h2>
          <p className="text-gray-600">
            You have {tasks.length} tasks today with {getHighPriorityCount()}{" "}
            high-priority items. Based on your past patterns, mornings are your
            most productive time, so I've prioritized complex tasks earlier in
            the day.
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h2 className="font-medium text-teal-700 mb-2">Recent Insights</h2>
          <div className="space-y-2">
            <div className="bg-teal-50 p-3 rounded-md text-teal-700">
              <p>
                I've noticed you complete tasks more efficiently when they're
                broken down into 3-5 steps.
              </p>
            </div>
            <div className="bg-teal-50 p-3 rounded-md text-teal-700">
              <p>
                Email tasks tend to cause you stress. Consider setting a
                specific time block for communications.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-medium text-teal-700 mb-3">Ask Your Coach</h2>

          <ChatInterface
            user={user}
            threadId={threadId}
            messages={messages}
            isGenerating={isGenerating}
            handleSendMessage={sendMessage}
            handleInputChange={handleInputChange}
            inputValue={chatInputRef.current}
            title="Ask Your Coach"
          />

          <div className="space-y-2 mb-3">
            {chatPresets.map((preset, index) => (
              <button
                key={index}
                type="button"
                className="w-full text-left bg-gray-50 hover:bg-gray-100 p-3 rounded-md transition-colors"
                onClick={() => sendMessage(preset.message)}
              >
                {preset.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LifeCoachView;
