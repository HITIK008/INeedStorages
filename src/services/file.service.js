import { apiClient } from './api';

export async function getFiles(directoryId = null) {
  try {
    return await apiClient.getFiles(directoryId);
  } catch (err) {
    console.debug('Error fetching files (suppressed):', err);
    return [];
  }
}

export async function getDirectories() {
  try {
    return await apiClient.getDirectories();
  } catch (err) {
    console.debug('Error fetching directories (suppressed):', err);
    return [];
  }
}

export async function createDirectory(name, parentId = null) {
  try {
    return await apiClient.createDirectory(name, parentId);
  } catch (err) {
    console.error('Error creating directory:', err);
    throw err;
  }
}

export async function deleteDirectory(directoryId) {
  try {
    return await apiClient.deleteDirectory(directoryId);
  } catch (err) {
    console.error('Error deleting directory:', err);
    throw err;
  }
}

export async function deleteFile(fileId) {
  try {
    await apiClient.deleteFile(fileId);
  } catch (err) {
    console.error('Error deleting file:', err);
    throw err;
  }
}

export async function updateFile(fileId, data) {
  try {
    return await apiClient.updateFile(fileId, data);
  } catch (err) {
    console.error('Error updating file:', err);
    throw err;
  }
}

export async function downloadFile(fileId) {
  try {
    await apiClient.downloadFile(fileId);
  } catch (err) {
    console.error('Error downloading file:', err);
    throw err;
  }
}

export async function uploadFileToServer(files, notes, location, setProgress, directoryId = null) {
  try {
    const result = await apiClient.uploadFiles(files, notes, location, directoryId, (percent) => {
      setProgress(percent);
    });
    setProgress(100);

    return result;
  } catch (err) {
    console.error('Error uploading file:', err);
    throw err;
  }
}

