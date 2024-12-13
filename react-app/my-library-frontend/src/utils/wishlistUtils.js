/*
 * Wishlist Utils component
 * Handles the wishlist functionality including:
 * - Fetching user's wishlist
 * - Converting wishlist data to a Set for efficient lookup
 */

import { fetchCsrfToken } from './authUtils';

// Fetches the user's wishlist from the backend
// Returns a Set of ISBN numbers for easy checking if a book is wishlisted
export const fetchWishlist = async () => {
  // Check if user is logged in
  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) {
    return new Set(); // Return empty set if no user is logged in
  }

  // Get CSRF token for authentication
  const csrfToken = await fetchCsrfToken();
  
  // Fetch wishlist data from the backend
  const response = await fetch('http://127.0.0.1:8000/api/wishlist/', {
      credentials: 'include',
      headers: {
        'X-CSRFToken': csrfToken,
      },
    });
    
  // Return empty set if request fails
  if (!response.ok) {
    return new Set();
  }
    
  // Convert wishlist data to a Set of ISBNs for efficient lookup
  const data = await response.json();
  return new Set(data.wishlist.map(item => item.isbn));
};
