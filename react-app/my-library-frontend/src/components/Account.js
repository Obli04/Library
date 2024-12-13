/*
 * Account Page component
 * Handles change password functionality
 * Displays borrowed and wishlist books
 */


import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/userContext';
import { useMessage } from '../context/MessageContext';
import PasswordChangeModal from './PasswordChangeModal';
import '../styles/account.css';
import { fetchCsrfToken } from '../utils/authUtils';
import { AccountBookCardSkeleton, BookCardSkeleton } from './Skeleton';
import LoadingDots from './LoadingDots';

function Account() {
  const { currentUser } = useUser(); //Get user from context
  const showMessage = useMessage(); //Function to show messages
  const [borrowedBooks, setBorrowedBooks] = useState([]); //State to store borrowed books
  const [wishlistBooks, setWishlistBooks] = useState([]); //State to store wishlist books
  const [activeTab, setActiveTab] = useState('borrowed'); //Track which tab is active (borrowed or wishlist)
  const [showPasswordModal, setShowPasswordModal] = useState(false); //Control the visibility of the password change modal
  const [isLoadingBorrowed, setIsLoadingBorrowed] = useState(false); //Loading the borrowed books
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false); //Loading the wishlist books
  const [removingIsbn, setRemovingIsbn] = useState(null); //Track which books are being removed
  const [hasFetchedBorrowed, setHasFetchedBorrowed] = useState(false); //Track if the borrowed books have been fetched
  const [hasFetchedWishlist, setHasFetchedWishlist] = useState(false); //Track if the wishlist books have been fetched

  // Fetch borrowed books
  const fetchBorrowedBooks = useCallback(async () => {
    if (hasFetchedBorrowed) return; // Prevent fetching if already fetched
    setIsLoadingBorrowed(true);
    const response = await fetch('http://127.0.0.1:8000/api/user-borrowed-books/', {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Failed to fetch borrowed books');
    }
    const data = await response.json();
    setBorrowedBooks(data); // Update state with fetched data
    setHasFetchedBorrowed(true); // Mark as fetched
    setIsLoadingBorrowed(false);
  }, [hasFetchedBorrowed]);

  // Fetch wishlisted books
  const fetchWishlistBooks = useCallback(async () => {
    if (hasFetchedWishlist) return; // Prevent fetching if already fetched
    setIsLoadingWishlist(true);
    const response = await fetch('http://127.0.0.1:8000/api/wishlist/', {
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Failed to fetch wishlist');
    }
    const data = await response.json();
    const uniqueWishlist = Array.from(new Set(data.wishlist.map(item => item.isbn)))
        .map(isbn => {
          const book = data.wishlist.find(item => item.isbn === isbn);
          return {
            isbn: book.isbn,
            title: book.title,
            cover: book.cover
          };
        });
      setWishlistBooks(uniqueWishlist);
    setHasFetchedWishlist(true); // Mark as fetched
    setIsLoadingWishlist(false);
  }, [hasFetchedWishlist]);

  // Effect when changing tabs
  useEffect(() => {
    if (activeTab === 'borrowed' && !hasFetchedBorrowed) {
      fetchBorrowedBooks();
    } else if (activeTab === 'wishlist' && !hasFetchedWishlist) {
      fetchWishlistBooks();
    }
  }, [activeTab, fetchBorrowedBooks, fetchWishlistBooks, hasFetchedBorrowed, hasFetchedWishlist]);

  // Function to remove a book from the wishlist
  const removeFromWishlist = async (isbn) => {
    setRemovingIsbn(isbn); // Track the book being removed
    const csrftoken = await fetchCsrfToken(); // Get CSRF token for request
    const response = await fetch(`http://127.0.0.1:8000/api/wishlist/${isbn}/`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
          'X-CSRFToken': csrftoken
        }
      });
    if (!response.ok) {
      console.error('Failed to remove from wishlist');
      return;
    }
    // Update state to remove the book from the wishlist
    setWishlistBooks(current => current.filter(book => book.isbn !== isbn));
    showMessage('Removed from wishlist', 'info'); // Show success message
    setRemovingIsbn(null); // Reset removing state
  };

  // Function to open the password change modal
  const handlePasswordChange = () => {
    setShowPasswordModal(true);
  };

  // Function to close the password change modal
  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
  };

  // Function to handle tab changes
  const handleTabChange = (newTab) => {
    if (newTab !== activeTab) {
      setActiveTab(newTab); //Set the active tab
    }
  };

  return (
    <div className="account-container">
      <div className="account-header">
        <h1>Welcome, {currentUser?.firstName} {currentUser?.lastName}!</h1>
        <button 
          className="change-password-btn"
          onClick={handlePasswordChange}
        >
          Change Password
        </button>
      </div>

      <div className="account-tabs">
        <button 
          className={`tab-btn ${activeTab === 'borrowed' ? 'active' : ''}`}
          onClick={() => handleTabChange('borrowed')}
        >
          Borrowed Books
        </button>
        <button 
          className={`tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
          onClick={() => handleTabChange('wishlist')}
        >
          Wishlist
        </button>
      </div>

      <div className="books-container">
        {activeTab === 'borrowed' ? (
          isLoadingBorrowed ? (
            <div className="skeleton-flex-container">
              {Array(6).fill(0).map((_, i) => (
                <div className="skeleton-flex-item" key={i}>
                  <AccountBookCardSkeleton />
                </div>
              ))}
            </div>
          ) : borrowedBooks.length > 0 ? (
            <div className="books-flex-container">
              {borrowedBooks.map(book => (
                <div className="book-flex-item" key={book.isbn}>
                  <div className="book-card">
                    <img src={book.cover || '/default-book.png'} alt={book.title} className="book-cover"/>
                    <div className="book-info">
                      <h3>{book.title}</h3>
                      <p>Borrowed on: {new Date(book.borrowed_on).toLocaleDateString()}</p>
                      <p>Return by: {new Date(book.return_on).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-books">No borrowed books</p>
          )
        ) : (
          isLoadingWishlist ? (
            <div className="books-flex-container">
              {Array(6).fill(0).map((_, i) => (
                <div className="book-flex-item" key={i}>
                  <BookCardSkeleton />
                </div>
              ))}
            </div>
          ) : wishlistBooks.length > 0 ? (
            <div className="books-flex-container">
              {wishlistBooks.map(book => (
                <div className="book-flex-item-wishlist" key={book.isbn}>
                  <div className="book-card-wishlist">
                    <img 
                      src={book.cover} 
                      alt={book.title} 
                      className="book-cover-wishlist"
                    />
                    <div className="book-info">
                      <h3>{book.title}</h3>
                      <button 
                        className="remove-wishlist-btn"
                        onClick={() => removeFromWishlist(book.isbn)}
                        disabled={removingIsbn === book.isbn}
                      >
                        {removingIsbn === book.isbn ? (
                          <span>
                            Removing<LoadingDots />
                          </span>
                        ) : (
                          'Remove from Wishlist'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-books">No books in wishlist</p>
          )
        )}
      </div>

      <PasswordChangeModal 
        isOpen={showPasswordModal}
        onClose={handlePasswordModalClose}
      />
    </div>
  );
}

export default Account;