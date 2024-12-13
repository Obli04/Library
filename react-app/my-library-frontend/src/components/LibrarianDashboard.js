/*
 * Librarian Dashboard component
 * Displays all other components for librarian functionality
 */

import React, { useState, useEffect } from 'react';
import { useMessage } from '../context/MessageContext';
import BorrowedBooksTable from './BorrowedBooksTable';
import EditBookModal from './EditBookModal';
import AddBookModal from './AddBookModal';
import ActionCard from './ActionCard';
import '../styles/LibrarianDashboard.css'; // Import the CSS file

function LibrarianDashboard() {
  const showMessage = useMessage(); // Hook to display messages
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false); // State to control the visibility of the EditBookModal
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false); // State to control the visibility of the AddBookModal
  const [borrowedBooks, setBorrowedBooks] = useState(null); // State to store the list of borrowed books
  const [isLoading, setIsLoading] = useState(true); // State to manage loading status

  useEffect(() => {
    fetchBorrowedBooks(); // Fetch borrowed books when the component mounts
  }, []);

  const fetchBorrowedBooks = async () => {
    setIsLoading(true); // Set loading state to true while fetching data
    try {
      const response = await fetch('http://127.0.0.1:8000/api/borrowed-books/', {
        credentials: 'include', // Include credentials for authentication
      });
      const data = await response.json();
      setBorrowedBooks(data); // Update state with fetched data
    } catch (error) {
      console.error('Error fetching borrowed books:', error); // Log any errors
    } finally {
      setIsLoading(false); // Set loading state to false after fetching
    }
  };

  const handleReturnBook = () => {
    fetchBorrowedBooks(); // Refresh the list of borrowed books
    showMessage('Book returned successfully.', 'success'); // Show success message
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Librarian Dashboard</h1>

      <div className="action-cards-container">
        <ActionCard
          title="Edit Books"
          description="Edit or delete existing books"
          onClick={() => setIsSearchModalOpen(true)} // Open the EditBookModal
        />
        <ActionCard
          title="Add New Book"
          description="Add a new book to the library"
          onClick={() => setIsAddBookModalOpen(true)} // Open the AddBookModal
        />
      </div>

      <div className="borrowed-books-container">
        <BorrowedBooksTable 
          borrowedBooks={borrowedBooks}
          onReturnBook={handleReturnBook}
          isLoading={isLoading}
        />
      </div>

      <EditBookModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      <AddBookModal
        isOpen={isAddBookModalOpen}
        onClose={() => setIsAddBookModalOpen(false)}
        onAdd={(result) => {
          fetchBorrowedBooks();
          showMessage(result.message, 'success');
        }}
      />
    </div>
  );
}

export default LibrarianDashboard;