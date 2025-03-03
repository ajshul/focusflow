// Task Types
export interface Task {
  id: string | number;
  title: string;
  dueTime: string;
  priority: "low" | "medium" | "high";
  category: "work" | "personal" | "health";
  estimatedTime: string;
  breakdown?: string[];
  context?: string;
  suggestions?: string[];
  completed?: boolean;
  completedAt?: Date;
  breakdownProgress?: boolean[];
}

// User Types
export interface UserProfile {
  id: string;
  name: string;
  occupation: string;
  workStyle: string;
  communicationStyle: string;
  preferences: {
    taskBreakdownStyle: string;
    motivationType: string;
    [key: string]: any;
  };
}

// Message Types
export interface Message {
  sender: "user" | "ai";
  content: string;
  timestamp?: Date;
}
