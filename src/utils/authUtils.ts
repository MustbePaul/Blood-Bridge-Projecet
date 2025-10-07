/**
 * Authentication utility functions
 */

/**
 * Get the current user ID from localStorage
 * @returns string | null - The user ID or null if not found/invalid
 */
export const getCurrentUserId = (): string | null => {
  const userId = localStorage.getItem('user_id');
  return userId && userId !== 'null' ? userId : null;
};

/**
 * Get the current user role from localStorage
 * @returns string | null - The user role or null if not found
 */
export const getCurrentUserRole = (): string | null => {
  return localStorage.getItem('user_role');
};

/**
 * Get the current user email from localStorage
 * @returns string | null - The user email or null if not found
 */
export const getCurrentUserEmail = (): string | null => {
  return localStorage.getItem('user_email');
};

/**
 * Check if user is logged in
 * @returns boolean - True if user is logged in
 */
export const isUserLoggedIn = (): boolean => {
  return localStorage.getItem('is_logged_in') === 'true';
};

/**
 * Clear all authentication data from localStorage
 */
export const clearAuthData = (): void => {
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_email');
  localStorage.removeItem('is_logged_in');
};
