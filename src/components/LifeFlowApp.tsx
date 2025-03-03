import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronRight,
  Mail,
  Calendar,
  Brain,
  Clock,
  ArrowLeft,
  PlusCircle,
  Send,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { Task, UserProfile, Message } from "../models/types";
import { sendMessage, breakdownTask } from "../services/ai/memory";
import { draftEmail } from "../services/ai/emailDrafter";
import ReactMarkdown from "react-markdown";
import { storageService } from "../services/storage/browserStorage";

// Sample tasks data
const initialTasks: Task[] = [
  {
    id: 1,
    title: "Email marketing team about Q2 strategy",
    dueTime: "11:00 AM",
    priority: "high",
    category: "work",
    estimatedTime: "20 min",
    breakdown: [
      "Review Q1 results",
      "Outline key Q2 objectives",
      "Draft email in professional tone",
    ],
    context: "Follow-up to yesterday's marketing meeting",
    suggestions: [
      "Include data from the recent customer survey",
      "Mention the new product launch timeline",
      "Ask about billboard design progress",
    ],
  },
  {
    id: 2,
    title: "Schedule doctor appointment",
    dueTime: "2:00 PM",
    priority: "medium",
    category: "health",
    estimatedTime: "10 min",
    breakdown: [
      "Find doctor's phone number",
      "Check calendar for available slots",
      "Make the call",
    ],
  },
  {
    id: 3,
    title: "Complete project proposal draft",
    dueTime: "4:30 PM",
    priority: "high",
    category: "work",
    estimatedTime: "1.5 hrs",
  },
  {
    id: 4,
    title: "Order anniversary gift",
    dueTime: "Today",
    priority: "medium",
    category: "personal",
    estimatedTime: "15 min",
  },
];

interface LifeFlowAppProps {
  threadId: string;
  user: UserProfile;
}

const LifeFlowApp: React.FC<LifeFlowAppProps> = ({ threadId, user }) => {
  // State Management
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCoach, setShowCoach] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [coachInitialized, setCoachInitialized] = useState(false);

  // Modal States
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // Email States
  const [emailDraft, setEmailDraft] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState("");
  const [emailSubject, setEmailSubject] = useState("");

  // Task Management States
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<
    "work" | "personal" | "health"
  >("work");
  const [newTaskPriority, setNewTaskPriority] = useState<
    "low" | "medium" | "high"
  >("medium");
  const [newTaskDueTime, setNewTaskDueTime] = useState("");
  const [newTaskEstimatedTime, setNewTaskEstimatedTime] = useState("");
  const [taskFilter, setTaskFilter] = useState<
    "all" | "work" | "personal" | "health"
  >("all");
  const [taskSort, setTaskSort] = useState<"priority" | "dueTime">("priority");

  // UI States
  const [focusMode, setFocusMode] = useState(false);

  // Pomodoro Timer States
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<"work" | "break">("work");

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const taskListRef = useRef<HTMLDivElement>(null);

  // Initialize Life Coach messages
  useEffect(() => {
    if (showCoach && !coachInitialized) {
      setMessages([
        {
          sender: "ai",
          content: `Hello ${user.name}! I'm your ADHD life coach. How can I support you today?`,
        },
      ]);
      setCoachInitialized(true);
    }
  }, [showCoach, coachInitialized, user.name]);

  // Keep focus on the input when typing
  useEffect(() => {
    const handleWindowClick = () => {
      if (document.activeElement !== inputRef.current) {
        inputRef.current?.focus();
      }
    };

    if (selectedTask || showCoach) {
      document.addEventListener("click", handleWindowClick);
    }

    return () => {
      document.removeEventListener("click", handleWindowClick);
    };
  }, [selectedTask, showCoach]);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Pomodoro Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (pomodoroActive) {
      interval = setInterval(() => {
        if (pomodoroSeconds === 0) {
          if (pomodoroMinutes === 0) {
            // Timer complete
            setPomodoroActive(false);
            if (pomodoroMode === "work") {
              // Switch to break
              setPomodoroMode("break");
              setPomodoroMinutes(5);
              setMessages((prev) => [
                ...prev,
                {
                  sender: "ai",
                  content:
                    "⏰ Time for a break! Step away from your task for 5 minutes.",
                },
              ]);
            } else {
              // Switch to work
              setPomodoroMode("work");
              setPomodoroMinutes(25);
              setMessages((prev) => [
                ...prev,
                {
                  sender: "ai",
                  content: "⏰ Break is over! Time to get back to your task.",
                },
              ]);
            }
          } else {
            setPomodoroMinutes(pomodoroMinutes - 1);
            setPomodoroSeconds(59);
          }
        } else {
          setPomodoroSeconds(pomodoroSeconds - 1);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pomodoroActive, pomodoroMinutes, pomodoroSeconds, pomodoroMode]);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    storageService.saveTasks(user.id, tasks);
  }, [tasks, user.id]);

  // Get current time context
  const getCurrentContext = () => {
    const hour = new Date().getHours();
    let timeOfDay = "morning";
    if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
    if (hour >= 17) timeOfDay = "evening";

    return {
      currentTask: selectedTask?.title,
      timeOfDay,
      energyLevel: "medium",
    };
  };

  // Task Filtering and Sorting
  const getFilteredAndSortedTasks = () => {
    let filteredTasks = [...tasks];

    // Filter by category
    if (taskFilter !== "all") {
      filteredTasks = filteredTasks.filter(
        (task) => task.category === taskFilter
      );
    }

    // Filter out completed tasks
    filteredTasks = filteredTasks.filter((task) => !task.completed);

    // Sort tasks
    if (taskSort === "priority") {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      filteredTasks.sort(
        (a, b) =>
          (priorityWeight[b.priority as keyof typeof priorityWeight] || 0) -
          (priorityWeight[a.priority as keyof typeof priorityWeight] || 0)
      );
    } else {
      // Simple due time sorting
      filteredTasks.sort((a, b) => a.dueTime.localeCompare(b.dueTime));
    }

    return filteredTasks;
  };

  // Email Generation
  const generateEmail = async () => {
    if (!selectedTask) return;

    setEmailLoading(true);
    const defaultSubject = selectedTask.title;
    setEmailSubject(defaultSubject);

    try {
      // Generate email using AI
      const response = await sendMessage(
        `Please draft a professional email about: "${selectedTask.title}". 
        Context: ${selectedTask.context || "No additional context provided"}
        Please include a subject line and keep it concise and professional.`,
        user,
        getCurrentContext(),
        threadId
      );

      // Extract the content and format it
      const emailContent = response.content;
      setEmailDraft(emailContent);

      // Try to extract subject line if present
      const subjectMatch = emailContent.match(/Subject: (.+)$/m);
      if (subjectMatch && subjectMatch[1]) {
        setEmailSubject(subjectMatch[1].trim());
      }
    } catch (error) {
      console.error("Email generation error:", error);
      setEmailDraft("Error generating email draft. Please try again.");
    }

    setEmailLoading(false);
  };

  // Task Breakdown Generation
  const generateTaskBreakdown = async (task: Task) => {
    if (!task.breakdown) {
      setIsGenerating(true);
      try {
        const steps = await breakdownTask(task.title, user);

        // Update the task with the breakdown
        const updatedTasks = tasks.map((t) =>
          t.id === task.id ? { ...t, breakdown: steps } : t
        );
        setTasks(updatedTasks);

        // If this is the selected task, update it too
        if (selectedTask && selectedTask.id === task.id) {
          setSelectedTask({ ...task, breakdown: steps });
        }
      } catch (error) {
        console.error("Failed to generate breakdown:", error);
      }
      setIsGenerating(false);
    }
  };

  // Handle Email Creation
  const handleCreateEmail = async () => {
    if (!selectedTask) return;

    setEmailLoading(true);
    setShowEmailModal(true);

    try {
      const emailText = await draftEmail(
        selectedTask.title,
        selectedTask.context || "",
        "Marketing Team",
        user
      );

      setEmailDraft(emailText);
    } catch (error) {
      console.error("Email drafting error:", error);
      setEmailDraft("Error generating email draft. Please try again.");
    }

    setEmailLoading(false);
  };

  // Handle Chat Message Sending
  const handleSendMessage = async (messageText = chatInput.trim()) => {
    if (messageText) {
      // Add user message to the chat
      const userMessage: Message = { sender: "user", content: messageText };
      setMessages((prev) => [...prev, userMessage]);
      setChatInput("");
      setIsGenerating(true);

      try {
        // Get current context
        const context = getCurrentContext();

        // Send message to AI
        const response = await sendMessage(
          messageText,
          user,
          context,
          threadId
        );

        // Add AI response to chat
        setMessages((prev) => [...prev, response]);
      } catch (error) {
        console.error("AI communication error:", error);
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            content: "Sorry, I encountered an error. Please try again.",
          },
        ]);
      }

      setIsGenerating(false);

      // Focus input after sending message
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  // Task Selection
  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);

    // Generate AI welcome message specific to this task
    setMessages([
      {
        sender: "ai",
        content: `I see you're working on "${task.title}". How can I help you with this task?`,
      },
    ]);

    // Generate breakdown if not available
    if (!task.breakdown) {
      generateTaskBreakdown(task);
    }
  };

  // Navigation
  const handleBackToTasks = () => {
    setSelectedTask(null);
    setShowCoach(false);
    setCoachInitialized(false);

    // Reset messages when returning to tasks
    setMessages([]);

    // Scroll back to top of task list
    setTimeout(() => {
      if (taskListRef.current) {
        taskListRef.current.scrollTop = 0;
      }
    }, 100);
  };

  // New Task Creation
  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      const newTask: Task = {
        id: Date.now(), // Simple unique ID
        title: newTaskTitle,
        dueTime: newTaskDueTime || "Today",
        priority: newTaskPriority,
        category: newTaskCategory,
        estimatedTime: newTaskEstimatedTime || "15 min",
      };

      setTasks([...tasks, newTask]);

      // Reset form
      setNewTaskTitle("");
      setNewTaskCategory("work");
      setNewTaskPriority("medium");
      setNewTaskDueTime("");
      setNewTaskEstimatedTime("");
      setShowAddTaskModal(false);

      // Generate task breakdown automatically
      generateTaskBreakdown(newTask);
    }
  };

  // Task Step Completion
  const toggleStepCompletion = (taskId: number | string, stepIndex: number) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === taskId) {
          const progress =
            task.breakdownProgress ||
            Array(task.breakdown?.length || 0).fill(false);
          progress[stepIndex] = !progress[stepIndex];

          // If all steps are complete, mark the whole task as complete
          if (progress.every((step) => step)) {
            return {
              ...task,
              breakdownProgress: progress,
              completed: true,
              completedAt: new Date(),
            };
          }

          return { ...task, breakdownProgress: progress };
        }
        return task;
      })
    );

    // Update selected task if needed
    if (selectedTask && selectedTask.id === taskId) {
      const progress =
        selectedTask.breakdownProgress ||
        Array(selectedTask.breakdown?.length || 0).fill(false);
      progress[stepIndex] = !progress[stepIndex];

      if (progress.every((step) => step)) {
        setSelectedTask({
          ...selectedTask,
          breakdownProgress: progress,
          completed: true,
          completedAt: new Date(),
        });
      } else {
        setSelectedTask({ ...selectedTask, breakdownProgress: progress });
      }
    }
  };

  // Task Completion
  const completeTask = (taskId: number | string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? { ...task, completed: true, completedAt: new Date() }
          : task
      )
    );

    // If this is the currently selected task, update that too
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({
        ...selectedTask,
        completed: true,
        completedAt: new Date(),
      });
    }

    // Notify the user with a celebratory message
    setMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        content:
          "🎉 Great job completing this task! What would you like to focus on next?",
      },
    ]);
  };

  // Handle preset message selection
  const handlePresetMessage = (message: string) => {
    setChatInput(message);
    // Auto-focus the input after setting the preset message
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Email Modal Component
  const EmailModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-auto">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Email Draft</h2>
            <button onClick={() => setShowEmailModal(false)}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-4">
          {emailLoading ? (
            <div className="text-center py-8">
              <p>
                Drafting your email based on task context and your writing
                style...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To:
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-md p-2"
                    value={emailRecipients}
                    onChange={(e) => setEmailRecipients(e.target.value)}
                    placeholder="recipient@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject:
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-md p-2"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message:
                </label>
                <div className="prose prose-sm max-w-none border p-4 rounded-md bg-gray-50 min-h-[200px]">
                  <ReactMarkdown>{emailDraft}</ReactMarkdown>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button
            className="px-4 py-2 border rounded-md"
            onClick={() => setShowEmailModal(false)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-md"
            onClick={() => {
              navigator.clipboard.writeText(
                `To: ${emailRecipients}\nSubject: ${emailSubject}\n\n${emailDraft}`
              );
              alert("Email content copied to clipboard!");
            }}
          >
            Copy to Clipboard
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-md"
            onClick={() => {
              window.open(
                `mailto:${emailRecipients}?subject=${encodeURIComponent(
                  emailSubject
                )}&body=${encodeURIComponent(emailDraft)}`
              );
            }}
          >
            Open in Mail App
          </button>
        </div>
      </div>
    </div>
  );

  // Add Task Modal Component
  const AddTaskModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-medium">Add New Task</h2>
          <button onClick={() => setShowAddTaskModal(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title
            </label>
            <input
              type="text"
              className="w-full border rounded-md p-2"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="What do you need to do?"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                className="w-full border rounded-md p-2"
                value={newTaskCategory}
                onChange={(e) =>
                  setNewTaskCategory(
                    e.target.value as "work" | "personal" | "health"
                  )
                }
              >
                <option value="work">💼 Work</option>
                <option value="personal">👤 Personal</option>
                <option value="health">🏥 Health</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                className="w-full border rounded-md p-2"
                value={newTaskPriority}
                onChange={(e) =>
                  setNewTaskPriority(
                    e.target.value as "low" | "medium" | "high"
                  )
                }
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Time
              </label>
              <input
                type="text"
                className="w-full border rounded-md p-2"
                value={newTaskDueTime}
                onChange={(e) => setNewTaskDueTime(e.target.value)}
                placeholder="Today, 3:00 PM, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Est. Time
              </label>
              <input
                type="text"
                className="w-full border rounded-md p-2"
                value={newTaskEstimatedTime}
                onChange={(e) => setNewTaskEstimatedTime(e.target.value)}
                placeholder="15 min, 1 hr, etc."
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end space-x-2">
          <button
            className="px-4 py-2 border rounded-md"
            onClick={() => setShowAddTaskModal(false)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-md"
            onClick={handleAddTask}
          >
            Add Task
          </button>
        </div>
      </div>
    </div>
  );

  // Main Task List View
  const TaskListView = () => (
    <div className="flex flex-col h-full">
      <div className="bg-indigo-600 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Today's Focus</h1>
          <div className="flex items-center">
            <button className="p-2 bg-indigo-500 rounded-full mr-2">
              <Calendar size={20} />
            </button>
            <button
              className="p-2 bg-indigo-500 rounded-full"
              onClick={() => setShowCoach(true)}
            >
              <Brain size={20} />
            </button>
          </div>
        </div>
        <p className="text-indigo-200 mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}{" "}
          • {tasks.length} tasks
        </p>
      </div>

      {/* Progress Dashboard */}
      <div className="p-4 bg-white border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">
            Today's Progress
          </h3>
          <span className="text-xs text-gray-500">
            {tasks.filter((t) => t.completed).length}/{tasks.length} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
            style={{
              width: `${
                tasks.length > 0
                  ? (tasks.filter((t) => t.completed).length / tasks.length) *
                    100
                  : 0
              }%`,
            }}
          ></div>
        </div>

        {/* Priority breakdown */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="font-medium">High Priority</div>
            <div className="text-red-600">
              {
                tasks.filter((t) => t.priority === "high" && !t.completed)
                  .length
              }{" "}
              remaining
            </div>
          </div>
          <div>
            <div className="font-medium">Medium Priority</div>
            <div className="text-yellow-600">
              {
                tasks.filter((t) => t.priority === "medium" && !t.completed)
                  .length
              }{" "}
              remaining
            </div>
          </div>
          <div>
            <div className="font-medium">Low Priority</div>
            <div className="text-green-600">
              {tasks.filter((t) => t.priority === "low" && !t.completed).length}{" "}
              remaining
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="px-4 py-2 bg-indigo-50 flex items-center justify-between">
        <div className="space-x-1">
          <button
            className={`px-2 py-1 text-xs rounded-md ${
              taskFilter === "all" ? "bg-indigo-600 text-white" : "bg-white"
            }`}
            onClick={() => setTaskFilter("all")}
          >
            All
          </button>
          <button
            className={`px-2 py-1 text-xs rounded-md ${
              taskFilter === "work" ? "bg-indigo-600 text-white" : "bg-white"
            }`}
            onClick={() => setTaskFilter("work")}
          >
            💼 Work
          </button>
          <button
            className={`px-2 py-1 text-xs rounded-md ${
              taskFilter === "personal"
                ? "bg-indigo-600 text-white"
                : "bg-white"
            }`}
            onClick={() => setTaskFilter("personal")}
          >
            👤 Personal
          </button>
          <button
            className={`px-2 py-1 text-xs rounded-md ${
              taskFilter === "health" ? "bg-indigo-600 text-white" : "bg-white"
            }`}
            onClick={() => setTaskFilter("health")}
          >
            🏥 Health
          </button>
        </div>

        <select
          className="text-xs border rounded-md p-1"
          value={taskSort}
          onChange={(e) =>
            setTaskSort(e.target.value as "priority" | "dueTime")
          }
        >
          <option value="priority">Sort: Priority</option>
          <option value="dueTime">Sort: Due Time</option>
        </select>
      </div>

      {/* Task List */}
      <div ref={taskListRef} className="p-4 bg-gray-50 flex-grow overflow-auto">
        {getFilteredAndSortedTasks().length > 0 ? (
          getFilteredAndSortedTasks().map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-lg shadow mb-3 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleSelectTask(task)}
            >
              <div className="p-4">
                <div className="flex justify-between">
                  <h3 className="font-medium">{task.title}</h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      task.priority === "high"
                        ? "bg-red-100 text-red-800"
                        : task.priority === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>

                <div className="flex mt-2 text-sm text-gray-500">
                  <div className="flex items-center mr-4">
                    <Clock size={14} className="mr-1" />
                    <span>{task.dueTime}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock size={14} className="mr-1" />
                    <span>{task.estimatedTime}</span>
                  </div>
                </div>
              </div>

              <div className="px-4 py-2 bg-gray-50 flex justify-between items-center border-t">
                <span className="text-xs text-gray-500">
                  {task.category === "work"
                    ? "💼 Work"
                    : task.category === "health"
                    ? "🏥 Health"
                    : "👤 Personal"}
                </span>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p className="mb-4">No tasks match your current filters</p>
            <button
              className="bg-indigo-600 text-white px-4 py-2 rounded-md"
              onClick={() => setShowAddTaskModal(true)}
            >
              Add a Task
            </button>
          </div>
        )}
      </div>

      {/* Add Task Button */}
      <div className="bg-white border-t border-gray-200 p-3 flex justify-center">
        <button
          className="bg-indigo-600 text-white rounded-full p-3 shadow-lg hover:bg-indigo-700 transition-colors"
          onClick={() => setShowAddTaskModal(true)}
        >
          <PlusCircle size={24} />
        </button>
      </div>
    </div>
  );

  // Task Detail View
  const TaskDetailView = () => {
    if (!selectedTask) return null;

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-indigo-600 text-white p-4">
          <div className="flex items-center">
            <button
              className="mr-3 bg-indigo-500 rounded-full p-1 hover:bg-indigo-400 transition-colors"
              onClick={handleBackToTasks}
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-medium">{selectedTask.title}</h1>
              <p className="text-indigo-200 text-sm">
                Due {selectedTask.dueTime}
              </p>
            </div>
            <button
              className={`p-2 rounded-full ${
                focusMode ? "bg-yellow-400" : "bg-indigo-500"
              } hover:opacity-90 transition-opacity`}
              onClick={() => setFocusMode(!focusMode)}
              title={focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
            >
              {focusMode ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div
          className={`flex-grow overflow-auto ${
            focusMode ? "bg-gray-100" : ""
          }`}
        >
          {/* Pomodoro Timer Section */}
          <div
            className={`p-4 ${
              focusMode
                ? "bg-white rounded-lg shadow-lg mx-4 mt-4 border"
                : "border-b"
            }`}
          >
            <div className="bg-white shadow rounded-lg p-3 mb-2">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                {pomodoroMode === "work" ? "🧠 Focus Timer" : "☕ Break Timer"}
              </h3>
              <div className="text-3xl font-bold text-center my-2 font-mono">
                {String(pomodoroMinutes).padStart(2, "0")}:
                {String(pomodoroSeconds).padStart(2, "0")}
              </div>
              <div className="flex justify-center space-x-2 mt-2">
                {!pomodoroActive ? (
                  <button
                    className="bg-green-500 text-white px-4 py-1 rounded-md text-sm hover:bg-green-600 transition-colors"
                    onClick={() => setPomodoroActive(true)}
                  >
                    Start
                  </button>
                ) : (
                  <button
                    className="bg-red-500 text-white px-4 py-1 rounded-md text-sm hover:bg-red-600 transition-colors"
                    onClick={() => setPomodoroActive(false)}
                  >
                    Pause
                  </button>
                )}
                <button
                  className="bg-gray-200 px-4 py-1 rounded-md text-sm hover:bg-gray-300 transition-colors"
                  onClick={() => {
                    setPomodoroActive(false);
                    if (pomodoroMode === "work") {
                      setPomodoroMinutes(25);
                    } else {
                      setPomodoroMinutes(5);
                    }
                    setPomodoroSeconds(0);
                  }}
                >
                  Reset
                </button>
                <button
                  className="bg-indigo-100 px-4 py-1 rounded-md text-sm hover:bg-indigo-200 transition-colors"
                  onClick={() => {
                    setPomodoroActive(false);
                    setPomodoroMode(pomodoroMode === "work" ? "break" : "work");
                    setPomodoroMinutes(pomodoroMode === "work" ? 5 : 25);
                    setPomodoroSeconds(0);
                  }}
                >
                  {pomodoroMode === "work"
                    ? "Switch to Break"
                    : "Switch to Focus"}
                </button>
              </div>
            </div>
          </div>

          {/* Task Breakdown Section */}
          <div
            className={`p-4 ${
              focusMode
                ? "bg-white rounded-lg shadow-lg mx-4 my-4 border"
                : "border-b"
            }`}
          >
            <div className="flex justify-between mb-4">
              <h2 className="font-medium text-indigo-700">Task Breakdown</h2>
              <button
                className="text-indigo-600 text-sm hover:text-indigo-800 transition-colors"
                onClick={() => generateTaskBreakdown(selectedTask)}
              >
                Regenerate
              </button>
            </div>

            {isGenerating && !selectedTask.breakdown ? (
              <div className="bg-gray-50 p-4 rounded-md text-center">
                <p className="text-gray-500">Generating task breakdown...</p>
              </div>
            ) : selectedTask.breakdown ? (
              <div className="space-y-2">
                {selectedTask.breakdown.map((step, index) => {
                  const isCompleted =
                    selectedTask.breakdownProgress?.[index] || false;
                  return (
                    <div
                      key={index}
                      className={`flex items-center bg-gray-50 p-3 rounded-md ${
                        isCompleted ? "opacity-70" : ""
                      } hover:bg-gray-100 transition-colors`}
                    >
                      <button
                        onClick={() =>
                          toggleStepCompletion(selectedTask.id, index)
                        }
                        className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                          isCompleted
                            ? "bg-green-100 text-green-700 border border-green-300"
                            : "bg-indigo-100 text-indigo-700"
                        } hover:opacity-80 transition-opacity`}
                      >
                        {isCompleted ? <Check size={14} /> : index + 1}
                      </button>
                      <span
                        className={
                          isCompleted ? "line-through text-gray-500" : ""
                        }
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-md text-center">
                <p className="text-gray-500">
                  Ask me to break down this task for you
                </p>
              </div>
            )}
          </div>

          {/* Context section - only show if not in focus mode */}
          {!focusMode && selectedTask.context && (
            <div className="p-4 border-b">
              <h2 className="font-medium text-indigo-700 mb-3">Context</h2>
              <div className="bg-gray-50 p-3 rounded-md">
                <p>{selectedTask.context}</p>
              </div>
            </div>
          )}

          {/* Suggestions section - only show if not in focus mode */}
          {!focusMode && selectedTask.suggestions && (
            <div className="p-4 border-b">
              <h2 className="font-medium text-indigo-700 mb-3">Suggestions</h2>
              <div className="space-y-2">
                {selectedTask.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="bg-indigo-50 p-3 rounded-md text-indigo-700"
                  >
                    <p>{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI conversation section */}
          <div
            className={`p-4 ${
              focusMode ? "bg-white rounded-lg shadow-lg mx-4 my-4 border" : ""
            }`}
          >
            <h2 className="font-medium text-indigo-700 mb-3">Task Assistant</h2>

            <div
              ref={chatContainerRef}
              className="bg-gray-50 rounded-lg p-3 mb-3 max-h-80 overflow-y-auto"
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-3 ${
                    message.sender === "user" ? "text-right" : ""
                  }`}
                >
                  <div
                    className={`inline-block p-3 rounded-lg max-w-xs sm:max-w-sm ${
                      message.sender === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-white border text-gray-800"
                    }`}
                  >
                    {message.sender === "user" ? (
                      <p className="whitespace-pre-line">{message.content}</p>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isGenerating && (
                <div className="mb-3">
                  <div className="inline-block p-3 rounded-lg bg-white border text-gray-800">
                    <p>Thinking...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick suggestions */}
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md text-xs hover:bg-indigo-100 transition-colors"
                onClick={() =>
                  handleSendMessage("How should I approach this task?")
                }
              >
                How to approach this?
              </button>
              <button
                className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md text-xs hover:bg-indigo-100 transition-colors"
                onClick={() =>
                  handleSendMessage(
                    "What's the first small step I should take?"
                  )
                }
              >
                What's the first step?
              </button>
              <button
                className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md text-xs hover:bg-indigo-100 transition-colors"
                onClick={() =>
                  handleSendMessage("I'm feeling stuck. Help me get started.")
                }
              >
                I'm feeling stuck
              </button>
            </div>

            <div className="flex">
              <input
                ref={inputRef}
                type="text"
                className="flex-grow border rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ask about this task..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button
                className="bg-indigo-600 text-white p-2 rounded-r-lg hover:bg-indigo-700 transition-colors"
                onClick={() => handleSendMessage()}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white border-t border-gray-200 p-3 flex justify-around">
          <button
            className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
            onClick={handleCreateEmail}
          >
            <Mail size={20} className="mr-1" />
            <span>Create Email</span>
          </button>
          <button
            className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
            onClick={() => {
              setShowCoach(true);
              const taskName = selectedTask.title;
              handleSendMessage(`I need help with my task: "${taskName}"`);
            }}
          >
            <Brain size={20} className="mr-1" />
            <span>Ask Coach</span>
          </button>
          <button
            className="flex items-center text-green-600 hover:text-green-800 transition-colors"
            onClick={() => completeTask(selectedTask.id)}
          >
            <Check size={20} className="mr-1" />
            <span>Complete</span>
          </button>
        </div>
      </div>
    );
  };

  // Life Coach View
  const LifeCoachView = () => {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-teal-600 text-white p-4">
          <div className="flex items-center">
            <button
              className="mr-3 bg-teal-500 rounded-full p-1 hover:bg-teal-400 transition-colors"
              onClick={handleBackToTasks}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-medium">Your Life Coach</h1>
              <p className="text-teal-200 text-sm">Available 24/7</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 flex-grow overflow-auto">
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <h2 className="font-medium text-teal-700 mb-2">Today's Overview</h2>
            <p className="text-gray-600">
              You have {tasks.length} tasks today with{" "}
              {tasks.filter((t) => t.priority === "high").length} high-priority
              items. Based on your past patterns, mornings are your most
              productive time, so I've prioritized complex tasks earlier in the
              day.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <h2 className="font-medium text-teal-700 mb-2">Recent Insights</h2>
            <div className="space-y-2">
              <div className="bg-teal-50 p-3 rounded-md text-teal-700">
                <p>
                  I've noticed you complete tasks more efficiently when they're
                  broken down into 3-5 steps.
                </p>
              </div>
              <div className="bg-teal-50 p-3 rounded-md text-teal-700">
                <p>
                  Email tasks tend to cause you stress. Consider setting a
                  specific time block for communications.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-medium text-teal-700 mb-3">Ask Your Coach</h2>

            <div
              ref={chatContainerRef}
              className="bg-gray-50 rounded-lg p-3 mb-3 max-h-60 overflow-y-auto"
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-3 ${
                    message.sender === "user" ? "text-right" : ""
                  }`}
                >
                  <div
                    className={`inline-block p-3 rounded-lg max-w-xs sm:max-w-sm ${
                      message.sender === "user"
                        ? "bg-teal-600 text-white"
                        : "bg-white border text-gray-800"
                    }`}
                  >
                    {message.sender === "user" ? (
                      <p className="whitespace-pre-line">{message.content}</p>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isGenerating && (
                <div className="mb-3">
                  <div className="inline-block p-3 rounded-lg bg-white border text-gray-800">
                    <p>Thinking...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 mb-3">
              <button
                className="w-full text-left bg-gray-50 hover:bg-gray-100 p-3 rounded-md transition-colors"
                onClick={() =>
                  handlePresetMessage(
                    "How can I better prioritize my workload?"
                  )
                }
              >
                How can I better prioritize my workload?
              </button>
              <button
                className="w-full text-left bg-gray-50 hover:bg-gray-100 p-3 rounded-md transition-colors"
                onClick={() =>
                  handlePresetMessage(
                    "I'm feeling overwhelmed. What should I focus on?"
                  )
                }
              >
                I'm feeling overwhelmed. What should I focus on?
              </button>
              <button
                className="w-full text-left bg-gray-50 hover:bg-gray-100 p-3 rounded-md transition-colors"
                onClick={() =>
                  handlePresetMessage("Help me prepare for tomorrow's meetings")
                }
              >
                Help me prepare for tomorrow's meetings
              </button>
            </div>

            <div className="flex">
              <input
                ref={inputRef}
                type="text"
                className="flex-grow border rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Ask me anything..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button
                className="bg-teal-600 text-white p-2 rounded-r-lg hover:bg-teal-700 transition-colors"
                onClick={() => handleSendMessage()}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render the appropriate view
  return (
    <div className="h-screen bg-gray-100">
      {showCoach ? (
        <LifeCoachView />
      ) : selectedTask ? (
        <TaskDetailView />
      ) : (
        <TaskListView />
      )}
      {showAddTaskModal && <AddTaskModal />}
      {showEmailModal && <EmailModal />}
    </div>
  );
};

export default LifeFlowApp;
