import { useState, useEffect, useCallback } from "react";
import { getFiles, deleteFile, updateFile } from "../services/file.service";

export function useFiles(directoryId = null) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshFiles = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedFiles = await getFiles(directoryId);
      setFiles(fetchedFiles || []);
      setError(null);
    } catch (err) {
      console.error("Error refreshing files:", err);
      setError(err.message);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [directoryId]);

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  const removeFile = useCallback(async (fileId) => {
    try {
      await deleteFile(fileId);
      refreshFiles();
    } catch (err) {
      console.error("Error deleting file:", err);
      setError(err.message);
    }
  }, [refreshFiles]);

  const editFile = useCallback(async (fileId, data) => {
    try {
      await updateFile(fileId, data);
      await refreshFiles();
    } catch (err) {
      console.error("Error updating file:", err);
      setError(err.message);
      throw err;
    }
  }, [refreshFiles]);

  return {
    files,
    loading,
    error,
    refreshFiles,
    removeFile,
    editFile,
  };
}
