/*
 * User Context component
 * Handles the user data and local Storage
 */

import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext(); // Creates a context object.

// UserProvider component to wrap parts of the app that need access to user data
export function UserProvider({ children }) {
  // State to hold the current user
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem('currentUser'); //Retrieve storedUser from localStorage
    return storedUser ? JSON.parse(storedUser) : null; //Parse the stored JSON data or return null if no data is found
  });

  // Function to update the user state and localStorage
  const setUser = (user) => {
    if (user) {
      // Store user data in localStorage
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('isStaff', user.is_staff ? 'true' : 'false');
      // Update the currentUser state
      setCurrentUser(user);
    }
    else {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('isStaff');
        // Clear the currentUser state
        setCurrentUser(null);
      }
    }

  // Context value to provide to app.js
  const value = {
    currentUser,
    setCurrentUser: setUser
  };

  // Return the context provider with the value
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Custom hook to use the UserContext
export function useUser() {
  return useContext(UserContext); //return the context value
}