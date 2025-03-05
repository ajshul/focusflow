import React from "react";
import ReactMarkdown from "react-markdown";
import { X } from "lucide-react";
import { useAppStateContext } from "../../context/AppStateContext";

interface EmailModalProps {
  emailDraft: string;
  isLoading: boolean;
  emailRecipients: string;
  emailSubject: string;
  setEmailRecipients: (value: string) => void;
  setEmailSubject: (value: string) => void;
  copyToClipboard: () => void;
  openInMailApp: () => void;
}

const EmailModal: React.FC<EmailModalProps> = ({
  emailDraft,
  isLoading,
  emailRecipients,
  emailSubject,
  setEmailRecipients,
  setEmailSubject,
  copyToClipboard,
  openInMailApp,
}) => {
  const { setShowEmailModal } = useAppStateContext();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-auto">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Email Draft</h2>
            <button type="button" onClick={() => setShowEmailModal(false)}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-4">
          {isLoading ? (
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
            type="button"
            className="px-4 py-2 border rounded-md"
            onClick={() => setShowEmailModal(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md"
            onClick={copyToClipboard}
          >
            Copy to Clipboard
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-green-600 text-white rounded-md"
            onClick={openInMailApp}
          >
            Open in Mail App
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;
