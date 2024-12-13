import React, { useState } from 'react';
import Cookies from 'js-cookie';
import { useMessage } from '../context/MessageContext';
import { TableRowSkeleton } from './Skeleton';
import LoadingDots from './LoadingDots';
import '../styles/BorrowedBooks.css';

const BorrowedBooksTable = ({ borrowedBooks, onReturnBook, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState(''); // State for search query
  const [showOnlyPastDue, setShowOnlyPastDue] = useState(false); // State to filter past due books
  const [returningBooks, setReturningBooks] = useState(new Set()); // State to track books being returned
  const showMessage = useMessage(); // Hook for displaying messages

  // Function to check if a book's return date is past due
  const isDatePastDue = (returnDate) => {
    const today = new Date();
    const dueDate = new Date(returnDate);
    return today > dueDate;
  };

  // Function to truncate book titles for display
  const truncateTitle = (title, maxLength = 25) => {
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
  };

  // Function to truncate author names for display
  const truncateAuthors = (authors, maxLengthAuthors = 16) => {
    const authorsString = authors.map(author => author.name).join(', ');
    return authorsString.length > maxLengthAuthors ? authorsString.substring(0, maxLengthAuthors) + '...' : authorsString;
  };

  // Function to handle returning a book
  const handleReturnBook = async (isbn, username, quantity) => {
    const numQuantity = Number(quantity);
    const borrowedQuantity = borrowedBooks.find(
      book => book.book.isbn === isbn && book.user.username === username
    ).number;

    // Check if the return quantity exceeds the borrowed quantity
    if (numQuantity > borrowedQuantity) {
      showMessage('Return quantity exceeds borrowed quantity.', 'error');
      return;
    }

    // Add the book to the set of books being returned
    setReturningBooks(prev => new Set(prev).add(`${isbn}-${username}`));
    const response = await fetch(`http://127.0.0.1:8000/api/return-book/${isbn}/${username}/`, {
      credentials: 'include',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': Cookies.get('csrftoken'),
      },
      body: JSON.stringify({ quantity }),
    });

    const data = await response.json();
    if (response.ok) {
      onReturnBook(); // Refresh the list of borrowed books
      showMessage('Book returned successfully.', 'success'); // Show success message
    }
    else {
      showMessage(data.error || 'Error returning book.', 'error'); // Show error message
    }
    setReturningBooks(prev => {
      const newSet = new Set(prev);
      newSet.delete(`${isbn}-${username}`);
      return newSet;
    });
  };

  // Filter and sort the list of borrowed books
  const filteredBooks = borrowedBooks ? borrowedBooks
    .filter(book => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = book.book.title.toLowerCase().includes(query) ||
        book.book.isbn.toLowerCase().includes(query) ||
        book.book.authors.some(author => author.name.toLowerCase().includes(query)) ||
        book.user.username.toLowerCase().includes(query);

      if (showOnlyPastDue) {
        return matchesSearch && isDatePastDue(book.return_on);
      }
      return matchesSearch;
    })
    .sort((a, b) => new Date(a.return_on) - new Date(b.return_on))
    : [];

  return (
    <div>
      <div className="table-header">
        <div className="search-container">
          <h2 className="title">Borrowed Books</h2>
          <div className="filter-container">
            <input
              type="text"
              placeholder="Search borrowed books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <div className="checkbox-container">
              <input
                type="checkbox"
                id="pastDueFilter"
                checked={showOnlyPastDue}
                onChange={(e) => setShowOnlyPastDue(e.target.checked)}
                className="checkbox"
              />
              <label 
                htmlFor="pastDueFilter" 
                className="checkbox-label"
              >
                Show only past due
              </label>
            </div>
          </div>
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th className="cell">Title</th>
            <th className="cell">Author</th>
            <th className="cell">Booked By</th>
            <th className="cell">Number</th>
            <th className="cell">Booking Date</th>
            <th className="cell">Maximum Return Date</th>
            <th className="cell">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            // Display skeleton rows while loading
            Array(5).fill(0).map((_, i) => (
              <TableRowSkeleton key={i} />
            ))
          ) : (
            // Display filtered books
            filteredBooks.map((book) => (
              <tr 
                key={`${book.book.isbn}-${book.user.username}`} 
                className={isDatePastDue(book.return_on) ? 'past-due-row' : ''} // Highlight past due books
              >
                <td className="cell" title={book.book.title}>
                  {truncateTitle(book.book.title)}
                </td>
                <td className="cell" title={book.book.authors.map(author => author.name).join(', ')}>
                  {truncateAuthors(book.book.authors)}
                </td>
                <td className="cell">{book.user.username}</td>
                <td className="cell">{book.number}</td>
                <td className="cell">{book.borrowed_on}</td>
                <td className="cell">{book.return_on}</td>
                <td className="cell">
                  <div className="action-container">
                    <input 
                      type="number" 
                      min="1" 
                      max={book.number} 
                      defaultValue="1"
                      onChange={(e) => book.returnQuantity = e.target.value}
                      className="quantity-input"
                    />
                    <button 
                      className="generalbutton" 
                      style={{marginTop: '0px'}} 
                      disabled={returningBooks.has(`${book.book.isbn}-${book.user.username}`)} // Disable button if book is being returned
                      onClick={() => handleReturnBook(book.book.isbn, book.user.username, book.returnQuantity)} // Handle return book action
                    >
                      {returningBooks.has(`${book.book.isbn}-${book.user.username}`) ? (
                        <>Returning<LoadingDots /></> // Show loading dots if returning
                      ) : (
                        'Return Book'
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BorrowedBooksTable;