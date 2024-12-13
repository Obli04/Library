/*
 * Navbar component
 * Displays the navbar with navigation and authentication/logout buttons
 */


import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/userContext';
import { useMessage } from '../context/MessageContext';
import { logout } from '../utils/authUtils';
import '../styles/Navbar.css';
import LoadingDots from './LoadingDots';

function Navbar({ onLoginClick, onRegisterClick, onLogoutClick, isLoggedIn, setIsLoggedIn }) {
  const { currentUser, setCurrentUser } = useUser(); // User context
  const showMessage = useMessage(); // Message context
  const navigate = useNavigate(); // Navigation hook
  const location = useLocation(); // Location hook
  const isStaff = currentUser?.is_staff === true; // Determine if the current user is a staff member
  const [isNavVisible, setIsNavVisible] = useState(false); // State to manage visibility of the navigation menu

  const toggleNavVisibility = () => {
    setIsNavVisible(!isNavVisible); //Toggle visibility of navbar
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false); // State to manage logout process

  const handleLogout = async () => { // Function to handle logout
    setIsLoggingOut(true);
    const success = await logout(setCurrentUser);
    if (success) {
      // Clear user-related data from local storage
      localStorage.removeItem('currentUser');
      localStorage.removeItem('isStaff');
      localStorage.removeItem('isLoggedIn');

      setIsLoggedIn(false); // Not logged in anymore
      onLogoutClick();
      showMessage('Logout successful!', 'success');
    } 
    else {
      showMessage('Error during logout.', 'error');
    }
    setIsLoggingOut(false); // Reset logging out state
  };

  const isActive = (path) => location.pathname === path; // Function to check if a given path is the current active path

  const handleNavClick = (action) => { // Function to handle navigation button clicks
    action();
    setIsNavVisible(false);
  };

  return (
    <nav className="navbar">
      {/* Button to toggle navigation menu */}
      <button className="nav-toggle" onClick={toggleNavVisibility}>
        ☰
      </button>
      
      {/* Container for navigation links */}
      <div className={`nav-container nav-links ${isNavVisible ? 'visible' : ''}`}>
        <button 
          className={`nav-button ${isActive('/') ? 'active' : ''}`} 
          onClick={() => handleNavClick(() => navigate('/'))}
          style={{ display: 'block' }}
        >
          Home
        </button>
        {isStaff && (
          <button 
            className={`nav-button ${isActive('/librarian') ? 'active' : ''}`}
            onClick={() => handleNavClick(() => navigate('/librarian'))}
          >
            Librarian
          </button>
        )}
        {isLoggedIn && (
          <button 
            className={`nav-button ${isActive('/account') ? 'active' : ''}`}
            onClick={() => handleNavClick(() => navigate('/account'))}
          >
            Account
          </button>
        )}
      </div>

      {/* Container for authentication buttons */}
      <div className="nav-container auth-buttons">
        {isLoggedIn ? (
          <button className="auth-button" onClick={() => handleNavClick(handleLogout)} disabled={isLoggingOut}>
            {isLoggingOut ? (
              <>Logging out<LoadingDots /></>
            ) : (
              'Logout'
            )}
          </button>
        ) : (
          <>
            <button className="auth-button" onClick={() => handleNavClick(onLoginClick)}>
              Login
            </button>
            <button className="auth-button" onClick={() => handleNavClick(onRegisterClick)}>
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar; 