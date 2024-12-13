import React from 'react';
import { UserProvider } from './context/userContext';
import { MessageProvider } from './context/MessageContext';
import { Routes, Route } from 'react-router-dom';
import { PasswordResetConfirm } from './components/PasswordReset';
import AppContext from './context/AppContext';
import LibrarianDashboard from './components/LibrarianDashboard';
import UserAccount from './components/Account';
import './styles/App.css';

function App() {
  return (
    <div className="app-container"> {/* Main content container */}
      <UserProvider> {/* Context provider for user state. */}
        <MessageProvider> {/* Provides message throughout the whole app state.*/}
          <Routes> {/* Defines the different routes in the app.*/}
            <Route path="/reset-password" element={<PasswordResetConfirm />} /> {/* Route for password reset functionality */}
            <Route element={<AppContext />}> {/* Wraps routes that need shared app context */}
              <Route path="/"/> {/* Home route */}
              <Route path="/librarian" element={<LibrarianDashboard />} /> {/* Librarian dashboard route: Only accessible by staff */}
              <Route path="/account" element={<UserAccount />} /> {/* User account route */}
            </Route>
          </Routes>
        </MessageProvider>
      </UserProvider>
    </div>
  );
}

export default App;