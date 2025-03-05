import { useState, useCallback } from "react";
import { Task, UserProfile } from "../models/types";
import { draftEmail } from "../services/ai/emailDrafter";
import { sendMessage } from "../services/ai/memory";

interface UseEmailDraftReturn {
  emailDraft: string;
  isLoading: boolean;
  emailRecipients: string;
  emailSubject: string;
  setEmailRecipients: React.Dispatch<React.SetStateAction<string>>;
  setEmailSubject: React.Dispatch<React.SetStateAction<string>>;
  generateEmail: (task: Task) => Promise<void>;
  handleCreateEmail: (task: Task) => Promise<void>;
  copyToClipboard: () => void;
  openInMailApp: () => void;
}

export const useEmailDraft = (
  user: UserProfile,
  threadId: string,
  onModalOpen?: () => void
): UseEmailDraftReturn => {
  const [emailDraft, setEmailDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState("");
  const [emailSubject, setEmailSubject] = useState("");

  const generateEmail = useCallback(
    async (task: Task) => {
      if (!task) return;

      setIsLoading(true);
      const defaultSubject = task.title;
      setEmailSubject(defaultSubject);

      try {
        // Generate email using AI
        const response = await sendMessage(
          `Please draft a professional email about: "${task.title}". 
        Context: ${task.context || "No additional context provided"}
        Please include a subject line and keep it concise and professional.`,
          user,
          {
            currentTask: task.title,
            timeOfDay: "morning", // Default
            energyLevel: "medium", // Default
          },
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

      setIsLoading(false);
    },
    [user, threadId]
  );

  const handleCreateEmail = useCallback(
    async (task: Task) => {
      if (!task) return;

      setIsLoading(true);

      // Open modal if callback is provided
      if (onModalOpen) {
        onModalOpen();
      }

      try {
        const emailText = await draftEmail(
          task.title,
          task.context || "",
          "Marketing Team", // Default recipient, could be made dynamic
          user
        );

        setEmailDraft(emailText);
      } catch (error) {
        console.error("Email drafting error:", error);
        setEmailDraft("Error generating email draft. Please try again.");
      }

      setIsLoading(false);
    },
    [user, onModalOpen]
  );

  const copyToClipboard = useCallback(() => {
    const emailContent = `To: ${emailRecipients}\nSubject: ${emailSubject}\n\n${emailDraft}`;
    navigator.clipboard.writeText(emailContent);
    alert("Email content copied to clipboard!");
  }, [emailRecipients, emailSubject, emailDraft]);

  const openInMailApp = useCallback(() => {
    window.open(
      `mailto:${emailRecipients}?subject=${encodeURIComponent(
        emailSubject
      )}&body=${encodeURIComponent(emailDraft)}`
    );
  }, [emailRecipients, emailSubject, emailDraft]);

  return {
    emailDraft,
    isLoading,
    emailRecipients,
    emailSubject,
    setEmailRecipients,
    setEmailSubject,
    generateEmail,
    handleCreateEmail,
    copyToClipboard,
    openInMailApp,
  };
};
