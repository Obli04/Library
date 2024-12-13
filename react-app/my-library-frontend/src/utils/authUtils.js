/*
 * Auth Utils component
 * Handles authentication-related utility functions including:
 * - CSRF token management
 * - User logout
 * - Password reset functionality
 */

import Cookies from 'js-cookie';

export const getCsrfToken = () => { //Get CSRF token from cookies
  return Cookies.get('csrftoken');
};

// Handles user logout and cleanup of user data
export const logout = async (setCurrentUser) => {
    const csrfToken = getCsrfToken();
    // Send logout request to the backend
    const response = await fetch('http://127.0.0.1:8000/api/logout/', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
    });

    // Clear user state and local storage
    setCurrentUser(null);
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear all cookies except CSRF token
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const cookieName = cookie.split('=')[0].trim();
      if (cookieName !== 'csrftoken') {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      }
    });
    return response.ok;
};

// Fetches CSRF token from the backend
export const fetchCsrfToken = async () => {
  const response = await fetch('http://127.0.0.1:8000/api/get-csrf-token/', {
    credentials: 'include',
  });
  if (response.ok) {
    const data = await response.json();
    // Store the new CSRF token in cookies
    Cookies.set('csrftoken', data.csrfToken);
    const csrfToken = Cookies.get('csrftoken');
    if (!csrfToken) {
      console.error('CSRF could not be set');
    }
    return csrfToken;
  }
  return null;
};

// Initiates password reset process for a given email
export const requestPasswordReset = async (email) => {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch('http://127.0.0.1:8000/api/password-reset/', {
    credentials: 'include',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send password reset email');
  }
  return data.message;
};

// Changes user password with old and new password validation
export const changePassword = async (oldPassword, newPassword) => {
  const csrfToken = await fetchCsrfToken();
  const response = await fetch('http://127.0.0.1:8000/api/change-password/', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to change password');
  }

  return { success: true, message: data.message };
};