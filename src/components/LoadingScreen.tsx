import { AVAILABLE_MODELS } from '../utils/models';

interface LoadingScreenProps {
  selectedModelId: string;
  loadingProgress: string;
}

export const LoadingScreen = ({ selectedModelId, loadingProgress }: LoadingScreenProps) => {
  const selectedModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0];

  return (
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
      
      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
