import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { UserProfile } from "./models/types";
import LifeFlowApp from "./components/LifeFlowApp";
import { initializeAIAssistant } from "./services/ai/memory";
import { storageService } from "./services/storage/browserStorage";

function App() {
  console.log("App: render started"); // Debugging re-renders

  // 🔹 Ensure user ID is constant and doesn't trigger re-renders
  const userId = localStorage.getItem("userId") || uuidv4();

  // 🔹 Ensure user state remains stable across renders
  const [user, setUser] = useState<UserProfile>(() => ({
    id: userId,
    name: "Alex",
    occupation: "Product Manager",
    workStyle: "Visual thinker who works in short bursts",
    communicationStyle: "Concise and friendly with specific examples",
    preferences: {
      taskBreakdownStyle: "Very small steps",
      motivationType: "Achievement oriented",
    },
  }));

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  // 🔹 Store AI Thread ID without re-creating it unnecessarily
  const [aiThread, setAiThread] = useState<string>("");

  // ✅ AI Assistant initialization **runs only once**
  useEffect(() => {
    console.log("Initializing AI Assistant...");

    const initialize = async () => {
      localStorage.setItem("userId", userId); // Store once, avoid unnecessary updates
      const thread = initializeAIAssistant(userId); // Pass the userId parameter
      setAiThread(thread.threadId);
    };

    initialize();
  }, []); // Empty dependency array → Runs only once

  // ✅ Store user profile only when `user` actually changes
  useEffect(() => {
    console.log("Saving user profile...");
    storageService.saveUserProfile(user);
  }, [user]); // Runs only when `user` updates

  // ✅ Prevent unnecessary re-renders by avoiding state toggles
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(false);
  }, []); // Only runs once, avoids unnecessary state updates

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading FocusFlow...
      </div>
    );
  }

  return <LifeFlowApp threadId={aiThread} user={user} />;
}

export default App;
