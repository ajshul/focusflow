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
   * Add a message to a thread's history
   * @param threadId - The ID of the chat thread
   * @param message - The message to add
   */
  async addMessage(threadId: string, message: Message): Promise<void> {
    try {
      // Generate a unique ID for this message
      const messageId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      if (this.usingFallback) {
        // Use in-memory storage with JavaScript Date object
        const inMemoryMessage: Message = {
          ...message,
          timestamp: new Date(),
          id: messageId,
        };

        if (!inMemoryMessages.has(threadId)) {
          inMemoryMessages.set(threadId, []);
        }
        inMemoryMessages.get(threadId)!.push(inMemoryMessage);
        return;
      }

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
    } catch (error) {
      console.error("Error adding message:", error);
      // Fallback to in-memory if Firestore fails
      this.usingFallback = true;
      await this.addMessage(threadId, message);
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
      const q = query(messagesColRef, orderBy("timestamp", "asc"));
      const querySnapshot = await getDocs(q);

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
   * Get all thread IDs for a user
   * @param userId - The ID of the user
   * @returns An array of thread IDs
   */
  async getThreads(userId: string): Promise<string[]> {
    try {
      if (this.usingFallback) {
        // Use in-memory storage
        return Array.from(inMemoryMessages.keys());
      }

      if (!db) {
        throw new Error("Firestore is not initialized");
      }

      // In a real app, you would query threads by user ID
      // For this example, we'll just get all threads
      const threadsColRef = collection(db, "threads");
      const querySnapshot = await getDocs(threadsColRef);

      const threadIds: string[] = [];
      querySnapshot.forEach((doc) => {
        threadIds.push(doc.id);
      });

      return threadIds;
    } catch (error) {
      console.error("Error getting threads:", error);
      // Switch to fallback if needed
      this.usingFallback = true;
      return this.getThreads(userId);
    }
  }
}

export const memoryService = new FirestoreMemoryService();
