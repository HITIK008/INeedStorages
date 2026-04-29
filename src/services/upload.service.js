import { MAX_FILE_SIZE_FREE } from "../utils/constants";
import { apiClient } from "./api";

export async function validateUpload(files, isUnlimited) {
  if (!files || files.length === 0) {
    throw new Error("No files selected");
  }

  // Get current storage info
  const storageInfo = await getStorageInfo();
  
  const uploadSize = Array.isArray(files) 
    ? files.reduce((sum, file) => sum + file.size, 0)
    : files.size;

  // Check storage limits for free accounts
  if (!isUnlimited && storageInfo && !storageInfo.isPremium) {
    if (storageInfo.usedStorage + uploadSize > storageInfo.storageLimit) {
      const error = new Error("Storage limit exceeded");
      error.requiresUpgrade = true;
      error.usedStorage = storageInfo.usedStorage;
      error.storageLimit = storageInfo.storageLimit;
      throw error;
    }
  }

  const isPremium = isUnlimited || (storageInfo && storageInfo.isPremium);

  if (Array.isArray(files)) {
    files.forEach(file => {
      if (!isPremium && file.size > MAX_FILE_SIZE_FREE) {
        throw new Error(`${file.name} exceeds 500MB limit`);
      }
    });
  } else {
    if (!isPremium && files.size > MAX_FILE_SIZE_FREE) {
      throw new Error("File exceeds 500MB limit");
    }
  }

  return true;
}

export async function getStorageInfo() {
  try {
    return await apiClient.getStorageInfo();
  } catch (err) {
    console.error('Error fetching storage info:', err);
    return null;
  }
}

