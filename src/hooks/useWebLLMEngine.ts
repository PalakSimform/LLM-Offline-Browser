import { useState, useCallback } from 'react';
import * as webllm from "@mlc-ai/web-llm";
import type { Message } from '../types';
import { clearModelSpecificCache } from '../utils/cache';
import { getErrorGuidance, waitWithCountdown } from '../utils/errorHandling';
import { AVAILABLE_MODELS } from '../utils/models';

interface UseWebLLMEngineOptions {
  onProgressUpdate: (progress: string) => void;
  onMessagesUpdate: (messages: Message[]) => void;
}

export const useWebLLMEngine = ({ onProgressUpdate, onMessagesUpdate }: UseWebLLMEngineOptions) => {
  const [engines, setEngines] = useState<Record<string, webllm.MLCEngineInterface>>({});
  const [loadedModels, setLoadedModels] = useState<Set<string>>(new Set());
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);

  const initializeEngine = useCallback(async (modelId: string, retryCount: number = 0) => {
    // Check if model is already loaded
    if (engines[modelId] && loadedModels.has(modelId)) {
      console.log(`Model ${modelId} already loaded`);
      setModelLoaded(true);
      return engines[modelId];
    }

    setIsModelLoading(true);
    onProgressUpdate("Initializing WebLLM engine...");
    
    try {
      // On retry, clear cache specifically for this model and wait longer
      if (retryCount > 0) {
        console.log(`Retry attempt ${retryCount} for ${modelId} - clearing cache first`);
        onProgressUpdate(`Clearing cache for ${modelId} (retry ${retryCount})...`);
        await clearModelSpecificCache(modelId);
        
        // Wait longer between retries to avoid rate limiting
        const waitTime = retryCount * 2000; // 2s, 4s, 6s...
        onProgressUpdate(`Waiting ${waitTime/1000}s to avoid rate limiting...`);
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
      
      const modelName = AVAILABLE_MODELS.find(m => m.id === modelId)?.name || modelId;
      onProgressUpdate(`Creating WebLLM engine for ${modelName}...`);
      
      // Create engine with enhanced progress tracking
      const newEngine = await webllm.CreateMLCEngine(modelId, {
        initProgressCallback: (progress: webllm.InitProgressReport) => {
          const percentComplete = Math.round(progress.progress * 100);
          const progressText = `${progress.text || 'Loading'}: ${percentComplete}%`;
          console.log("Loading progress:", progressText);
          onProgressUpdate(progressText);
        }
      });

      // Store the engine
      setEngines(prev => ({ ...prev, [modelId]: newEngine }));
      setLoadedModels(prev => new Set(prev).add(modelId));
      setModelLoaded(true);
      onProgressUpdate("Model loaded successfully!");
      
      // Add welcome message
      const welcomeMessage: Message = {
        role: "assistant",
        content: `Hello! I'm ${modelName}. I'm running entirely in your browser - no server needed! How can I help you today?`,
        timestamp: new Date()
      };
      onMessagesUpdate([welcomeMessage]);
      
      return newEngine;

    } catch (error) {
      console.error("Failed to initialize model:", error);
      
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      const { guidance, shouldRetry, maxRetries } = getErrorGuidance(errorMessage);
      
      // Auto-retry with exponential backoff
      if (shouldRetry && retryCount < maxRetries) {
        const waitTime = (retryCount + 1) * 3000; // 3s, 6s, 9s...
        console.log(`Auto-retrying ${modelId} in ${waitTime/1000}s due to error (attempt ${retryCount + 1})`);
        onProgressUpdate(`Error detected, retrying ${modelId} in ${waitTime/1000}s...`);
        
        await waitWithCountdown(
          waitTime / 1000,
          onProgressUpdate,
          errorMessage,
          modelId
        );
        
        return initializeEngine(modelId, retryCount + 1);
      }
      
      const modelName = AVAILABLE_MODELS.find(m => m.id === modelId)?.name || modelId;
      onProgressUpdate(`Failed to load ${modelName}: ${errorMessage}`);
      setModelLoaded(false);
      
      const errorMessage_obj: Message = {
        role: "assistant",
        content: `❌ Failed to load ${modelName}\n\nError: ${errorMessage}${guidance}`,
        timestamp: new Date()
      };
      onMessagesUpdate([errorMessage_obj]);
      
      throw error;
    } finally {
      setIsModelLoading(false);
    }
  }, [engines, loadedModels, onProgressUpdate, onMessagesUpdate]);

  const retryModelLoading = useCallback((modelId: string) => {
    // Remove the current model from engines and reload
    setEngines(prev => {
      const newEngines = { ...prev };
      delete newEngines[modelId];
      return newEngines;
    });
    setLoadedModels(prev => {
      const newSet = new Set(prev);
      newSet.delete(modelId);
      return newSet;
    });
    setModelLoaded(false);
    onMessagesUpdate([]);
    initializeEngine(modelId);
  }, [initializeEngine, onMessagesUpdate]);

  return {
    engines,
    loadedModels,
    isModelLoading,
    modelLoaded,
    initializeEngine,
    retryModelLoading
  };
};
