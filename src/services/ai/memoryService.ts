import { v4 as uuidv4 } from "uuid";
import { Message } from "../../models/types";
import { storageService } from "../storage/browserStorage";

class MemoryService {
  async addMessage(threadId: string, message: Message): Promise<void> {
    const messages = await storageService.getMessages(threadId);
    messages.push({
      ...message,
      timestamp: new Date(),
    });
    await storageService.saveMessages(threadId, messages);
  }

  async getMessages(threadId: string): Promise<Message[]> {
    return storageService.getMessages(threadId);
  }

  async clearMessages(threadId: string): Promise<void> {
    await storageService.clearMessages(threadId);
  }

  createThreadId(): string {
    return uuidv4();
  }
}

export const memoryService = new MemoryService();
