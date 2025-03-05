import React from "react";
import { UserProfile, Task } from "../models/types";
import { TaskProvider, useTaskContext } from "../context/TaskContext";
import {
  AppStateProvider,
  useAppStateContext,
} from "../context/AppStateContext";
import TaskList from "./task/TaskList";
import TaskDetail from "./task/TaskDetail";
import LifeCoachView from "./coach/LifeCoachView";
import AddTaskModal from "./task/AddTaskModal";
import EmailModal from "./email/EmailModal";
import MemorySettings from "./settings/MemorySettings";
import { useEmailDraft } from "../hooks/useEmailDraft";
import { Settings } from "lucide-react";

interface LifeFlowAppProps {
  threadId: string;
  user: UserProfile;
}

// Main component wrapper with providers
const LifeFlowApp: React.FC<LifeFlowAppProps> = ({ threadId, user }) => {
  return (
    <AppStateProvider>
      <TaskProvider user={user}>
        <LifeFlowAppContent threadId={threadId} user={user} />
      </TaskProvider>
    </AppStateProvider>
  );
};

// Internal component that uses the context
const LifeFlowAppContent: React.FC<LifeFlowAppProps> = ({ threadId, user }) => {
  const { selectedTask, setSelectedTask } = useTaskContext();

  const {
    showCoach,
    setShowCoach,
    showEmailModal,
    setShowEmailModal,
    showAddTaskModal,
    showSettings,
    setShowSettings,
    coachInitialized,
    setCoachInitialized,
  } = useAppStateContext();

  // Email functionality
  const {
    emailDraft,
    isLoading: emailLoading,
    emailRecipients,
    emailSubject,
    setEmailRecipients,
    setEmailSubject,
    copyToClipboard,
    openInMailApp,
  } = useEmailDraft(user, threadId, () => setShowEmailModal(true));

  // Handler for opening coach view
  const handleOpenCoach = () => {
    setShowCoach(true);
    if (!coachInitialized) {
      setCoachInitialized(true);
    }
  };

  // Handler for going back to tasks list
  const handleBackToTasks = () => {
    setSelectedTask(null);
    setShowCoach(false);
    setCoachInitialized(false);
  };

  // Handler for selecting a task
  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
  };

  // Handler for opening settings
  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  // Handler for going back to app from settings
  const handleBackFromSettings = () => {
    setShowSettings(false);
  };

  // Render the appropriate view
  return (
    <div className="h-screen bg-gray-100">
      {showSettings ? (
        <MemorySettings
          user={user}
          threadId={threadId}
          onBackToApp={handleBackFromSettings}
        />
      ) : showCoach ? (
        <LifeCoachView
          user={user}
          threadId={threadId}
          onBackToTasks={handleBackToTasks}
        />
      ) : selectedTask ? (
        <TaskDetail
          task={selectedTask}
          user={user}
          threadId={threadId}
          onBackToTasks={handleBackToTasks}
          onOpenCoach={handleOpenCoach}
        />
      ) : (
        <TaskList
          user={user}
          onOpenCoach={handleOpenCoach}
          onSelectTask={handleSelectTask}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {/* Modals */}
      {showAddTaskModal && <AddTaskModal />}
      {showEmailModal && (
        <EmailModal
          emailDraft={emailDraft}
          isLoading={emailLoading}
          emailRecipients={emailRecipients}
          emailSubject={emailSubject}
          setEmailRecipients={setEmailRecipients}
          setEmailSubject={setEmailSubject}
          copyToClipboard={copyToClipboard}
          openInMailApp={openInMailApp}
        />
      )}
    </div>
  );
};

export default LifeFlowApp;
