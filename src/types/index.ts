export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  size: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatState {
  messages: Message[];
  isGenerating: boolean;
  input: string;
}

export interface ModelState {
  selectedModelId: string;
  modelLoaded: boolean;
  isModelLoading: boolean;
  loadingProgress: string;
  engines: Record<string, any>;
  loadedModels: Set<string>;
}
