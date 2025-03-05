# FocusFlow: AI-Powered ADHD Task Management

FocusFlow is a revolutionary task management application specifically designed for individuals with ADHD. It employs advanced AI with a comprehensive personal memory system to understand the user holistically and provide personalized support.

## 🌟 Key Features

- **AI-Powered Task Breakdown**: Automatically breaks complex tasks into manageable steps.
- **Smart Memory System**: 
  - **Global Memory** for Life Coach conversations.
  - **Task-Specific Memory** for individual task contexts.
  - **Cross-Context Awareness** between tasks and Life Coach.
- **Intelligent Life Coach**: AI-powered coach for broader life management advice.
- **Email Drafting**: Generates emails matching your communication style.
- **Smart Task Prioritization**: Context-aware task organization.
- **Offline Support**: Graceful degradation to local storage when offline.

## 🛠 Tech Stack

- **React 19.0.0**
- **TypeScript 4.9.5**
- **Firebase** (with local storage fallback)
- **LangChain** for AI memory management
- **OpenAI GPT-4**
- **TailwindCSS**

## 📋 Prerequisites

- **Node.js** (>= 14.x)
- **npm** or **yarn**
- **OpenAI API key**
- **Firebase project** (optional, required for cloud syncing)

## 🚀 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ajshulman/focusflow.git
   cd focusflow
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file in the root directory with:**
   ```ini
   REACT_APP_OPENAI_API_KEY=your_openai_api_key

   # Firebase Configuration (Optional)
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

---

## 🏗 Architecture

### 🧠 Memory Management System

The application uses a sophisticated **three-tier memory system**:

1. **Global Memory**
   - Maintains context across the entire application.
   - Stores **Life Coach** conversations and overall user patterns.
   - Implemented using Firebase with local storage fallback.
   - Reference: `enhancedMemoryService.ts`.

2. **Task-Specific Memory**
   - Dedicated memory for each task's context and AI interactions.
   - Maintains task breakdown, progress, and related conversations.
   - Cross-references **Global Memory** for relevant insights.
   - Uses **thread-based organization with unique IDs**.

3. **Cross-Context Awareness**
   - AI maintains awareness between **tasks and Life Coach**.
   - Summarizes and shares relevant information across contexts.
   - Uses **enhanced prompts** that include broader conversation history.
   - Implements **caching** for performance optimization.

### 🔧 Core Components

1. **Task Management**
   - `TaskList`: Main task overview and organization.
   - `TaskDetail`: Individual task view with AI assistance.
   - `TaskBreakdown`: AI-generated step-by-step guidance.
   - **Smart prioritization** based on user patterns.

2. **Life Coach Interface**
   - AI-powered **coach with full context awareness**.
   - Personalized advice based on user profile.
   - **Task-aware guidance** and prioritization help.
   - Maintains **conversation history** for continuity.

3. **Memory Settings**
   - **User interface for managing conversation history**.
   - **Thread-based organization of memories**.
   - Ability to **edit or clear specific memories**.
   - Controls for **memory persistence preferences**.

### 📌 State Management

1. **Context Providers**
   - `TaskContext`: Manages task state and operations.
   - `AppStateContext`: Handles UI state and modals.
   - `UserContext`: Maintains user preferences and profile.

2. **Storage Layer**
   - **Firebase integration** for cloud storage.
   - **Local storage fallback** for offline functionality.
   - **Memory caching** for performance optimization.
   - **Automatic synchronization** when online.

---

## 🤝 Contributing

1. **Fork the repository**.
2. **Create your feature branch** (`git checkout -b feature/AmazingFeature`).
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`).
4. **Push to the branch** (`git push origin feature/AmazingFeature`).
5. **Open a Pull Request**.

---

## 📄 License

This project is licensed under the **MIT License** - see the `LICENSE` file for details.

---

## 🙏 Acknowledgments

- **OpenAI** for GPT-4 API.
- **LangChain** for AI memory management.
- **Firebase** for cloud storage capabilities.
- **React team** for the framework.