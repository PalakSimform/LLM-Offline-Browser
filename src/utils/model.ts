import type { ModelConfig } from '../types';

export const AVAILABLE_MODELS: ModelConfig[] = [
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
