import React, { createContext, useState, useContext } from "react";

interface AppStateContextType {
  showCoach: boolean;
  setShowCoach: (show: boolean) => void;
  showEmailModal: boolean;
  setShowEmailModal: (show: boolean) => void;
  showAddTaskModal: boolean;
  setShowAddTaskModal: (show: boolean) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  focusMode: boolean;
  setFocusMode: (mode: boolean) => void;
  coachInitialized: boolean;
  setCoachInitialized: (initialized: boolean) => void;
  handleBackToTasks: () => void;
}

export const AppStateContext = createContext<AppStateContextType | undefined>(
  undefined
);

export const AppStateProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [showCoach, setShowCoach] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [coachInitialized, setCoachInitialized] = useState(false);

  // Handler for "Back to Tasks" functionality
  const handleBackToTasks = () => {
    // Use a callback to properly modify the TaskContext from outside
    // The real implementation will be in the main app component
  };

  const contextValue: AppStateContextType = {
    showCoach,
    setShowCoach,
    showEmailModal,
    setShowEmailModal,
    showAddTaskModal,
    setShowAddTaskModal,
    showSettings,
    setShowSettings,
    focusMode,
    setFocusMode,
    coachInitialized,
    setCoachInitialized,
    handleBackToTasks,
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppStateContext = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error(
      "useAppStateContext must be used within an AppStateProvider"
    );
  }
  return context;
};
