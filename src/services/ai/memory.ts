import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";
import { v4 as uuidv4 } from "uuid";
import { UserProfile, Message, Task } from "../../models/types";
import { memoryService } from "./memoryService";
import { enhancedMemoryService } from "./enhancedMemoryService";

// Initialize environment variables
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

// Initialize the LLM
const llm = new ChatOpenAI({
  openAIApiKey: OPENAI_API_KEY,
  modelName: "gpt-4o", // Adjust based on your requirements
  temperature: 0.2,
});

// Simple function to trim messages
const trimMessages = (messages: any[], maxCount = 10) => {
  // Always keep system messages
  const systemMessages = messages.filter(
    (msg: any) => msg._getType && msg._getType() === "system"
  );
  const nonSystemMessages = messages.filter(
    (msg: any) => !msg._getType || msg._getType() !== "system"
  );

  // If we have too many messages, trim from the oldest (keeping system messages)
  if (nonSystemMessages.length > maxCount) {
    return [...systemMessages, ...nonSystemMessages.slice(-maxCount)];
  }

  return messages;
};

// Send a message to the AI in a task context
export const sendTaskMessage = async (
  message: string,
  userProfile: UserProfile,
  task: Task,
  taskThreadId: string,
  lifeCoachThreadId: string
): Promise<Message> => {
  try {
    // Get context using enhanced memory service
    const context = await enhancedMemoryService.getTaskContext(
      userProfile,
      taskThreadId,
      task,
      lifeCoachThreadId
    );

    // Add user message to history
    const userMessage: Message = {
      sender: "user",
      content: message,
    };

    await memoryService.addMessage(taskThreadId, userMessage, userProfile.id);

    // Create LangChain messages
    const systemMessage = new SystemMessage(context.systemPrompt);
    
    // Convert regular messages to LangChain message format
    const convertedMessages = context.messages.map((msg: Message) =>
      msg.sender === "user"
        ? new HumanMessage(msg.content)
        : new AIMessage(msg.content)
    );
    
    // Add new user message
    const langchainMessages = [
      systemMessage,
      ...convertedMessages,
      new HumanMessage(message)
    ];

    // Call the model
    const response = await llm.invoke(trimMessages(langchainMessages, 10));

    // Add AI response to history
    const aiMessage: Message = {
      sender: "ai",
      content: response.content as string,
    };

    await memoryService.addMessage(taskThreadId, aiMessage, userProfile.id);

    return aiMessage;
  } catch (error) {
    console.error("Error sending task message:", error);
    return {
      sender: "ai",
      content:
        "I'm sorry, I encountered an error. Please try again or check your connection.",
    };
  }
};

// Send a message to the life coach
export const sendLifeCoachMessage = async (
  message: string,
  userProfile: UserProfile,
  tasks: Task[],
  lifeCoachThreadId: string
): Promise<Message> => {
  try {
    // Get context using enhanced memory service
    const context = await enhancedMemoryService.getLifeCoachContext(
      userProfile,
      lifeCoachThreadId,
      tasks
    );

    // Add user message to history
    const userMessage: Message = {
      sender: "user",
      content: message,
    };

    await memoryService.addMessage(lifeCoachThreadId, userMessage, userProfile.id);

    // Create LangChain messages
    const systemMessage = new SystemMessage(context.systemPrompt);
    
    // Convert regular messages to LangChain message format
    const convertedMessages = context.messages.map((msg: Message) =>
      msg.sender === "user"
        ? new HumanMessage(msg.content)
        : new AIMessage(msg.content)
    );
    
    // Add new user message
    const langchainMessages = [
      systemMessage,
      ...convertedMessages,
      new HumanMessage(message)
    ];

    // Call the model
    const response = await llm.invoke(trimMessages(langchainMessages, 10));

    // Add AI response to history
    const aiMessage: Message = {
      sender: "ai",
      content: response.content as string,
    };

    await memoryService.addMessage(lifeCoachThreadId, aiMessage, userProfile.id);

    return aiMessage;
  } catch (error) {
    console.error("Error sending life coach message:", error);
    return {
      sender: "ai",
      content:
        "I'm sorry, I encountered an error. Please try again or check your connection.",
    };
  }
};

// Task breakdown generator
export const breakdownTask = async (task: Task, userProfile: UserProfile): Promise<string[]> => {
  try {
    const systemPrompt = `You are an ADHD-focused assistant that breaks down tasks into clear, manageable steps. 
    Format your response as XML with <step> tags for each step. For example:
    <step>First, gather all required materials</step>
    <step>Next, prepare the workspace</step>
    <step>Then, begin with the first part of the task</step>
    
    Keep steps small, specific, and actionable. Aim for 3-5 steps.`;

    const userPrompt = `Please break down this task into small, manageable steps: "${task.title}"
    Additional context: ${task.context || "None provided"}
    Category: ${task.category}
    Estimated time: ${task.estimatedTime}`;
    
    // Create messages
    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt)
    ];
    
    // Call the model
    const response = await llm.invoke(messages);
    
    // Parse XML from the response
    const content = response.content as string;
    const steps: string[] = [];
    
    // Extract steps using regex
    const stepRegex = /<step>(.*?)<\/step>/g;
    let match;
    
    while ((match = stepRegex.exec(content)) !== null) {
      if (match[1]) {
        steps.push(match[1].trim());
      }
    }
    
    // If no steps were found or parsing failed, fall back to simple text splitting
    if (steps.length === 0) {
      const textSteps = content
        .split(/\n+/)
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0);
      
      return textSteps;
    }
    
    return steps;
  } catch (error) {
    console.error("Error generating task breakdown:", error);
    return [
      "Break the task into smaller steps",
      "Focus on one step at a time",
      "Take breaks between steps if needed",
    ];
  }
};

// Initialize a new thread
export const initializeAIAssistant = (userId: string): { threadId: string } => {
  return {
    threadId: `user_${userId}_coach`,
  };
};

// Initialize a task thread
export const initializeTaskThread = (userId: string, taskId: number): { threadId: string } => {
  return {
    threadId: `user_${userId}_task_${taskId}`,
  };
};

// Add this at the appropriate place in memory.ts
// This is a compatibility function to maintain the previous API
export const sendMessage = async (
  message: string,
  userProfile: UserProfile,
  context: any = {},
  threadId: string
): Promise<Message> => {
  // For backwards compatibility - determine whether this is a task or general context
  // This is a simplified version - in a real application you'd want to improve this logic
  if (context.currentTask) {
    // If there's a task in the context, treat as task message
    const dummyTask: Task = {
      id: 0,
      title: context.currentTask,
      completed: false,
      priority: "medium",
      dueTime: "today",
      category: "work",
      estimatedTime: "30 min"
    };
    
    return sendTaskMessage(message, userProfile, dummyTask, threadId, threadId);
  } else {
    // Otherwise treat as life coach message
    // We'll need to get tasks from somewhere - this is a temporary solution
    const tasks: Task[] = [];
    return sendLifeCoachMessage(message, userProfile, tasks, threadId);
  }
};
