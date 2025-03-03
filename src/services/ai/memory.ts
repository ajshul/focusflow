import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";
import { v4 as uuidv4 } from "uuid";
import { UserProfile, Message } from "../../models/types";
import { memoryService } from "./memoryService";

// Initialize environment variables
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

// Initialize the LLM
const llm = new ChatOpenAI({
  openAIApiKey: OPENAI_API_KEY,
  modelName: "gpt-4", // Adjust based on your requirements
  temperature: 0.2,
});

// Simple function to trim messages
const trimMessages = (messages: any[], maxCount = 10) => {
  // Always keep system messages
  const systemMessages = messages.filter((msg: any) => msg.role === "system");
  const nonSystemMessages = messages.filter(
    (msg: any) => msg.role !== "system"
  );

  // If we have too many messages, trim from the oldest (keeping system messages)
  if (nonSystemMessages.length > maxCount) {
    return [...systemMessages, ...nonSystemMessages.slice(-maxCount)];
  }

  return messages;
};

// Create system prompt that includes user information
const createPersonalizedPrompt = (
  userProfile: UserProfile,
  context: { currentTask?: string; timeOfDay: string; energyLevel: string },
  messages: Message[]
) => {
  const systemMessage = new SystemMessage(
    `You are an AI assistant specifically designed to help users with ADHD manage tasks.
    
    USER INFORMATION:
    Name: ${userProfile.name}
    Occupation: ${userProfile.occupation}
    Work Style: ${userProfile.workStyle}
    Communication Style: ${userProfile.communicationStyle}
    
    CONTEXT:
    Current Task: ${context.currentTask || "None"}
    Time of Day: ${context.timeOfDay}
    Energy Level: ${context.energyLevel}
    
    INSTRUCTIONS:
    1. Use short, clear sentences that are easy to process
    2. Break down complex tasks into smaller, actionable steps
    3. Provide specific, concrete instructions rather than abstract concepts
    4. Adapt to the user's communication style and preferences
    5. Help maintain focus on the current task
    6. Remember past interactions to provide consistent support
    7. Use the user's personal information to tailor your responses
    
    Your goal is to reduce cognitive load and make task management easier.`
  );

  // Convert regular messages to LangChain message format
  const convertedMessages = messages.map((msg: Message) =>
    msg.sender === "user"
      ? new HumanMessage(msg.content)
      : new AIMessage(msg.content)
  );

  return [systemMessage, ...convertedMessages];
};

// Send a message to the AI
export const sendMessage = async (
  message: string,
  userProfile: UserProfile,
  contextInfo: { currentTask?: string; timeOfDay: string; energyLevel: string },
  threadId: string
): Promise<Message> => {
  // Get existing messages
  const existingMessages = await memoryService.getMessages(threadId);

  // Add user message to history
  const userMessage: Message = {
    sender: "user",
    content: message,
  };

  await memoryService.addMessage(threadId, userMessage);

  // Prepare messages for LLM
  const messages = createPersonalizedPrompt(
    userProfile,
    contextInfo,
    trimMessages([...existingMessages, userMessage] as any[], 10) as Message[]
  );

  // Call the model
  const response = await llm.invoke(messages);

  // Add AI response to history
  const aiMessage: Message = {
    sender: "ai",
    content: response.content as string,
  };

  await memoryService.addMessage(threadId, aiMessage);

  return aiMessage;
};

// Task breakdown function
export const breakdownTask = async (
  taskDescription: string,
  userProfile: UserProfile
): Promise<string[]> => {
  const prompt = [
    new SystemMessage(
      `You are an ADHD task breakdown specialist. Break the following task into 3-5 small, concrete steps.
      
      User has these work preferences: ${userProfile.workStyle}
      
      Make the first step extremely small and easy to start (reduce activation energy).
      Be specific and actionable.
      Avoid vague instructions.`
    ),
    new HumanMessage(taskDescription),
  ];

  const response = await llm.invoke(prompt);

  // Parse the breakdown into an array of steps
  const content = response.content as string;
  const steps = content
    .split(/\d+\./)
    .filter((step) => step.trim())
    .map((step) => step.trim());

  return steps;
};

// Initialize a new thread
export const initializeAIAssistant = (): { threadId: string } => {
  return {
    threadId: uuidv4(),
  };
};
