/*
 * Password Change Modal Component
 * Handles password change functionality
 */

import React, { useState } from 'react';
import Modal from 'react-modal';
import { useMessage } from '../context/MessageContext';
import { useUser } from '../context/userContext';
import { fetchCsrfToken, logout } from '../utils/authUtils';
import { useNavigate } from 'react-router-dom';
import '../styles/AuthModal.css';
import LoadingDots from './LoadingDots';

function PasswordChangeModal({ isOpen, onClose }) {
  const showMessage = useMessage(); //Message context
  const { setCurrentUser } = useUser(); //User context
  const navigate = useNavigate(); //Navigation hook
  const [oldPassword, setOldPassword] = useState(''); //Old password
  const [newPassword, setNewPassword] = useState(''); //New password
  const [confirmPassword, setConfirmPassword] = useState(''); //Confirm new password
  const [errors, setErrors] = useState([]); //Error messages
  const [isSubmitting, setIsSubmitting] = useState(false); //Submission state

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (newPassword !== confirmPassword) { //If new password and confirmation don't match then set error
      setErrors(["New passwords don't match"]);
      setIsSubmitting(false);
      return;
    }
    const csrfToken = await fetchCsrfToken(); //Fetch CSRF token
    const response = await fetch('http://127.0.0.1:8000/api/account/change_password/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
      }),
    });
    const data = await response.json();

    if (response.ok) { //If response is ok then show success message and log out user
      showMessage('Password changed successfully! Please log in again.', 'success');
      onClose();
      await logout(setCurrentUser);
      navigate('/', { 
        replace: true,
        state: { message: 'Please log in with your new password' }
      });
    } 
    else {
      if (data.error) setErrors([data.error]); //If password has errors then show them.
      else setErrors(['Failed to change password']);
    }
    setIsSubmitting(false);
  };

  // Function to handle modal close
  const handleClose = () => {
    setOldPassword(''); // Reset old password
    setNewPassword(''); // Reset new password
    setConfirmPassword(''); // Reset password confirmation
    setErrors([]); // Clear errors
    onClose(); // Close modal
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      className="auth-modal"
      overlayClassName="auth-modal-overlay"
    >
      <h2>Change Password</h2>
      <form onSubmit={handleSubmit}>
        {/* Display error messages if any */}
        {errors.length > 0 && (
          <div className="message error">
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}
        
        {/* Input field for current password */}
        <div className="form-field">
          <label htmlFor="currentPassword">Current Password</label>
          <input
            type="password"
            id="currentPassword"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Enter your current password"
            required
          />
        </div>
        
        {/* Input field for new password */}
        <div className="form-field">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter a new password"
            required
          />
        </div>
        
        {/* Input field for confirming new password */}
        <div className="form-field">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter the new password"
            required
          />
        </div>
        
        {/* Buttons for submitting form or cancelling */}
        <div className="modal-buttons">
          <button 
            type="submit" 
            className="generalbutton"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>Changing<LoadingDots /></>
            ) : (
              'Change Password'
            )}
          </button>
          <button 
            type="button" 
            className="generalbutton" 
            onClick={handleClose}
            style={{ backgroundColor: '#6c757d' }}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default PasswordChangeModal;