import { Task, Message, UserProfile } from "../../models/types";
import { memoryService } from "./memoryService";

/**
 * Enhanced Memory Service that provides contextual memory management
 * for both life coach and task-specific conversations
 */
export class EnhancedMemoryService {
  // Cache for task summaries to avoid re-summarizing
  private taskSummaryCache: Map<string | number, { summary: string; timestamp: number }> = new Map();
  // Cache timeout in milliseconds (15 minutes)
  private CACHE_TIMEOUT = 15 * 60 * 1000;

  /**
   * Get the full context for the life coach, including ALL conversation history
   */
  async getLifeCoachContext(user: UserProfile, threadId: string, tasks: Task[]): Promise<{
    systemPrompt: string;
    messages: Message[];
  }> {
    // Get life coach messages
    const lifeCoachMessages = await memoryService.getMessages(threadId);
    
    // Get ALL conversations from ALL threads
    const allConversations = await this.getAllConversations(user.id);
    
    // Create a comprehensive system prompt that includes all conversations
    const systemPrompt = this.createEnhancedLifeCoachSystemPrompt(
      user, 
      tasks, 
      allConversations
    );
    
    return {
      systemPrompt,
      messages: lifeCoachMessages
    };
  }
  
  /**
   * Get the context for a specific task including ALL conversation history
   */
  async getTaskContext(
    user: UserProfile, 
    taskThreadId: string, 
    task: Task, 
    lifeCoachThreadId: string
  ): Promise<{
    systemPrompt: string;
    messages: Message[];
  }> {
    // Get task-specific messages
    const taskMessages = await memoryService.getMessages(taskThreadId);
    
    // Get ALL conversations from ALL threads
    const allConversations = await this.getAllConversations(user.id);
    
    // Create an enhanced system prompt with all conversations
    const systemPrompt = this.createEnhancedTaskSystemPrompt(
      user,
      task,
      allConversations
    );
    
    return {
      systemPrompt,
      messages: taskMessages
    };
  }
  
  /**
   * Get ALL conversations from ALL threads for a user
   */
  private async getAllConversations(userId: string): Promise<Record<string, Message[]>> {
    try {
      // Get all threads for this user
      const threadSummaries = await memoryService.getThreads(userId);
      
      // Create a map to store all conversations
      const allConversations: Record<string, Message[]> = {};
      
      // For each thread, get the full conversation history
      for (const threadSummary of threadSummaries) {
        const threadId = threadSummary.id;
        const threadTitle = threadSummary.title;
        const threadType = threadSummary.type;
        
        // Get full message history for this thread
        const messages = await memoryService.getMessages(threadId);
        
        if (messages.length > 0) {
          allConversations[threadId] = messages;
        }
      }
      
      return allConversations;
    } catch (error) {
      console.error("Error getting all conversations:", error);
      return {};
    }
  }
  
  /**
   * Create an enhanced system prompt for a task that includes ALL conversation history
   */
  private createEnhancedTaskSystemPrompt(
    user: UserProfile,
    task: Task,
    allConversations: Record<string, Message[]>
  ): string {
    // Format all conversations for inclusion in the prompt
    const formattedConversations = this.formatAllConversationsForPrompt(allConversations);
    
    return `You are an AI assistant helping ${user.name} with the task: "${task.title}".

USER INFORMATION:
Name: ${user.name}
${user.occupation ? `Occupation: ${user.occupation}` : ""}
${user.workStyle ? `Work Style: ${user.workStyle}` : ""}

TASK DETAILS:
Title: ${task.title}
Category: ${task.category || "Uncategorized"}
Priority: ${task.priority || "medium"}
Due: ${task.dueTime}
${task.context ? `Context: ${task.context}` : ""}

COMPLETE CONVERSATION HISTORY FROM ALL THREADS:
${formattedConversations}

INSTRUCTIONS:
1. Use short, clear sentences that are easy to process
2. Break down complex ideas into steps
3. Use examples and analogies when helpful
4. Emphasize starting small on intimidating tasks
5. Refer to past conversations from ANY thread when relevant
6. Show continuity of thought across different conversations
7. Be encouraging but practical about time management`;
  }
  
  /**
   * Create an enhanced system prompt for the life coach that includes ALL conversation history
   */
  private createEnhancedLifeCoachSystemPrompt(
    user: UserProfile,
    tasks: Task[],
    allConversations: Record<string, Message[]>
  ): string {
    // Get task statistics
    const completedTasks = tasks.filter(t => t.completed).length;
    const highPriorityCount = tasks.filter(t => t.priority === "high" && !t.completed).length;
    
    // Format all conversations for inclusion in the prompt
    const formattedConversations = this.formatAllConversationsForPrompt(allConversations);
    
    return `You are an AI assistant specifically designed to help ${user.name} with ADHD manage tasks and life responsibilities.
    
IMPORTANT: You have access to ALL previous conversations across all tasks. Use this knowledge to provide continuity and context-aware responses.

USER INFORMATION:
Name: ${user.name}
${user.occupation ? `Occupation: ${user.occupation}` : ""}
${user.workStyle ? `Work Style: ${user.workStyle}` : ""}
${user.communicationStyle ? `Communication Style: ${user.communicationStyle}` : ""}

TASK OVERVIEW:
Total Tasks: ${tasks.length}
Completed Tasks: ${completedTasks}
High Priority Tasks: ${highPriorityCount}

DETAILED TASKS:
${tasks.map(task => 
  `- ${task.completed ? "✓" : "○"} ${task.title} (Priority: ${task.priority}, Due: ${task.dueTime})`
).join('\n')}

COMPLETE CONVERSATION HISTORY FROM ALL THREADS:
${formattedConversations}

INSTRUCTIONS:
1. Use short, clear sentences that are easy to process
2. Break down complex concepts into simpler parts
3. Provide specific, actionable advice
4. Always reference relevant past conversations regardless of which thread they occurred in
5. Identify patterns across tasks and suggest optimizations
6. Adapt to the user's communication style and preferences
7. Your primary role is to help connect knowledge across different tasks and provide a unified view

Your role is to be a life coach who helps manage the big picture while being aware of all individual tasks and conversations.`;
  }
  
  /**
   * Format all conversations from all threads for inclusion in the prompt
   */
  private formatAllConversationsForPrompt(allConversations: Record<string, Message[]>): string {
    const conversationBlocks: string[] = [];
    
    // Process each thread's conversation
    for (const [threadId, messages] of Object.entries(allConversations)) {
      if (messages.length === 0) continue;
      
      // Determine thread type and name
      let threadName = threadId;
      if (threadId.includes('_task_')) {
        const taskId = threadId.split('_task_')[1];
        threadName = `Task ${taskId}`;
      } else if (threadId.includes('_coach')) {
        threadName = 'Life Coach';
      }
      
      // Format the conversation for this thread
      // For long conversations, prioritize the most recent messages
      const MAX_MESSAGES = 10; // Limit to control prompt size
      const recentMessages = messages.length > MAX_MESSAGES 
        ? messages.slice(-MAX_MESSAGES)
        : messages;
      
      const formattedConversation = recentMessages.map(msg => 
        `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n');
      
      conversationBlocks.push(`--- Thread: ${threadName} ---\n${formattedConversation}`);
    }
    
    if (conversationBlocks.length === 0) {
      return "No previous conversations available.";
    }
    
    return conversationBlocks.join('\n\n');
  }
  
  /**
   * Helper method to extract thread ID info
   */
  private getThreadInfo(threadId: string): { type: string, name: string, id?: string } {
    if (threadId.includes('_task_')) {
      const taskId = threadId.split('_task_')[1];
      return { type: 'task', name: `Task ${taskId}`, id: taskId };
    } else if (threadId.includes('_coach')) {
      return { type: 'coach', name: 'Life Coach' };
    }
    return { type: 'unknown', name: threadId };
  }
  
  /**
   * Get summaries of all task conversations
   */
  private async getTaskSummaries(tasks: Task[]): Promise<string[]> {
    const summaries: string[] = [];
    
    for (const task of tasks) {
      // Skip if task has no ID (shouldn't happen but just in case)
      if (!task.id) continue;
      
      // Check cache first
      const cached = this.taskSummaryCache.get(String(task.id));
      if (cached && (Date.now() - cached.timestamp < this.CACHE_TIMEOUT)) {
        summaries.push(`Task "${task.title}": ${cached.summary}`);
        continue;
      }
      
      try {
        // Get task thread ID (assuming a convention like "task-{taskId}")
        const taskThreadId = `task-${task.id}`;
        
        // Get messages for this task
        const messages = await memoryService.getMessages(taskThreadId);
        
        if (messages.length === 0) {
          summaries.push(`Task "${task.title}": No conversation history yet.`);
          continue;
        }
        
        // Summarize the conversation - in a real implementation, you might 
        // use an LLM to generate this summary
        const summary = this.summarizeConversation(messages);
        
        // Cache the summary
        this.taskSummaryCache.set(String(task.id), {
          summary,
          timestamp: Date.now()
        });
        
        summaries.push(`Task "${task.title}": ${summary}`);
      } catch (error) {
        console.error(`Error summarizing task ${task.id}:`, error);
        summaries.push(`Task "${task.title}": Error retrieving conversation.`);
      }
    }
    
    return summaries;
  }
  
  /**
   * Get insights from the life coach that are relevant to a specific task
   */
  private async getRelevantLifeCoachInsights(
    lifeCoachThreadId: string, 
    task: Task
  ): Promise<string> {
    try {
      const lifeCoachMessages = await memoryService.getMessages(lifeCoachThreadId);
      
      if (lifeCoachMessages.length === 0) {
        return "No life coach insights available yet.";
      }
      
      // In a real implementation, you would use an LLM to identify relevant insights
      // For now, we'll use a simple keyword matching approach
      const relevantMessages = lifeCoachMessages.filter(msg => {
        const content = msg.content.toLowerCase();
        const taskTitle = task.title.toLowerCase();
        const taskKeywords = [
          taskTitle,
          task.category || "",
          ...taskTitle.split(" ")
        ];
        
        return taskKeywords.some(keyword => 
          keyword.length > 3 && content.includes(keyword)
        );
      });
      
      if (relevantMessages.length === 0) {
        return "No specific insights about this task yet.";
      }
      
      // Format the insights
      return relevantMessages
        .map(msg => `- ${msg.sender === "ai" ? "Advice" : "You mentioned"}: "${this.truncate(msg.content)}"`)
        .join("\n");
    } catch (error) {
      console.error("Error getting life coach insights:", error);
      return "Error retrieving life coach insights.";
    }
  }
  
  /**
   * Get insights from other tasks
   */
  private async getRelevantTaskInsights(
    userId: string,
    currentTaskThreadId: string,
    currentTask: Task
  ): Promise<string> {
    try {
      // Get all user thread IDs except the current one
      const userThreads = await this.getUserThreads(userId);
      const otherTaskThreads = userThreads.filter(thread => 
        thread.includes('_task_') && thread !== currentTaskThreadId
      );
      
      if (otherTaskThreads.length === 0) {
        return "No previous task conversations to reference.";
      }
      
      let allInsights: string[] = [];
      
      // For each thread, get relevant messages
      for (const threadId of otherTaskThreads) {
        const messages = await memoryService.getMessages(threadId);
        if (messages.length === 0) continue;
        
        // Extract task ID from thread ID
        const taskIdMatch = threadId.match(/_task_(\d+)/);
        if (!taskIdMatch) continue;
        
        // Find relevant messages that might be useful
        const relevantMessages = this.findRelevantMessages(messages, currentTask);
        if (relevantMessages.length === 0) continue;
        
        // Format into insight
        const taskInsight = `From work on task thread ${threadId}: ${
          relevantMessages.map(msg => 
            `"${this.truncate(msg.content, 100)}"`
          ).join(" → ")
        }`;
        
        allInsights.push(taskInsight);
      }
      
      if (allInsights.length === 0) {
        return "No relevant insights from other tasks.";
      }
      
      return allInsights.join("\n\n");
    } catch (error) {
      console.error("Error getting insights from other tasks:", error);
      return "Error retrieving insights from other tasks.";
    }
  }
  
  /**
   * Helper to find relevant messages
   */
  private findRelevantMessages(messages: Message[], currentTask: Task): Message[] {
    const taskKeywords = [
      ...currentTask.title.toLowerCase().split(/\s+/),
      currentTask.category || "",
    ].filter(k => k.length > 3);
    
    return messages.filter(msg => {
      // Only consider the most informative messages
      if (msg.content.length < 30) return false;
      
      const content = msg.content.toLowerCase();
      return taskKeywords.some(keyword => content.includes(keyword));
    }).slice(-3); // Just take the most recent relevant ones
  }
  
  /**
   * Get all threads for a user
   */
  private async getUserThreads(userId: string): Promise<string[]> {
    try {
      // Get threads using memoryService which already has fallback handling
      const threadSummaries = await memoryService.getThreads(userId);
      return threadSummaries.map(summary => summary.id);
    } catch (error) {
      console.error("Error getting user threads:", error);
      
      // Fallback to localStorage if needed
      try {
        const allKeys = Object.keys(localStorage);
        const threadKeys = allKeys.filter(key => 
          key.includes('focusflow_messages_') && 
          key.includes(`user_${userId}`)
        );
        return threadKeys.map(key => key.replace('focusflow_messages_', ''));
      } catch (err) {
        console.error("Error in localStorage fallback for threads:", err);
        return [];
      }
    }
  }
  
  /**
   * Simple helper to summarize a conversation
   * In a production app, you would use an LLM for this
   */
  private summarizeConversation(messages: Message[]): string {
    // Skip if no messages
    if (messages.length === 0) return "No conversation yet.";
    
    // Count message types
    const userMsgCount = messages.filter(m => m.sender === "user").length;
    const aiMsgCount = messages.filter(m => m.sender === "ai").length;
    
    // Get the most recent messages (up to 3)
    const recentMessages = messages.slice(-3);
    const recentTopics = recentMessages
      .filter(m => m.sender === "user")
      .map(m => this.truncate(m.content, 50))
      .map(content => `"${content}"`)
      .join(", ");
    
    return `${userMsgCount} user messages, ${aiMsgCount} AI responses. Recent topics: ${recentTopics || "None"}`;
  }
  
  /**
   * Helper to truncate long strings
   */
  private truncate(text: string, maxLength = 100): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }
}

// Create and export singleton instance
export const enhancedMemoryService = new EnhancedMemoryService(); 