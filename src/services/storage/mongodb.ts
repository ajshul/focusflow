import { MongoClient } from "mongodb";
import { MongoDBChatMessageHistory } from "@langchain/mongodb";
import { Task, UserProfile } from "../../models/types";

// MongoDB connection details
const MONGODB_URI = process.env.REACT_APP_MONGODB_URI || "";
const DB_NAME = "focusflow";

let client: MongoClient | null = null;

// Initialize MongoDB connection
export const initMongoDB = async () => {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log("MongoDB connected successfully");
    return true;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    return false;
  }
};

// Create chat history for a user
export const createChatHistory = (userId: string) => {
  if (!client) {
    throw new Error("MongoDB not initialized");
  }

  const collection = client.db(DB_NAME).collection("messages");

  return new MongoDBChatMessageHistory({
    collection,
    sessionId: userId,
  });
};

// Save user profile
export const saveUserProfile = async (profile: UserProfile) => {
  if (!client) {
    throw new Error("MongoDB not initialized");
  }

  const collection = client.db(DB_NAME).collection("users");

  await collection.updateOne(
    { id: profile.id },
    { $set: { ...profile, updatedAt: new Date() } },
    { upsert: true }
  );
};

// Get user profile
export const getUserProfile = async (userId: string) => {
  if (!client) {
    throw new Error("MongoDB not initialized");
  }

  const collection = client.db(DB_NAME).collection("users");
  return collection.findOne({ id: userId });
};

// Save tasks
export const saveTasks = async (userId: string, tasks: Task[]) => {
  if (!client) {
    throw new Error("MongoDB not initialized");
  }

  const collection = client.db(DB_NAME).collection("tasks");

  // Delete existing tasks for user
  await collection.deleteMany({ userId });

  // Insert new tasks
  if (tasks.length > 0) {
    await collection.insertMany(
      tasks.map((task) => ({ ...task, userId, updatedAt: new Date() }))
    );
  }
};

// Get tasks for user
export const getUserTasks = async (userId: string) => {
  if (!client) {
    throw new Error("MongoDB not initialized");
  }

  const collection = client.db(DB_NAME).collection("tasks");
  return collection.find({ userId }).toArray();
};
