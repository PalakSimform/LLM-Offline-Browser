import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: message.role === "user" ? "flex-end" : "flex-start",
        marginBottom: "16px"
      }}
    >
      <div
        style={{
          maxWidth: "70%",
          padding: "12px 16px",
          borderRadius: "18px",
          backgroundColor: message.role === "user" ? "#007acc" : "white",
          color: message.role === "user" ? "white" : "#333",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word"
        }}
      >
        {message.content}
      </div>
    </div>
  );
};

interface TypingIndicatorProps {
  show: boolean;
}

export const TypingIndicator = ({ show }: TypingIndicatorProps) => {
  if (!show) return null;

  return (
    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "16px" }}>
      <div style={{
        padding: "12px 16px",
        borderRadius: "18px",
        backgroundColor: "white",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        color: "#666"
      }}>
        Thinking...
      </div>
    </div>
  );
};
