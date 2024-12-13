/*
 * Password Reset Confirm component
 * Handles the password reset confirmation page
 */


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCsrfToken } from '../utils/authUtils';
import { useMessage } from '../context/MessageContext';
import LoadingDots from '../components/LoadingDots';

export const PasswordResetConfirm = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();
    const showMessage = useMessage();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const params = new URLSearchParams(window.location.search); //Get URL parameters
    const uid = params.get('uid'); //Get uid parameter
    const token = params.get('token'); //Get token parameter

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const csrfToken = await fetchCsrfToken(); //Fetch CSRF token
        
        if (password !== confirmPassword) { //If passwords don't match then show error message 
            showMessage('Passwords do not match', 'error');
            setIsSubmitting(false);
            return;
        }
        const response = await fetch('http://127.0.0.1:8000/api/password-reset/confirm/', { //Send request to reset password
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({ uid, token, password })
        });
        const data = await response.json();    
        if (response.ok) { //If response is ok then show success message and navigate to home page
            showMessage('Password changed successfully', 'success');
            navigate('/?message=Password changed successfully');
        } 
        else {
            showMessage(data.error, 'error');
        }
        setIsSubmitting(false);
    };

    return (
        <div style={{
            width: '100%',
            height: '100vh',
            backgroundColor: '#265e59',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <div style={{
                width: '450px',
                padding: '20px',
                boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                backgroundColor: '#f5f5dc',
                borderRadius: '8px',
                overflow: 'auto',
                border: '1px solid white',
                color: 'white'
            }}>
                <h2 style={{color: '#265e59'}}>Set New Password</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-field">
                        <label>New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-field">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="generalbutton" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>Resetting<LoadingDots /></>
                        ) : (
                            'Reset Password'
                        )}
                    </button>
                </form>
                {showMessage && <p style={{ color: '#265e59' }}>{showMessage}</p>}
            </div>
        </div>
    );
};