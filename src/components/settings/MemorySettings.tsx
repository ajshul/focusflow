import React, { useState, useEffect } from "react";
import { ArrowLeft, Edit, Trash2, Save, X, RefreshCw } from "lucide-react";
import { Message, UserProfile } from "../../models/types";
import { memoryService } from "../../services/ai/memoryService";

interface MemorySettingsProps {
  user: UserProfile;
  threadId: string;
  onBackToApp: () => void;
}

// Define the Thread type to match what memoryService returns
interface Thread {
  id: string;
  type: string;
  title: string;
}

const MemorySettings: React.FC<MemorySettingsProps> = ({
  user,
  threadId,
  onBackToApp,
}) => {
  const [messages, setMessages] = useState<(Message & { id?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState(threadId);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load messages for the current thread
  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const loadedMessages = await memoryService.getMessages(currentThreadId);
        setMessages(loadedMessages);
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [currentThreadId, refreshTrigger]);

  // Load available threads
  useEffect(() => {
    const loadThreads = async () => {
      try {
        const threads = await memoryService.getThreads(user.id);
        setThreads(threads);
      } catch (error) {
        console.error("Error loading threads:", error);
      }
    };

    loadThreads();
  }, [user.id, refreshTrigger]);

  // Start editing a message
  const handleEditStart = (message: Message & { id?: string }) => {
    if (message.id) {
      setEditingMessageId(message.id);
      setEditContent(message.content);
    }
  };

  // Cancel editing
  const handleEditCancel = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  // Save edited message
  const handleEditSave = async (messageId: string) => {
    try {
      await memoryService.updateMessage(
        currentThreadId,
        messageId,
        editContent
      );
      // Refresh the messages list
      setRefreshTrigger((prev) => prev + 1);
      setEditingMessageId(null);
      setEditContent("");
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  // Delete a message
  const handleDelete = async (messageId: string) => {
    if (window.confirm("Are you sure you want to delete this memory?")) {
      try {
        await memoryService.deleteMessage(currentThreadId, messageId);
        // Refresh the messages list
        setRefreshTrigger((prev) => prev + 1);
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    }
  };

  // Clear all messages in a thread
  const handleClearThread = async () => {
    if (
      window.confirm(
        "Are you sure you want to clear all memories from this thread? This cannot be undone."
      )
    ) {
      try {
        await memoryService.clearThread(currentThreadId);
        // Refresh the messages list
        setRefreshTrigger((prev) => prev + 1);
      } catch (error) {
        console.error("Error clearing thread:", error);
      }
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "";

    try {
      // Convert Firestore Timestamp to JS Date if needed
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "";
    }
  };

  // Handle thread change
  const handleThreadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentThreadId(e.target.value);
  };

  // Add a function to get a human-readable thread name
  const getThreadDisplayName = (threadId: string) => {
    if (threadId.includes('_task_')) {
      const taskId = threadId.split('_task_')[1];
      // You could look up the task title here for a more descriptive name
      return `Task ${taskId}`;
    } else if (threadId.includes('_coach')) {
      return 'Life Coach';
    }
    return threadId;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-700 text-white p-4">
        <div className="flex items-center">
          <button
            type="button"
            className="mr-3 bg-indigo-600 rounded-full p-1 hover:bg-indigo-500 transition-colors"
            onClick={onBackToApp}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-medium">Memory Settings</h1>
            <p className="text-indigo-200 text-sm">
              Manage AI memories and conversation history
            </p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex-grow overflow-auto">
        {/* Thread Selection */}
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-medium text-gray-700">Conversation Threads</h2>
            <button
              className="text-indigo-600 hover:text-indigo-800 flex items-center"
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
            >
              <RefreshCw size={16} className="mr-1" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="flex items-center mb-4">
            <select
              className="w-full p-2 border rounded mb-4"
              value={currentThreadId}
              onChange={handleThreadChange}
            >
              {threads.map(thread => (
                <option key={thread.id} value={thread.id}>
                  {thread.title || getThreadDisplayName(thread.id)}
                </option>
              ))}
            </select>
            <button
              className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              onClick={handleClearThread}
            >
              Clear Thread
            </button>
          </div>
        </div>

        {/* Memories List */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-medium text-gray-700 mb-4">
            Conversation Memories
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading memories...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No memories found in this thread.
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`p-4 rounded-lg ${
                    message.sender === "user"
                      ? "bg-indigo-50 border-indigo-200 border"
                      : "bg-green-50 border-green-200 border"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-medium">
                      {message.sender === "user" ? "User" : "AI Assistant"}
                      {message.timestamp && (
                        <span className="ml-2 text-xs text-gray-500">
                          {formatTimestamp(message.timestamp)}
                        </span>
                      )}
                    </div>

                    <div className="flex space-x-1">
                      {message.id && editingMessageId !== message.id && (
                        <>
                          <button
                            className="p-1 text-gray-500 hover:text-indigo-600 transition-colors"
                            onClick={() => handleEditStart(message)}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                            onClick={() =>
                              message.id && handleDelete(message.id)
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {editingMessageId === message.id ? (
                    <div>
                      <textarea
                        className="w-full border rounded-md p-2 mb-2"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={5}
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          className="flex items-center px-3 py-1 text-gray-600 hover:text-gray-800"
                          onClick={handleEditCancel}
                        >
                          <X size={16} className="mr-1" />
                          Cancel
                        </button>
                        <button
                          className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                          onClick={() =>
                            message.id && handleEditSave(message.id)
                          }
                        >
                          <Save size={16} className="mr-1" />
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="whitespace-pre-line">{message.content}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemorySettings;
