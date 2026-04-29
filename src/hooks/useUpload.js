import { validateUpload } from '../services/upload.service';
import { uploadFileToServer } from '../services/file.service';
import { useGlobalUpload } from '../context/UploadContext';

export default function useUpload({ isUnlimited = false } = {}) {
  const {
    progress, setProgress,
    status, setStatus,
    error, setError,
    uploadedFiles, setUploadedFiles,
    requiresUpgrade, setRequiresUpgrade,
    currentUploadName, setCurrentUploadName,
    resetUpload
  } = useGlobalUpload();

  async function startUpload(files, notes = "", location = "Central Europe", directoryId = null) {
    try {
      resetUpload();
      setStatus('validating');

      // Validate files
      const filesArray = Array.isArray(files) ? files : [files];
      await validateUpload(filesArray, isUnlimited);

      setStatus('uploading');
      
      // Sort files by size ascending (smallest first)
      const sortedFiles = [...filesArray].sort((a, b) => a.size - b.size);
      
      const allUploadedFiles = [];
      let count = 1;
      
      for (const file of sortedFiles) {
        const prefix = sortedFiles.length > 1 ? `(${count}/${sortedFiles.length}) ` : '';
        setCurrentUploadName(`${prefix}${file.name}`);
        setProgress(0);

        // Upload single file to backend
        const result = await uploadFileToServer([file], notes, location, setProgress, directoryId);
        if (result.files) {
          allUploadedFiles.push(...result.files);
        }
        count++;
      }
      
      setUploadedFiles(allUploadedFiles);
      setStatus('success');

      return { files: allUploadedFiles };

    } catch (err) {
      if (err.requiresUpgrade) {
        setRequiresUpgrade(true);
        setError('Storage limit exceeded. Please upgrade to Premium.');
        setStatus('error');
      } else {
        setError(err.message);
        setStatus('error');
      }
      throw err;
    }
  }

  return {
    startUpload,
    progress,
    status,
    error,
    uploadedFiles,
    requiresUpgrade,
    currentUploadName,
    resetUpload
  };
}
