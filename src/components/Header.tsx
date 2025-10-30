import { AVAILABLE_MODELS } from '../utils/models';

interface HeaderProps {
  selectedModelId: string;
  onModelChange: (modelId: string) => void;
  onClearChat: () => void;
  onRetry: () => void;
  onClearCache: () => void;
  isModelLoading: boolean;
  modelLoaded: boolean;
}

export const Header = ({
  selectedModelId,
  onModelChange,
  onClearChat,
  onRetry,
  onClearCache,
  isModelLoading,
  modelLoaded
}: HeaderProps) => {
  const selectedModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0];

  return (
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
            onChange={(e) => onModelChange(e.target.value)}
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
          onClick={onClearChat}
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
              onClick={onRetry}
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
              onClick={onClearCache}
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
  );
};
