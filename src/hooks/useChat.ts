import { useState, useCallback, useEffect } from "react";
import { Message, UserProfile, Task } from "../models/types";
import { sendTaskMessage, sendLifeCoachMessage } from "../services/ai/memory";
import { useTaskContext } from "../context/TaskContext";
import { memoryService } from "../services/ai/memoryService";

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

// Add the original useChat function to maintain backward compatibility
export const useChat = (
  user: UserProfile,
  threadId: string
): UseChatReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // This is a simplified version since we're maintaining compatibility
  // In a real app, you'd want to refactor all code to use the new hooks
  const sendChatMessage = useCallback(
    async (messageText?: string) => {
      const text = messageText || inputValue.trim();
      if (!text) return;

      // Append user message to the UI immediately
      setMessages((prev) => [...prev, { sender: "user", content: text }]);
      
      setInputValue("");
      setIsGenerating(true);

      // For compatibility, just add AI response that directs to new system
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { 
            sender: "ai", 
            content: "I'm still here, but the system has been updated. You may need to refresh the page to access all features." 
          }
        ]);
        setIsGenerating(false);
      }, 1000);
    },
    [inputValue]
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

export const useTaskChat = (
  user: UserProfile,
  task: Task,
  taskThreadId: string,
  lifeCoachThreadId: string
): UseChatReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load existing messages when the component mounts
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const existingMessages = await memoryService.getMessages(taskThreadId);
        if (existingMessages.length > 0) {
          setMessages(existingMessages);
          setIsLoaded(true);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };

    loadMessages();
  }, [taskThreadId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const sendChatMessage = useCallback(
    async (messageText?: string) => {
      const text = messageText || inputValue.trim();
      if (!text) return;

      // Append user message only if not already loaded from storage
      setMessages((prev) => [...prev, { sender: "user", content: text }]);

      setInputValue("");
      setIsGenerating(true);

      try {
        const response = await sendTaskMessage(
          text, 
          user, 
          task, 
          taskThreadId, 
          lifeCoachThreadId
        );

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
    [user, task, taskThreadId, lifeCoachThreadId, inputValue]
  );

  const initializeChat = useCallback((initialMessage: string) => {
    // Only initialize with welcome message if we don't have existing messages
    if (messages.length === 0 && !isLoaded) {
      setMessages([
        {
          sender: "ai",
          content: initialMessage,
        },
      ]);
    }
  }, [messages.length, isLoaded]);

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

export const useLifeCoachChat = (
  user: UserProfile,
  lifeCoachThreadId: string
): UseChatReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const { tasks } = useTaskContext(); // Get all tasks from context

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const sendChatMessage = useCallback(
    async (messageText?: string) => {
      const text = messageText || inputValue.trim();
      if (!text) return;

      // Append user message
      setMessages((prev) => [...prev, { sender: "user", content: text }]);

      setInputValue("");
      setIsGenerating(true);

      try {
        const response = await sendLifeCoachMessage(
          text, 
          user, 
          tasks, 
          lifeCoachThreadId
        );

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
    [user, tasks, lifeCoachThreadId, inputValue]
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
