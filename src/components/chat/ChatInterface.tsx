import React, { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send } from "lucide-react";
import { Message, UserProfile } from "../../models/types";
import { useChat } from "../../hooks/useChat";

interface ChatInterfaceProps {
  user: UserProfile;
  threadId: string;
  messages: Message[];
  isGenerating: boolean;
  handleSendMessage: (message?: string) => Promise<void>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputValue: string;
  title?: string;
  quickSuggestions?: Array<{ text: string; message: string }>;
  focusMode?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  user,
  threadId,
  messages,
  isGenerating,
  handleSendMessage,
  handleInputChange,
  inputValue,
  title = "Task Assistant",
  quickSuggestions,
  focusMode = false,
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      className={`p-4 ${
        focusMode ? "bg-white rounded-lg shadow-lg mx-4 my-4 border" : ""
      }`}
    >
      <h2 className="font-medium text-indigo-700 mb-3">{title}</h2>

      <div
        ref={chatContainerRef}
        className="bg-gray-50 rounded-lg p-3 mb-3 max-h-80 overflow-y-auto"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-3 ${message.sender === "user" ? "text-right" : ""}`}
          >
            <div
              className={`inline-block p-3 rounded-lg max-w-xs sm:max-w-sm ${
                message.sender === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-white border text-gray-800"
              }`}
            >
              {message.sender === "user" ? (
                <p className="whitespace-pre-line">{message.content}</p>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="mb-3">
            <div className="inline-block p-3 rounded-lg bg-white border text-gray-800">
              <p>Thinking...</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick suggestions */}
      {quickSuggestions && (
        <div className="mb-3 flex flex-wrap gap-2">
          {quickSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md text-xs hover:bg-indigo-100 transition-colors"
              onClick={() => handleSendMessage(suggestion.message)}
            >
              {suggestion.text}
            </button>
          ))}
        </div>
      )}

      <div className="flex">
        <input
          ref={inputRef}
          type="text"
          className="flex-grow border rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Ask about this task..."
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
        />
        <button
          type="button"
          className="bg-indigo-600 text-white p-2 rounded-r-lg hover:bg-indigo-700 transition-colors"
          onClick={() => handleSendMessage()}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
