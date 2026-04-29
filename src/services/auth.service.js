import { apiClient } from './api';

// Generate a random 16-character alphanumeric ID
function generateUserId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const authService = {
  async signup(userId, referralCode = "") {
    const result = await apiClient.signup(userId, referralCode);
    if (result.success) {
      localStorage.setItem('userId', userId);
      return result;
    }
  },

  async login(userId) {
    const result = await apiClient.login(userId);
    if (result.success) {
      localStorage.setItem('userId', userId);
      return result;
    }
  },

  async changeAccountId(newUserId) {
    const result = await apiClient.changeAccountId(newUserId);
    if (result.success) {
      localStorage.setItem('userId', newUserId);
      return result;
    }
  },

  async ensureUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      throw new Error("No user ID found");
    }
    return userId;
  },

  logout() {
    localStorage.removeItem('userId');
  },

  getUserId() {
    return localStorage.getItem('userId');
  },

  isAuthenticated() {
    return !!localStorage.getItem('userId');
  },
};
