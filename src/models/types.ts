export interface Task {
  id: number | string;
  title: string;
  dueTime: string;
  priority: "low" | "medium" | "high";
  category: "work" | "personal" | "health";
  estimatedTime: string;
  breakdown?: string[];
  breakdownProgress?: boolean[];
  context?: string;
  suggestions?: string[];
  completed?: boolean;
  completedAt?: Date;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  occupation?: string;
  workStyle?: string;
  communicationStyle?: string;
  preferences?: {
    theme?: string;
    notificationsEnabled?: boolean;
    focusTimePreference?: number;
    taskBreakdownStyle?: string;
    motivationType?: string;
  };
}

export interface Message {
  sender: "user" | "ai";
  content: string;
  timestamp?: Date;
}

export interface ChatResponse {
  sender: "ai";
  content: string;
  threadId?: string;
}
