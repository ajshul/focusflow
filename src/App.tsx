import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { UserProfile } from "./models/types";
import LifeFlowApp from "./components/LifeFlowApp";
import { initializeAIAssistant } from "./services/ai/memory";
import { storageService } from "./services/storage/browserStorage";

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile>({
    id: localStorage.getItem("userId") || uuidv4(),
    name: "Alex",
    occupation: "Product Manager",
    workStyle: "Visual thinker who works in short bursts",
    communicationStyle: "Concise and friendly with specific examples",
    preferences: {
      taskBreakdownStyle: "Very small steps",
      motivationType: "Achievement oriented",
    },
  });
  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const [aiThread, setAiThread] = useState<string>("");

  // Initialize app
  useEffect(() => {
    const initialize = async () => {
      // Save user ID in local storage
      localStorage.setItem("userId", user.id);

      // Save user profile
      await storageService.saveUserProfile(user);

      // Initialize AI thread
      const thread = initializeAIAssistant();
      setAiThread(thread.threadId);

      setLoading(false);
    };

    initialize();
  }, []);

  useEffect(() => {
    storageService.saveUserProfile(user);
  }, [user]);
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
