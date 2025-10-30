interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  isGenerating: boolean;
  modelLoaded: boolean;
  hasEngine: boolean;
}

export const ChatInput = ({ 
  input, 
  onInputChange, 
  onSend, 
  disabled, 
  isGenerating, 
  modelLoaded,
  hasEngine 
}: ChatInputProps) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div style={{ 
      padding: "20px", 
      backgroundColor: "white", 
      borderTop: "1px solid #e0e0e0" 
    }}>
      {/* Debug info */}
      <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
        Debug: modelLoaded={modelLoaded.toString()}, isGenerating={isGenerating.toString()}, hasEngine={hasEngine ? "true" : "false"}
      </div>
      
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
        <textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
          disabled={disabled}
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
          onClick={onSend}
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
      {!modelLoaded && (
        <div style={{ fontSize: "12px", color: "#ff6b6b", marginTop: "8px" }}>
          ⚠️ Model not loaded. Check console for errors.
        </div>
      )}
    </div>
  );
};
