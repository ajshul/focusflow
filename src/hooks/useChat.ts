import { useState, useCallback } from "react";
import { Message, UserProfile } from "../models/types";
import { sendMessage } from "../services/ai/memory";

interface ChatContext {
  currentTask?: string;
  timeOfDay: string;
  energyLevel: string;
}

interface UseChatReturn {
  messages: Message[];
  isGenerating: boolean;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sendMessage: (messageText?: string) => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  initializeChat: (initialMessage: string) => void;
}

export const useChat = (
  user: UserProfile,
  threadId: string,
  getContextFn?: () => ChatContext
): UseChatReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const getContext = useCallback(() => {
    if (getContextFn) {
      return getContextFn();
    }

    // Default context if no function provided
    const hour = new Date().getHours();
    let timeOfDay = "morning";
    if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
    if (hour >= 17) timeOfDay = "evening";

    return {
      timeOfDay,
      energyLevel: "medium",
    };
  }, [getContextFn]);

  const sendChatMessage = useCallback(
    async (messageText?: string) => {
      const text = messageText || inputValue.trim();
      if (!text) return;

      // Append user message
      setMessages((prev) => [...prev, { sender: "user", content: text }]);

      setInputValue("");
      setIsGenerating(true);

      try {
        const response = await sendMessage(text, user, getContext(), threadId);

        // Append AI response
        setMessages((prev) => [...prev, response]);
      } catch (error) {
        console.error("AI communication error:", error);
        setMessages((prev) => [
          ...prev,
          { sender: "ai", content: "Error. Please try again." },
        ]);
      }

      setIsGenerating(false);
    },
    [user, threadId, getContext]
  );

  const initializeChat = useCallback((initialMessage: string) => {
    setMessages([
      {
        sender: "ai",
        content: initialMessage,
      },
    ]);
  }, []);

  return {
    messages,
    isGenerating,
    inputValue,
    setInputValue,
    handleInputChange,
    sendMessage: sendChatMessage,
    setMessages,
    initializeChat,
  };
};
