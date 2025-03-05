import React from "react";
import { usePomodoro } from "../../hooks/usePomodoro";
import { useChat } from "../../hooks/useChat";
import { UserProfile } from "../../models/types";

interface PomodoroTimerProps {
  user: UserProfile;
  threadId: string;
  focusMode?: boolean;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  user,
  threadId,
  focusMode = false,
}) => {
  const { setMessages } = useChat(user, threadId);

  const handleTimerComplete = (mode: "work" | "break") => {
    if (mode === "work") {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          content:
            "⏰ Time for a break! Step away from your task for 5 minutes.",
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          content: "⏰ Break is over! Time to get back to your task.",
        },
      ]);
    }
  };

  const {
    minutes,
    seconds,
    isActive,
    mode,
    startTimer,
    pauseTimer,
    resetTimer,
    switchMode,
  } = usePomodoro(handleTimerComplete);

  return (
    <div
      className={`p-4 ${
        focusMode
          ? "bg-white rounded-lg shadow-lg mx-4 mt-4 border"
          : "border-b"
      }`}
    >
      <div className="bg-white shadow rounded-lg p-3 mb-2">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          {mode === "work" ? "🧠 Focus Timer" : "☕ Break Timer"}
        </h3>
        <div className="text-3xl font-bold text-center my-2 font-mono">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
        <div className="flex justify-center space-x-2 mt-2">
          {!isActive ? (
            <button
              type="button"
              className="bg-green-500 text-white px-4 py-1 rounded-md text-sm hover:bg-green-600 transition-colors"
              onClick={startTimer}
            >
              Start
            </button>
          ) : (
            <button
              type="button"
              className="bg-red-500 text-white px-4 py-1 rounded-md text-sm hover:bg-red-600 transition-colors"
              onClick={pauseTimer}
            >
              Pause
            </button>
          )}
          <button
            type="button"
            className="bg-gray-200 px-4 py-1 rounded-md text-sm hover:bg-gray-300 transition-colors"
            onClick={resetTimer}
          >
            Reset
          </button>
          <button
            type="button"
            className="bg-indigo-100 px-4 py-1 rounded-md text-sm hover:bg-indigo-200 transition-colors"
            onClick={switchMode}
          >
            {mode === "work" ? "Switch to Break" : "Switch to Focus"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
