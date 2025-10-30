import { useRef, useEffect } from 'react';
import type { Message } from '../types';
import { MessageBubble, TypingIndicator } from './MessageBubble';

interface ChatContainerProps {
  messages: Message[];
  isGenerating: boolean;
}

export const ChatContainer = ({ messages, isGenerating }: ChatContainerProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{ 
      flex: 1, 
      overflow: "auto", 
      padding: "20px",
      display: "flex",
      flexDirection: "column"
    }}>
      {messages.map((message, index) => (
        <MessageBubble key={index} message={message} />
      ))}
      <TypingIndicator show={isGenerating} />
      <div ref={messagesEndRef} />
    </div>
  );
};
