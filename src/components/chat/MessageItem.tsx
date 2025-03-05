import React from "react";
import ReactMarkdown from "react-markdown";
import { Message } from "../../models/types";

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  return (
    <div className={`mb-3 ${message.sender === "user" ? "text-right" : ""}`}>
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
  );
};

export default MessageItem;
