import { useState, useCallback } from 'react';
import type { Message } from '../types';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const updateMessages = useCallback((newMessages: Message[]) => {
    setMessages(newMessages);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const handleSendMessage = useCallback(async (engine: any) => {
    if (!engine || !input.trim() || isGenerating) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);

    try {
      // Create messages array for the API
      const chatMessages = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Generate response
      const response = await engine.chat.completions.create({
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 512,
      });

      const assistantMessage: Message = {
        role: "assistant", 
        content: response.choices[0]?.message?.content || "Sorry, I couldn't generate a response.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error("Error generating response:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error while generating a response. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  }, [input, messages, isGenerating]);

  const clearChat = useCallback((modelLoaded: boolean, selectedModelName: string) => {
    if (modelLoaded) {
      setMessages([{
        role: "assistant",
        content: `Chat cleared! I'm ${selectedModelName} and I'm ready to help you.`,
        timestamp: new Date()
      }]);
    } else {
      setMessages([]);
    }
  }, []);

  return {
    messages,
    input,
    isGenerating,
    setInput,
    addMessage,
    updateMessages,
    clearMessages,
    handleSendMessage,
    clearChat
  };
};
