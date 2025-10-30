import { useEffect, useState, useRef } from "react";
import * as webllm from "@mlc-ai/web-llm";

// Available WebLLM models
interface ModelConfig {
  id: string;
  name: string;
  description: string;
  size: string;
}

const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: "TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC",
    name: "TinyLlama 1.1B Chat (RECOMMENDED FOR TESTING)",
    description: "Very small model, most reliable for cache issues",
    size: "~0.8GB"
  },
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 1B Instruct",
    description: "Fast and efficient small model for quick responses",
    size: "~1.2GB"
  },
  {
    id: "Phi-3.5-mini-instruct-q4f16_1-MLC", 
    name: "Phi-3.5 Mini",
    description: "Microsoft's model (may have cache issues)",
    size: "~2.1GB"
  },
  {
    id: "RedPajama-INCITE-Chat-3B-v1-q4f16_1-MLC",
    name: "RedPajama 3B Chat",
    description: "Alternative 3B model that may work better",
    size: "~2.0GB"
  },
  {
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 3B Instruct", 
    description: "Balanced performance and speed",
    size: "~2.8GB"
  }
];

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatBot() {
  const [selectedModelId, setSelectedModelId] = useState<string>(AVAILABLE_MODELS[0].id);
  const [engines, setEngines] = useState<Record<string, webllm.MLCEngineInterface>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState("");
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadedModels, setLoadedModels] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0];

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize WebLLM engine for a specific model
  const initializeEngine = async (modelId: string, retryCount: number = 0) => {
    // Check if model is already loaded
    if (engines[modelId] && loadedModels.has(modelId)) {
      console.log(`Model ${modelId} already loaded`);
      setModelLoaded(true);
      return engines[modelId];
    }

    setIsModelLoading(true);
    setLoadingProgress("Initializing WebLLM engine...");
    
    try {
      // On retry, clear cache specifically for this model and wait longer
      if (retryCount > 0) {
        console.log(`Retry attempt ${retryCount} for ${modelId} - clearing cache first`);
        setLoadingProgress(`Clearing cache for ${modelId} (retry ${retryCount})...`);
        await clearModelSpecificCache(modelId);
        
        // Wait longer between retries to avoid rate limiting
        const waitTime = retryCount * 2000; // 2s, 4s, 6s...
        setLoadingProgress(`Waiting ${waitTime/1000}s to avoid rate limiting...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      // Clear any existing engine for this model
      if (engines[modelId]) {
        try {
          await engines[modelId].unload();
        } catch (e) {
          console.log("Error unloading previous engine:", e);
        }
      }
      
      setLoadingProgress(`Creating WebLLM engine for ${AVAILABLE_MODELS.find(m => m.id === modelId)?.name}...`);
      
      // Create engine with enhanced progress tracking and rate limiting handling
      const newEngine = await webllm.CreateMLCEngine(modelId, {
        initProgressCallback: (progress: webllm.InitProgressReport) => {
          const percentComplete = Math.round(progress.progress * 100);
          const progressText = `${progress.text || 'Loading'}: ${percentComplete}%`;
          console.log("Loading progress:", progressText);
          setLoadingProgress(progressText);
        }
      });

      // Store the engine
      setEngines(prev => ({ ...prev, [modelId]: newEngine }));
      setLoadedModels(prev => new Set(prev).add(modelId));
      
      // If this is the selected model, mark it as loaded
      if (modelId === selectedModelId) {
        setModelLoaded(true);
        setLoadingProgress("Model loaded successfully!");
        
        // Add welcome message
        setMessages([{
          role: "assistant",
          content: `Hello! I'm ${selectedModel.name}. I'm running entirely in your browser - no server needed! How can I help you today?`,
          timestamp: new Date()
        }]);
      }

    } catch (error) {
      console.error("Failed to initialize model:", error);
      
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Enhanced error handling with automatic retry for different error types
      let guidance = "";
      let shouldRetry = false;
      
      if (errorMessage.includes("429") || errorMessage.includes("Too Many Requests")) {
        guidance = "\n\n� Rate Limit Error - GitHub servers are busy:\n1. Wait a few minutes and try again\n2. Try a different model\n3. GitHub limits downloads per hour\n4. Try again later when traffic is lower";
        shouldRetry = retryCount < 3; // Retry rate limit errors up to 3 times
      } else if (errorMessage.includes("Cache") || errorMessage.includes("cache")) {
        guidance = "\n\n🔧 Cache Error Solutions:\n1. Clear browser cache (Ctrl+Shift+Delete)\n2. Try incognito/private browsing mode\n3. Disable browser extensions temporarily\n4. Try a different browser (Chrome/Edge recommended)";
        shouldRetry = retryCount < 2; // Retry cache errors up to 2 times
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        guidance = "\n\n🌐 Network Error Solutions:\n1. Check internet connection\n2. Try again in a few minutes\n3. Disable VPN/proxy if active\n4. Allow browser permissions for this site";
        shouldRetry = retryCount < 2;
      } else if (errorMessage.includes("memory") || errorMessage.includes("Memory")) {
        guidance = "\n\n💾 Memory Error Solutions:\n1. Close other browser tabs\n2. Try a smaller model (Llama 3.2 1B)\n3. Restart browser\n4. Use a device with more RAM";
        shouldRetry = false; // Don't retry memory errors
      } else {
        guidance = "\n\n💡 General Solutions:\n1. Refresh the page (F5)\n2. Try a different model\n3. Use Chrome or Edge browser\n4. Check browser console for details";
        shouldRetry = retryCount < 1;
      }
      
      // Auto-retry with exponential backoff
      if (shouldRetry) {
        const waitTime = (retryCount + 1) * 3000; // 3s, 6s, 9s...
        console.log(`Auto-retrying ${modelId} in ${waitTime/1000}s due to error (attempt ${retryCount + 1})`);
        setLoadingProgress(`Error detected, retrying ${modelId} in ${waitTime/1000}s...`);
        
        // Show countdown
        for (let i = waitTime/1000; i > 0; i--) {
          setLoadingProgress(`Retrying ${modelId} in ${i}s... (${errorMessage})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Recursive retry with incremented count
        return initializeEngine(modelId, retryCount + 1);
      }
      
      setLoadingProgress(`Failed to load ${selectedModel.name}: ${errorMessage}`);
      setModelLoaded(false);
      
      // Add error message to chat only if this is the selected model
      if (modelId === selectedModelId) {
        setMessages([{
          role: "assistant",
          content: `❌ Failed to load ${selectedModel.name}\n\nError: ${errorMessage}${guidance}`,
          timestamp: new Date()
        }]);
      }
    } finally {
      if (modelId === selectedModelId) {
        setIsModelLoading(false);
      }
    }
  };

  // Clear cache for specific model
  const clearModelSpecificCache = async (modelId: string) => {
    try {
      console.log(`🧹 Clearing cache for model: ${modelId}`);
      
      // Clear from Cache API
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          if (cacheName.includes(modelId) || cacheName.includes('webllm') || cacheName.includes('mlc')) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            for (const request of requests) {
              if (request.url.includes(modelId)) {
                await cache.delete(request);
                console.log(`Deleted cache entry: ${request.url}`);
              }
            }
          }
        }
      }
      
      // Clear from localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes(modelId) || key.includes('webllm') || key.includes('mlc'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`Removed localStorage key: ${key}`);
      });
      
      console.log(`✅ Model cache cleared for: ${modelId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error clearing model cache for ${modelId}:`, error);
      return false;
    }
  };

  // Load model when selection changes
  useEffect(() => {
    if (selectedModelId) {
      // Clear previous messages when switching models
      setMessages([]);
      
      // Check if model is already loaded
      if (engines[selectedModelId]) {
        setModelLoaded(true);
        setMessages([{
          role: "assistant",
          content: `Hello! I'm ${selectedModel.name}. I was already loaded and ready to chat! How can I help you today?`,
          timestamp: new Date()
        }]);
      } else {
        setModelLoaded(false);
        initializeEngine(selectedModelId);
      }
    }
  }, [selectedModelId, engines, selectedModel]);

  // Handle sending message
  const handleSendMessage = async () => {
    const currentEngine = engines[selectedModelId];
    if (!currentEngine || !input.trim() || isGenerating) return;

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
      const response = await currentEngine.chat.completions.create({
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
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Clear chat
  const clearChat = () => {
    if (modelLoaded) {
      setMessages([{
        role: "assistant",
        content: `Chat cleared! I'm ${selectedModel.name} and I'm ready to help you.`,
        timestamp: new Date()
      }]);
    } else {
      setMessages([]);
    }
  };

  // Clear browser cache for WebLLM - Enhanced version
  const clearWebLLMCache = async () => {
    try {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "🧹 Starting comprehensive cache cleanup...",
        timestamp: new Date()
      }]);

      console.log("🧹 Starting comprehensive cache cleanup...");
      
      // Clear Cache API
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log(`Found ${cacheNames.length} cache(s):`, cacheNames);
        await Promise.all(cacheNames.map(async (name) => {
          console.log(`Deleting cache: ${name}`);
          return caches.delete(name);
        }));
      }
      
      // Clear localStorage
      const localStorageKeys = Object.keys(localStorage);
      console.log(`Clearing ${localStorageKeys.length} localStorage items`);
      localStorage.clear();
      
      // Clear sessionStorage
      const sessionStorageKeys = Object.keys(sessionStorage);
      console.log(`Clearing ${sessionStorageKeys.length} sessionStorage items`);
      sessionStorage.clear();
      
      // Clear IndexedDB databases
      if ('indexedDB' in window) {
        try {
          // Try to get databases list
          let databases = [];
          try {
            databases = await indexedDB.databases();
          } catch (e) {
            // Fallback to common database names if databases() is not supported
            databases = [
              { name: 'webllm-cache' },
              { name: 'model-cache' },
              { name: 'mlc-cache' },
              { name: 'transformers-cache' },
              { name: 'cache-storage' },
              { name: 'wasm-cache' }
            ];
          }
          
          for (const db of databases) {
            if (db.name) {
              try {
                const deleteReq = indexedDB.deleteDatabase(db.name);
                await new Promise((resolve, reject) => {
                  deleteReq.onsuccess = () => {
                    console.log(`Deleted IndexedDB: ${db.name}`);
                    resolve(undefined);
                  };
                  deleteReq.onerror = () => reject(deleteReq.error);
                  deleteReq.onblocked = () => {
                    console.warn(`IndexedDB ${db.name} deletion blocked`);
                    resolve(undefined);
                  };
                  // Timeout after 5 seconds
                  setTimeout(() => resolve(undefined), 5000);
                });
              } catch (err) {
                console.log(`IndexedDB ${db.name} deletion failed:`, err);
              }
            }
          }
        } catch (err) {
          console.warn("IndexedDB cleanup failed:", err);
        }
      }

      // Clear Service Worker cache if available
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
            console.log('Service worker unregistered');
          }
        } catch (e) {
          console.log('Service worker cleanup failed:', e);
        }
      }

      console.log("✅ Cache cleanup completed successfully");
      
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "✅ Comprehensive cache cleanup complete!\n\n🔄 Please refresh the page (F5) and try again.\n\n💡 Tips:\n• Try TinyLlama first - it's the most reliable\n• Use incognito mode if problems persist\n• Chrome/Edge work best for WebLLM",
        timestamp: new Date()
      }]);
      
    } catch (error) {
      console.error("Error clearing cache:", error);
      setMessages(prev => [...prev, {
        role: "assistant", 
        content: "❌ Cache cleanup failed. Manual steps:\n\n1. Press Ctrl+Shift+Delete\n2. Select 'All time'\n3. Check all boxes\n4. Clear data\n5. Refresh page\n\nOr try incognito mode!",
        timestamp: new Date()
      }]);
    }
  };

  // Force retry model loading
  const retryModelLoading = () => {
    // Remove the current model from engines and reload
    setEngines(prev => {
      const newEngines = { ...prev };
      delete newEngines[selectedModelId];
      return newEngines;
    });
    setLoadedModels(prev => {
      const newSet = new Set(prev);
      newSet.delete(selectedModelId);
      return newSet;
    });
    setModelLoaded(false);
    setMessages([]);
    initializeEngine(selectedModelId);
  };

  return (
    <div style={{ 
      height: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      fontFamily: "system-ui, -apple-system, sans-serif",
      backgroundColor: "#f5f5f5"
    }}>
      {/* Header */}
      <div style={{ 
        padding: "20px", 
        backgroundColor: "white", 
        borderBottom: "1px solid #e0e0e0",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ margin: "0 0 16px 0", color: "#333" }}>
          🤖 Offline LLM Browser
        </h1>
        
        {/* Model Selection */}
        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1", minWidth: "300px" }}>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              disabled={isModelLoading}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: "14px",
                border: "2px solid #ddd",
                borderRadius: "8px",
                backgroundColor: "white"
              }}
            >
              {AVAILABLE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.size})
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={clearChat}
            disabled={isModelLoading}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: "#6c757d",
              color: "white",
              cursor: isModelLoading ? "not-allowed" : "pointer",
              opacity: isModelLoading ? 0.6 : 1
            }}
          >
            Clear Chat
          </button>

          {!modelLoaded && !isModelLoading && (
            <>
              <button
                onClick={retryModelLoading}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  border: "none",
                  borderRadius: "8px",
                  backgroundColor: "#007acc",
                  color: "white",
                  cursor: "pointer"
                }}
              >
                🔄 Retry
              </button>
              
              <button
                onClick={clearWebLLMCache}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  border: "none",
                  borderRadius: "8px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  cursor: "pointer"
                }}
              >
                🧹 Clear Cache
              </button>
            </>
          )}
        </div>
        
        <p style={{ 
          fontSize: "12px", 
          color: "#666", 
          margin: "8px 0 0 0" 
        }}>
          {selectedModel.description}
        </p>
      </div>

      {/* Loading State */}
      {isModelLoading && (
        <div style={{ 
          flex: 1, 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "center", 
          alignItems: "center",
          padding: "40px"
        }}>
          <div style={{ 
            background: "white", 
            padding: "32px", 
            borderRadius: "12px", 
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            textAlign: "center",
            maxWidth: "500px"
          }}>
            <div style={{ 
              width: "48px", 
              height: "48px", 
              border: "4px solid #f3f3f3", 
              borderTop: "4px solid #007acc",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px"
            }} />
            <h3 style={{ margin: "0 0 12px 0", color: "#333" }}>
              Loading {selectedModel.name}
            </h3>
            <p style={{ color: "#666", fontSize: "14px", margin: "0 0 8px 0" }}>
              {loadingProgress}
            </p>
            <p style={{ color: "#888", fontSize: "12px", margin: 0 }}>
              This may take a few minutes on first load...
            </p>
          </div>
        </div>
      )}

      {/* Chat Interface */}
      {!isModelLoading && (
        <>
          {/* Messages */}
          <div style={{ 
            flex: 1, 
            overflow: "auto", 
            padding: "20px",
            display: "flex",
            flexDirection: "column"
          }}>
            {messages.map((message, index) => (
              <div
                key={index}
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
            ))}
            {isGenerating && (
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
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ 
            padding: "20px", 
            backgroundColor: "white", 
            borderTop: "1px solid #e0e0e0" 
          }}>
            {/* Debug info */}
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
              Debug: modelLoaded={modelLoaded.toString()}, isGenerating={isGenerating.toString()}, hasEngine={!!engines[selectedModelId] ? "true" : "false"}
            </div>
            
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                disabled={false} // Temporarily always enabled for debugging
                style={{
                  flex: 1,
                  minHeight: "44px",
                  maxHeight: "120px",
                  padding: "12px 16px",
                  fontSize: "14px",
                  border: "2px solid #ddd",
                  borderRadius: "22px",
                  resize: "none",
                  outline: "none",
                  fontFamily: "inherit",
                  backgroundColor: (!modelLoaded || isGenerating) ? "#f5f5f5" : "white"
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!modelLoaded || !input.trim() || isGenerating}
                style={{
                  padding: "12px 24px",
                  fontSize: "14px",
                  border: "none",
                  borderRadius: "22px",
                  backgroundColor: !modelLoaded || !input.trim() || isGenerating ? "#ccc" : "#007acc",
                  color: "white",
                  cursor: !modelLoaded || !input.trim() || isGenerating ? "not-allowed" : "pointer",
                  fontWeight: "600"
                }}
              >
                Send
              </button>
            </div>
            
            {/* Status info */}
            {!modelLoaded && !isModelLoading && (
              <div style={{ fontSize: "12px", color: "#ff6b6b", marginTop: "8px" }}>
                ⚠️ Model not loaded. Check console for errors.
              </div>
            )}
          </div>
        </>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
