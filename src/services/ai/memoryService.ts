import { Message } from "../../models/types";
import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  updateDoc,
  Firestore,
  CollectionReference,
  DocumentData,
  QuerySnapshot,
  DocumentReference,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getFirebaseConfig } from "../storage/firebaseConfigHelper";

// Get Firebase configuration from helper
const firebaseConfig = getFirebaseConfig();

// Initialize Firebase
let app: FirebaseApp | undefined;
let db: Firestore | undefined;

// Use try-catch to handle any initialization errors
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log(
    "Firebase initialized successfully with project ID:",
    firebaseConfig.projectId
  );
} catch (error) {
  console.error("Error initializing Firebase:", error);

  // Create a fallback in-memory storage if Firebase fails
  console.log("Using in-memory message storage as fallback");
}

// Fallback in-memory storage
const inMemoryMessages = new Map<string, Message[]>();
const inMemoryUserThreads = new Map<string, Set<string>>();

// Message with Firestore fields for internal use
interface FirestoreMessage extends Omit<Message, "timestamp" | "editedAt"> {
  timestamp: any; // Using any to accommodate both Date and Firestore Timestamp
  editedAt?: any;
}

/**
 * Service for managing chat memory using Firestore with fallback to in-memory storage
 */
class FirestoreMemoryService {
  // Flag to track if we're using the fallback storage
  usingFallback = false;

  constructor() {
    // Check if Firebase is properly initialized
    this.usingFallback = !db;
    if (this.usingFallback) {
      console.warn("Using in-memory fallback storage instead of Firestore");
    }
  }

  /**
   * Add a message to a thread and register the thread with the user
   */
  async addMessage(threadId: string, message: Message, userId?: string): Promise<void> {
    try {
      // Extract user ID from threadId if not provided
      if (!userId && threadId.startsWith('user_')) {
        userId = threadId.split('_')[1];
      }
      
      // Add the message to the thread
      if (this.usingFallback) {
        // In-memory storage logic
        if (!inMemoryMessages.has(threadId)) {
          inMemoryMessages.set(threadId, []);
        }
        const messages = inMemoryMessages.get(threadId)!;
        messages.push({ ...message, timestamp: new Date() });
        
        // Register the thread with the user if we have a userId
        if (userId) {
          if (!inMemoryUserThreads.has(userId)) {
            inMemoryUserThreads.set(userId, new Set());
          }
          inMemoryUserThreads.get(userId)!.add(threadId);
        }
        return;
      }
      
      // Firestore logic - standard implementation
      // Generate a unique ID for this message
      const messageId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // For Firestore, use serverTimestamp()
      const firestoreMessage: FirestoreMessage = {
        ...message,
        timestamp: serverTimestamp(),
        id: messageId,
      };

      if (!db) {
        throw new Error("Firestore is not initialized");
      }

      // Create a reference to the messages collection for this thread
      const messagesColRef = collection(db, "threads", threadId, "messages");

      // Add the message to Firestore
      await setDoc(doc(messagesColRef, messageId), firestoreMessage);

      console.log(`Message added to thread ${threadId}`);

      // Also register the thread with the user if we have a userId
      if (userId && db) {
        const userThreadRef = doc(db, "users", userId, "threads", threadId);
        await setDoc(userThreadRef, { 
          threadId,
          type: threadId.includes('_task_') ? 'task' : 'coach',
          lastUpdated: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error adding message:", error);
      this.usingFallback = true;
      return this.addMessage(threadId, message);
    }
  }

  /**
   * Get all messages for a thread
   * @param threadId - The ID of the chat thread
   * @returns An array of messages
   */
  async getMessages(threadId: string): Promise<Message[]> {
    try {
      if (this.usingFallback) {
        // Use in-memory storage
        return inMemoryMessages.get(threadId) || [];
      }

      if (!db) {
        throw new Error("Firestore is not initialized");
      }

      // Create a reference to the messages collection for this thread
      const messagesColRef = collection(db, "threads", threadId, "messages");

      // Query the messages, ordered by timestamp
      let attempt = 0;
      const maxAttempts = 3;
      let querySnapshot = null;
      
      while (attempt < maxAttempts) {
        try {
          const q = query(messagesColRef, orderBy("timestamp", "asc"));
          querySnapshot = await getDocs(q);
          break; // Success, exit loop
        } catch (err) {
          attempt++;
          if (attempt >= maxAttempts) throw err;
          console.warn(`Firestore query attempt ${attempt} failed, retrying...`);
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt)));
        }
      }

      // Ensure we have a valid querySnapshot
      if (!querySnapshot) {
        console.error("Failed to retrieve messages after multiple attempts");
        return [];
      }

      // Convert the query results to an array of Message objects
      const messages: Message[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const message: Message = {
          sender: data.sender,
          content: data.content,
          id: data.id,
          // Handle both server timestamps and already processed timestamps
          timestamp:
            data.timestamp instanceof Timestamp
              ? data.timestamp.toDate()
              : data.timestamp
              ? new Date(data.timestamp)
              : new Date(),
          // Handle editedAt field if present
          editedAt:
            data.editedAt instanceof Timestamp
              ? data.editedAt.toDate()
              : data.editedAt
              ? new Date(data.editedAt)
              : undefined,
        };
        messages.push(message);
      });

      return messages;
    } catch (error) {
      console.error("Error getting messages:", error);
      // Switch to fallback and try again
      this.usingFallback = true;
      // Set this session to consistently use fallback
      localStorage.setItem('use_memory_fallback', 'true');
      return this.getMessages(threadId);
    }
  }

  /**
   * Delete a specific message
   * @param threadId - The ID of the chat thread
   * @param messageId - The ID of the message to delete
   */
  async deleteMessage(threadId: string, messageId: string): Promise<void> {
    try {
      if (this.usingFallback) {
        // Use in-memory storage
        const messages = inMemoryMessages.get(threadId) || [];
        inMemoryMessages.set(
          threadId,
          messages.filter((msg) => msg.id !== messageId)
        );
        return;
      }

      if (!db) {
        throw new Error("Firestore is not initialized");
      }

      // Create a reference to the specific message
      const messageRef = doc(db, "threads", threadId, "messages", messageId);

      // Delete the message
      await deleteDoc(messageRef);

      console.log(`Message ${messageId} deleted from thread ${threadId}`);
    } catch (error) {
      console.error("Error deleting message:", error);
      // Switch to fallback if needed
      this.usingFallback = true;
      await this.deleteMessage(threadId, messageId);
    }
  }

  /**
   * Update a specific message
   * @param threadId - The ID of the chat thread
   * @param messageId - The ID of the message to update
   * @param newContent - The new content for the message
   */
  async updateMessage(
    threadId: string,
    messageId: string,
    newContent: string
  ): Promise<void> {
    try {
      if (this.usingFallback) {
        // Use in-memory storage
        const messages = inMemoryMessages.get(threadId) || [];
        const message = messages.find((msg) => msg.id === messageId);
        if (message) {
          message.content = newContent;
          message.editedAt = new Date();
        }
        return;
      }

      if (!db) {
        throw new Error("Firestore is not initialized");
      }

      // Create a reference to the specific message
      const messageRef = doc(db, "threads", threadId, "messages", messageId);

      // Update the message content
      await updateDoc(messageRef, {
        content: newContent,
        editedAt: serverTimestamp(),
      });

      console.log(`Message ${messageId} updated in thread ${threadId}`);
    } catch (error) {
      console.error("Error updating message:", error);
      // Switch to fallback if needed
      this.usingFallback = true;
      await this.updateMessage(threadId, messageId, newContent);
    }
  }

  /**
   * Clear all messages for a thread
   * @param threadId - The ID of the chat thread
   */
  async clearThread(threadId: string): Promise<void> {
    try {
      if (this.usingFallback) {
        // Use in-memory storage
        inMemoryMessages.set(threadId, []);
        return;
      }

      if (!db) {
        throw new Error("Firestore is not initialized");
      }

      // Get all messages in the thread
      const messagesColRef = collection(db, "threads", threadId, "messages");
      const querySnapshot = await getDocs(messagesColRef);

      // Delete each message
      const deletePromises = querySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );

      await Promise.all(deletePromises);

      console.log(`All messages cleared from thread ${threadId}`);
    } catch (error) {
      console.error("Error clearing thread:", error);
      // Switch to fallback if needed
      this.usingFallback = true;
      await this.clearThread(threadId);
    }
  }

  /**
   * Get all threads for a user
   */
  async getThreads(userId: string): Promise<{id: string, type: string, title: string}[]> {
    try {
      if (this.usingFallback) {
        // In-memory storage
        const threadIds = Array.from(inMemoryUserThreads.get(userId) || []);
        return threadIds.map(id => {
          const isTask = id.includes('_task_');
          const taskId = isTask ? id.split('_task_')[1] : '';
          
          return {
            id,
            type: isTask ? 'task' : 'coach',
            title: isTask ? `Task ${taskId}` : 'Life Coach'
          };
        });
      }
      
      if (!db) throw new Error("Firestore is not initialized");
      
      const threadsRef = collection(db, "users", userId, "threads");
      const querySnapshot = await getDocs(threadsRef);
      
      const threads: {id: string, type: string, title: string}[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const isTask = data.threadId.includes('_task_');
        const taskId = isTask ? data.threadId.split('_task_')[1] : '';
        
        threads.push({
          id: data.threadId,
          type: data.type || (isTask ? 'task' : 'coach'),
          title: isTask ? `Task ${taskId}` : 'Life Coach'
        });
      });
      
      return threads;
    } catch (error) {
      console.error("Error getting threads:", error);
      this.usingFallback = true;
      return this.getThreads(userId);
    }
  }
}

export const memoryService = new FirestoreMemoryService();
