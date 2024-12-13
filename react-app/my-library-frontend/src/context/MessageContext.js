/*
 * Message Context component
 * Handles the display of messages to the user
 */

import React, { createContext, useState, useContext } from 'react';
import '../styles/messages.css';

// Create a context for messages
const MessageContext = createContext();

// Custom hook to use the message context
export const useMessage = () => {
  return useContext(MessageContext);
};

// Message provider component
export const MessageProvider = ({ children }) => {
  const [message, setMessage] = useState(null);

  const showMessage = (text, type = 'info') => {
    // Set the message and type
    setMessage({ text, type });
    // Clear the message after 4 seconds
    const timeoutId = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timeoutId);
  };

  return (
    <MessageContext.Provider value={showMessage}>
      {children}
      {message && (
        <div className={`message-container message-${message.type}`}>
          {message.text}
        </div>
      )}
    </MessageContext.Provider>
  );
};
