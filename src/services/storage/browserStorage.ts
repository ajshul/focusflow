// src/services/storage/browserStorage.ts
import { Task, UserProfile, Message } from "../../models/types";

class BrowserStorageService {
  private storagePrefix = "focusflow_";

  // Save user profile
  async saveUserProfile(profile: UserProfile): Promise<void> {
    localStorage.setItem(
      `${this.storagePrefix}user_${profile.id}`,
      JSON.stringify({ ...profile, updatedAt: new Date() })
    );
  }

  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const data = localStorage.getItem(`${this.storagePrefix}user_${userId}`);
    return data ? JSON.parse(data) : null;
  }

  // Save tasks
  async saveTasks(userId: string, tasks: Task[]): Promise<void> {
    localStorage.setItem(
      `${this.storagePrefix}tasks_${userId}`,
      JSON.stringify(
        tasks.map((task) => ({
          ...task,
          userId,
          updatedAt: new Date(),
        }))
      )
    );
  }

  // Get tasks for user
  async getUserTasks(userId: string): Promise<Task[]> {
    const data = localStorage.getItem(`${this.storagePrefix}tasks_${userId}`);
    return data ? JSON.parse(data) : [];
  }

  // Chat message history
  async saveMessages(threadId: string, messages: Message[]): Promise<void> {
    localStorage.setItem(
      `${this.storagePrefix}messages_${threadId}`,
      JSON.stringify(messages)
    );
  }

  // Get chat history
  async getMessages(threadId: string): Promise<Message[]> {
    const data = localStorage.getItem(
      `${this.storagePrefix}messages_${threadId}`
    );
    return data ? JSON.parse(data) : [];
  }

  // Clear chat history
  async clearMessages(threadId: string): Promise<void> {
    localStorage.removeItem(`${this.storagePrefix}messages_${threadId}`);
  }
}

export const storageService = new BrowserStorageService();
