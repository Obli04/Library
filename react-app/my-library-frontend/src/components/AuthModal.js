/* Authentication Modal Component
 * Handles user login, registration, and password reset functionality
 * Also handles resending verification emails
*/

import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import Cookies from 'js-cookie';
import { useMessage } from '../context/MessageContext';
import '../styles/AuthModal.css';
import { requestPasswordReset } from '../utils/authUtils';
import { useUser } from '../context/userContext';

const AuthModal = ({ isOpen, onRequestClose, isLogin, setIsLogin }) => {
  const { setCurrentUser } = useUser(); // User context
  const showMessage = useMessage(); // Message context

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
  }); // State to manage form data

  const [isPasswordReset, setIsPasswordReset] = useState(false); // Track if the password reset form is active
  const [isSubmitting, setIsSubmitting] = useState(false); // Track if a form submission is in progress
  const [isLoading, setIsLoading] = useState(false); // Track if a request is being processed

  // Reset form data when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        email: '',
      });
    }
  }, [isOpen]);

  // Reset form data and password reset state when login/register toggle changes
  useEffect(() => {
    setFormData({
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      email: '',
    });
  }, [isLogin]);

  // Reset password reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsPasswordReset(false);
    }
  }, [isOpen]);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setIsLoading(true); // Indicate loading state

    if (isPasswordReset) {
      setIsSubmitting(true);
      const message = await requestPasswordReset(formData.email);
      showMessage(message, 'success');
      setTimeout(() => {
        setIsPasswordReset(false);
        setFormData(prev => ({ ...prev, email: '' })); // Clear email field after reset
      }, 2000);
      setIsSubmitting(false);
      setIsLoading(false);    //Just making sure each state is reset
      return;
    }

    if (isLogin) { // Handle login logic
      const response = await fetch('http://127.0.0.1:8000/api/login/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': Cookies.get('csrftoken'),
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();
      if (response.ok && data.user) {
        const userWithStaff = {
          ...data.user,
          is_staff: Boolean(data.is_staff) // pass is_staff as a boolean
        };
        setCurrentUser(userWithStaff); // update logged user
        showMessage('Login successful!', 'success');
        onRequestClose(); // Close the modal
      } 
      else {
        if (data.error === "You have to verify your email.") { // Handle email verification prompt
          showMessage(
            <>
              {data.error} <button onClick={() => resendVerificationEmail(data.uid)} className="verification-link" style={{ background: 'none', border: 'none', color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}>Resend Verification Email</button>
            </>,
            'error'
          );
        } 
        else {
          showMessage(data.error || 'Login failed', 'error'); // Show error message
        }
      }
      setIsLoading(false);
    } 

    else { // Handle registration logic
      const sendForm = JSON.stringify({
        username: formData.username,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      });
      const response = await fetch('http://127.0.0.1:8000/api/register/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': Cookies.get('csrftoken'),
        },
        body: sendForm,
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.error || data.message || 'Authentication failed', 'error');
      } else {
        showMessage('Registration successful! Please check your email to verify your account.', 'success');
        setIsLogin(true); // Switch to login mode after successful registration
      }
      setIsLoading(false); //We are not loading anything
    }
  };

  // Function to resend verification email
  const resendVerificationEmail = async (uid) => {
    const response = await fetch(`http://127.0.0.1:8000/api/resend-verification-email/${uid}/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': Cookies.get('csrftoken'),
      },
      body: JSON.stringify({ email: formData.email }),
    });
    if (response.ok) {
      showMessage('Verification email sent. Please check your inbox.', 'success');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel={isPasswordReset ? "Reset Password" : (isLogin ? "Login" : "Register")}
      className="auth-modal"
      overlayClassName="auth-modal-overlay"
    >
      <h2>{isPasswordReset ? "Reset Password" : (isLogin ? "Login" : "Register")}</h2>
      <form onSubmit={handleSubmit}>
        {isPasswordReset ? (
          <>
            <p className="reset-password-text">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div className="form-field">
              <label htmlFor="reset-email">Email</label>
              <input
                id="reset-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <button 
              type="submit" 
              className="generalbutton submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p className="back-to-login">
              <button onClick={() => setIsPasswordReset(false)} className="toggle-link">
                Back to Login
              </button>
            </p>
          </>
        ) : (
          <>
            {!isLogin && (
              <>
                <div className="form-field">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}
            <div className="form-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <button 
              type="submit" 
              className="generalbutton submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
            </button>
            <p className="toggle-auth">
              {isLogin ? (
                <>
                  Don't have an account? <button onClick={() => setIsLogin(false)} className="toggle-link">Register</button>
                </>
              ) : (
                <>
                  Already have an account? <button onClick={() => setIsLogin(true)} className="toggle-link">Login</button>
                </>
              )}
            </p>
            <p className="forgot-password">
              <button onClick={() => setIsPasswordReset(true)} className="toggle-link">Forgot Password?</button>
            </p>
          </>
        )}
      </form>
    </Modal>
  );
};

export default AuthModal;
