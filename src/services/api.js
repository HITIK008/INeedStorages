const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const API_URL = rawApiUrl.endsWith('/api')
  ? rawApiUrl
  : `${rawApiUrl.replace(/\/$/, '')}/api`;

// Get userId from localStorage
const getUserId = () => {
  return localStorage.getItem('userId');
};

// Helper to add auth headers
const getAuthHeaders = () => {
  const userId = getUserId();
  return userId ? { 'x-user-id': userId, 'Content-Type': 'application/json' } : {};
};

export const apiClient = {
  async generateId() {
    const response = await fetch(`${API_URL}/generate-id`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate ID');
    }
    return response.json();
  },

  async signup(userId, referralCode = "") {
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, referralCode }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }
    return response.json();
  },

  async login(userId) {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    return response.json();
  },

  async changeAccountId(newUserId) {
    const response = await fetch(`${API_URL}/account/id`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newUserId }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to change account ID');
    }
    return response.json();
  },

  async deleteAccount(confirmText) {
    const response = await fetch(`${API_URL}/account`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ confirmText }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete account');
    }
    return response.json();
  },

  async getFiles(directoryId = null) {
    const url = new URL(`${API_URL}/files`);
    if (directoryId) url.searchParams.append('directoryId', directoryId);
    const response = await fetch(url.toString(), {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch files');
    return response.json();
  },

  async getGlobalStats() {
    const response = await fetch(`${API_URL}/stats/global`);
    if (!response.ok) return { totalUploads: 0, totalUsers: 0 };
    return response.json();
  },

  async uploadFiles(files, notes, location, directoryId = null, onProgress = null) {
    const userId = getUserId();
    if (!userId) throw new Error('Not authenticated. Please login to upload files.');

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('notes', notes);
    formData.append('location', location);
    if (directoryId) formData.append('directoryId', directoryId);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_URL}/upload`);
      xhr.setRequestHeader('x-user-id', userId);

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        });
      }

      xhr.onload = () => {
        try {
          const json = xhr.responseText ? JSON.parse(xhr.responseText) : {};
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(json);
          } else {
            const error = new Error(json.error || json.message || 'Failed to upload files');
            if (json.requiresUpgrade) {
              error.requiresUpgrade = true;
              error.usedStorage = json.usedStorage;
              error.storageLimit = json.storageLimit;
            }
            reject(error);
          }
        } catch (e) {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ success: true });
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during upload'));
      };

      xhr.send(formData);
    });
  },

  async deleteFile(fileId) {
    const response = await fetch(`${API_URL}/files/${fileId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error('Delete failed');
    return response.json();
  },

  async updateFile(fileId, data) {
    const response = await fetch(`${API_URL}/files/${fileId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Update failed');
    }
    return response.json();
  },

  async downloadFile(fileId) {
    window.location.href = `${API_URL}/files/${fileId}/download`;
  },

  async getFileInfo(fileId) {
    const response = await fetch(`${API_URL}/files/${fileId}/info`);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'File not found');
    }
    return response.json();
  },

  async getStorageInfo() {
    const response = await fetch(`${API_URL}/storage`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch storage info');
    return response.json();
  },

  async updateNotificationEmail(email) {
    const response = await fetch(`${API_URL}/notifications/email`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to update notification email");
    }
    return response.json();
  },

  async getAlerts() {
    const response = await fetch(`${API_URL}/alerts`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to fetch alerts");
    }
    return response.json();
  },

  async getReferrals() {
    const response = await fetch(`${API_URL}/referrals`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch referrals');
    }
    return response.json();
  },

  async getDirectories() {
    const response = await fetch(`${API_URL}/directories`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch directories');
    return response.json();
  },

  async createDirectory(name, parentId = null) {
    const response = await fetch(`${API_URL}/directories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, parentId }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Create directory failed');
    }
    return response.json();
  },

  async deleteDirectory(directoryId) {
    const response = await fetch(`${API_URL}/directories/${directoryId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Delete directory failed');
    }
    return response.json();
  },

  async checkHealth() {
    try {
      const response = await fetch(`${API_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  },

  async createUploadLink(maxUploads = 9999, expiryDays = 7) {
    const response = await fetch(`${API_URL}/upload-links`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ maxUploads, expiryDays }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create upload link');
    }
    return response.json();
  },

  async getActiveSubscriptions() {
    const response = await fetch(`${API_URL}/subscriptions/active`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch subscriptions');
    }
    return response.json();
  },

  async getUploadLinkInfo(linkId) {
    const response = await fetch(`${API_URL}/upload-links/${linkId}`);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to fetch link info');
    }
    return response.json();
  },

  async getUploadLinkFiles(linkId) {
    const response = await fetch(`${API_URL}/upload-links/${linkId}/files`);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch uploaded files');
    }
    return response.json();
  },

  async getUploadLinks() {
    const response = await fetch(`${API_URL}/upload-links`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch upload links');
    }
    return response.json();
  },

  async uploadViaLink(linkId, files, notes = '', location = 'Central Europe') {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('notes', notes);
    formData.append('location', location);

    let response;
    try {
      response = await fetch(`${API_URL}/upload-links/${linkId}/upload`, {
        method: 'POST',
        body: formData,
      });
    } catch (networkErr) {
      throw new Error(`Network error during upload: ${networkErr.message}`);
    }

    const text = await response.text();
    let json = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = {};
    }

    if (!response.ok) {
      throw new Error(json.message || json.error || `Upload failed: ${response.status} ${response.statusText}`);
    }

    return json && Object.keys(json).length > 0 ? json : { success: true };
  },
};
