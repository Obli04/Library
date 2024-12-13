/*
 * App Context component
 * Handles the main app content and routing
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from './userContext';
import { useMessage } from './MessageContext';
import AuthModal from '../components/AuthModal';
import Navbar from '../components/Navbar';
import BookList from '../components/BookList';
import LibrarianDashboard from '../components/LibrarianDashboard';
import Account from '../components/Account';
import { logout, fetchCsrfToken } from '../utils/authUtils';
import '../styles/App.css';

function AppContent() {
  const { currentUser, setCurrentUser } = useUser(); //Access the context value
  const showMessage = useMessage(); //Function to show messages from message context
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); //State to control the visibility of the authentication modal
  const [isLogin, setIsLogin] = useState(true); //State to determine if the auth modal is in login mode
  const [wishlist, setWishlist] = useState(new Set()); //State to manage the user's wishlist
  const location = useLocation(); //Hook to access the current location object
  const navigate = useNavigate(); //Hook to navigate between routes

  // Effect to handle URL query parameters for messages
  useEffect(() => {
    //Function to display a message in the URL
    const params = new URLSearchParams(location.search);
    const message = params.get('message'); //
    if (message) {
      showMessage(message, 'info');
      navigate('/', { replace: true });
    }
  }, [location, showMessage, navigate]);

  // Effect to fetch the current user from the API or local storage
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const storedUser = localStorage.getItem('currentUser'); //Get the current user from local storage 
      if (storedUser) {
        return; //If the user is already stored, return
      }
      const response = await fetch('http://127.0.0.1:8000/api/current-user/', {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok && data.user) {
          setCurrentUser(data.user);
      }
      else { //If the user is not logged in, fetch the CSRF token
        fetchCsrfToken();
      }
    };
    
    fetchCurrentUser();
  }, [setCurrentUser]);

  const openAuthModal = (isLoginMode = true) => { //Open the authentication modal
    setIsLogin(isLoginMode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false); //close the authentication modal

  const handleLogout = async () => { //Handle user logout
    const success = await logout(setCurrentUser);
    if (success) {
      setWishlist(new Set());
      showMessage('Logout successful!', 'success');
      navigate('/');
    } else {
      showMessage('Error during logout.', 'error');
    }
  };

  // This return statement is rendering the main content of the application.
  // It includes several components that make up the user interface.

  return (
    <div className="app-container"> {/* Main container for the app's content */}
      <Navbar 
        onLoginClick={() => openAuthModal(true)} // Opens the authentication modal in login mode
        onRegisterClick={() => openAuthModal(false)} // Opens the authentication modal in register mode
        onLogoutClick={handleLogout} // Handles user logout
        isLoggedIn={currentUser !== null} // Checks if a user is logged in
        setIsLoggedIn={setCurrentUser} // Function to update the logged-in state
      />
      
      <Routes> {/* Defines the routes for the application */}
        <Route 
          path="/" 
          element={
            <BookList 
              openAuthModal={openAuthModal}
              wishlist={wishlist}
              setWishlist={setWishlist}
            />
          } 
        />
        <Route 
         // If the user is staff, render the librarian dashboard else redirect to home page
          path="/librarian" 
          element={
            currentUser?.is_staff === true ? ( <LibrarianDashboard /> ) : ( <Navigate to="/"/> )
          } 
        />
        <Route 
          // If the user is logged in in the Account tab then render the account page else redirect to home page
          path="/account" 
          element={
            currentUser ? ( <Account /> ) : ( <Navigate to="/"/> )
          } 
        />
      </Routes>
      
      <AuthModal
        isOpen={isAuthModalOpen}
        onRequestClose={closeAuthModal}
        isLogin={isLogin}
        setIsLogin={setIsLogin}
        setIsLoggedIn={setCurrentUser}
        setWishlist={setWishlist}
      />
    </div>
  );
}

export default AppContent;