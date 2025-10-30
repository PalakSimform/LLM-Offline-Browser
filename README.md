# 🤖 LLM Offline Browser

A **fully offline** Large Language Model (LLM) chat application that runs entirely in your web browser. No servers, no APIs, no internet required after initial model download - just pure client-side AI!

![React](https://img.shields.io/badge/React-19.1.0-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?logo=typescript)
![WebLLM](https://img.shields.io/badge/WebLLM-0.2.79-green)
![Vite](https://img.shields.io/badge/Vite-7.0.0-purple?logo=vite)

## ✨ Features

- 🌐 **100% Browser-based** - No server required, runs entirely in your browser
- 🔒 **Complete Privacy** - All conversations stay on your device
- 📱 **Cross-platform** - Works on any device with a modern browser
- 🚀 **Multiple Models** - Choose from TinyLlama, Phi-3.5 Mini, and Llama 3.2 1B
- 💾 **Smart Caching** - Models are cached locally for instant loading
- 🔄 **Auto-retry Logic** - Handles network issues and rate limiting gracefully
- 📊 **Real-time Progress** - See model download and loading progress
- 🎨 **Clean Interface** - Modern, responsive design

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Modern browser (Chrome, Edge, Firefox)
- 4GB+ RAM recommended

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/PalakSimform/LLM-Offline-Browser.git
   cd LLM-Offline-Browser
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:5173`
   - Select a model from the dropdown
   - Start chatting!

## 🏗️ Build for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## 🤖 Available Models

| Model | Size | Description | Best For |
|-------|------|-------------|----------|
| **TinyLlama 1.1B** | ~2GB | Fastest, most reliable | Quick responses, testing |
| **Phi-3.5 Mini** | ~4GB | Balanced performance | General conversations |
| **Llama 3.2 1B** | ~2GB | Good quality, compact | Quality responses |

## 💡 How It Works

1. **Model Selection** - Choose your preferred LLM from the dropdown
2. **Automatic Download** - Models are downloaded from GitHub and cached locally
3. **Browser Inference** - WebLLM runs the model using WebAssembly and WebGPU
4. **Local Storage** - Everything is stored in your browser's cache
5. **Offline Ready** - Once downloaded, works completely offline

## 🛠️ Technical Architecture

- **Frontend**: React 19 with TypeScript
- **AI Engine**: WebLLM (MLC-AI) for browser-based inference
- **Build Tool**: Vite 7 with optimized configuration
- **Storage**: Browser Cache API + IndexedDB for model persistence
- **Styling**: Inline styles with responsive design

## 🔧 Configuration

The application is configured for optimal WebLLM performance:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm'],
  },
})
```
