export function formatDate(dateString) {
    const d = new Date(dateString);
    return d.toLocaleDateString();
  }
  
  export function getTimeRemaining(expiresAt) {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
  
    if (diff <= 0) return "Expired";
  
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} day(s) left`;
  
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours} hour(s) left`;
  }
  