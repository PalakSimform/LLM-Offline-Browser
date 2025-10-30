import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { LoadingScreen } from "./components/LoadingScreen";
import { ChatContainer } from "./components/ChatContainer";
import { ChatInput } from "./components/ChatInput";
import { useWebLLMEngine } from "./hooks/useWebLLMEngine";
import { useChat } from "./hooks/useChat";
import { clearAllCaches } from "./utils/cache";
import { AVAILABLE_MODELS } from "./utils/models";
import type { Message } from "./types";

export default function ChatBot() {
  const [selectedModelId, setSelectedModelId] = useState<string>(AVAILABLE_MODELS[0].id);
  const [loadingProgress, setLoadingProgress] = useState("");

  const {
    messages,
    input,
    isGenerating,
    setInput,
    updateMessages,
    handleSendMessage,
    clearChat
  } = useChat();

  const {
    engines,
    isModelLoading,
    modelLoaded,
    initializeEngine,
    retryModelLoading
  } = useWebLLMEngine({
    onProgressUpdate: setLoadingProgress,
    onMessagesUpdate: updateMessages
  });

  const selectedModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0];
  const currentEngine = engines[selectedModelId];

  // Load model when selection changes
  useEffect(() => {
    if (selectedModelId) {
      updateMessages([]);
      
      if (engines[selectedModelId]) {
        const welcomeMessage: Message = {
          role: "assistant",
          content: `Hello! I'm ${selectedModel.name}. I was already loaded and ready to chat! How can I help you today?`,
          timestamp: new Date()
        };
        updateMessages([welcomeMessage]);
      } else {
        initializeEngine(selectedModelId);
      }
    }
  }, [selectedModelId, engines, selectedModel, initializeEngine, updateMessages]);

  // Handle cache clearing with user feedback
  const handleClearCache = async () => {
    const cacheMessage: Message = {
      role: "assistant",
      content: "🧹 Starting comprehensive cache cleanup...",
      timestamp: new Date()
    };
    updateMessages([...messages, cacheMessage]);

    const success = await clearAllCaches();
    
    const resultMessage: Message = {
      role: "assistant",
      content: success 
        ? "✅ Comprehensive cache cleanup complete!\n\n🔄 Please refresh the page (F5) and try again.\n\n💡 Tips:\n• Try TinyLlama first - it's the most reliable\n• Use incognito mode if problems persist\n• Chrome/Edge work best for WebLLM"
        : "❌ Cache cleanup failed. Manual steps:\n\n1. Press Ctrl+Shift+Delete\n2. Select 'All time'\n3. Check all boxes\n4. Clear data\n5. Refresh page\n\nOr try incognito mode!",
      timestamp: new Date()
    };
    
    updateMessages([...messages, cacheMessage, resultMessage]);
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
  };

  const handleClearChat = () => {
    clearChat(modelLoaded, selectedModel.name);
  };

  const handleRetry = () => {
    retryModelLoading(selectedModelId);
  };

  const handleSend = () => {
    handleSendMessage(currentEngine);
  };

  return (
    <div style={{ 
      height: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      fontFamily: "system-ui, -apple-system, sans-serif",
      backgroundColor: "#f5f5f5"
    }}>
      <Header
        selectedModelId={selectedModelId}
        onModelChange={handleModelChange}
        onClearChat={handleClearChat}
        onRetry={handleRetry}
        onClearCache={handleClearCache}
        isModelLoading={isModelLoading}
        modelLoaded={modelLoaded}
      />

      {isModelLoading ? (
        <LoadingScreen 
          selectedModelId={selectedModelId}
          loadingProgress={loadingProgress}
        />
      ) : (
        <>
          <ChatContainer 
            messages={messages}
            isGenerating={isGenerating}
          />
          
          <ChatInput
            input={input}
            onInputChange={setInput}
            onSend={handleSend}
            disabled={false}
            isGenerating={isGenerating}
            modelLoaded={modelLoaded}
            hasEngine={!!currentEngine}
          />
        </>
      )}
    </div>
  );
}
