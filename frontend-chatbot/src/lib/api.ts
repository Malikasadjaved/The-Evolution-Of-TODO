/**
 * API Client Utilities for Chatbot Frontend
 *
 * Provides helper functions for authentication checking and API base URL.
 */

/**
 * Check if user is authenticated (has valid JWT token in localStorage)
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false; // Server-side rendering
  }

  const token = localStorage.getItem('auth_token');

  if (!token) {
    return false;
  }

  try {
    // Basic JWT validation - check if token is not expired
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp;

    if (!exp) {
      return false;
    }

    // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
    const isExpired = Date.now() >= exp * 1000;

    if (isExpired) {
      localStorage.removeItem('auth_token');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to validate auth token:', error);
    return false;
  }
}

/**
 * Get the API base URL from environment variables or default to localhost
 */
export function getAPIBaseURL(): string {
  return process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL || 'http://localhost:8000';
}
