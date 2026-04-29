import { createContext, useContext, useState } from 'react';

const UploadContext = createContext(null);

export function UploadProvider({ children }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);
  const [currentUploadName, setCurrentUploadName] = useState("");

  const resetUpload = () => {
    setProgress(0);
    setStatus(null);
    setError(null);
    setUploadedFiles([]);
    setRequiresUpgrade(false);
    setCurrentUploadName("");
  };

  return (
    <UploadContext.Provider value={{
      progress, setProgress,
      status, setStatus,
      error, setError,
      uploadedFiles, setUploadedFiles,
      requiresUpgrade, setRequiresUpgrade,
      currentUploadName, setCurrentUploadName,
      resetUpload
    }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useGlobalUpload() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error("useGlobalUpload must be used within UploadProvider");
  return ctx;
}
