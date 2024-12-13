/*
 * Book List component
 * Displays all books with search and filter functionality
 */

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import CustomModal from './Modal';
import '../styles/BookList.css';
import { useUser } from '../context/userContext';
import { BookCardSkeleton } from './Skeleton';
import { fetchCsrfToken } from '../utils/authUtils';
import { fetchWishlist } from '../utils/wishlistUtils';
import { useMessage } from '../context/MessageContext';

// BookList component definition
function BookList({ openAuthModal, wishlist, setWishlist }) {
  const { currentUser } = useUser(); // Get current user from context
  const showMessage = useMessage(); // Message context
  const [books, setBooks] = useState([]); // List of Books
  const [genres, setGenres] = useState([]); // List of Genres
  const [selectedGenres, setSelectedGenres] = useState([]); // Selected Genres in filter
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal visibility
  const [selectedBook, setSelectedBook] = useState(null); // Selected book for modal
  const [searchQuery, setSearchQuery] = useState(''); // Search query input
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [isModalLoading, setIsModalLoading] = useState(false); // Modal loading state
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false); // Filter available books state

  // useEffect to load wishlist when currentUser changes
  useEffect(() => {
    const loadWishlist = async () => {
      if (currentUser) setWishlist(await fetchWishlist()); // If we have an user then fetch wishlist
      else setWishlist(new Set()); //Empty wishlist if no user is found
    };

    loadWishlist();
  }, [currentUser, setWishlist]);

  useEffect(() => {
    const fetchData = async () => {
        // Fetch books and genres concurrently
        const [booksResponse, genresResponse] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/books/'),
          fetch('http://127.0.0.1:8000/api/genres/')
        ]);

        const [booksData, genresData] = await Promise.all([
          booksResponse.json(),
          genresResponse.json()
        ]);

        setBooks(booksData); // Update books state with fetched data
        setGenres(genresData.map(genre => ({ 
          value: genre.name,
          label: genre.name
        })));
        setIsLoading(false);
    };

    fetchData();
  }, []);

  // Helper function to get author names from bookAuthors array
  const getAuthorNames = (bookAuthors) => {
    if (!bookAuthors || !Array.isArray(bookAuthors)) return '';
    return bookAuthors.map(author => author.name).join(', ');
  };

  // Function to handle clicking on a book card
  const handleBookClick = (book) => {
    setIsModalLoading(true);
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  // Function to handle closing the modal
  const handleRequestClose = () => {
    setIsModalOpen(false);
    setSelectedBook(null);
  };

  // Function to refetch book data based on ISBN
  const refetchBookData = async (isbn) => {
    const response = await fetch(`http://127.0.0.1:8000/api/books/${isbn}/`);
    const updatedBook = await response.json();
    setBooks(prevBooks => 
      prevBooks.map(book => 
        book.isbn === isbn ? { ...book, ...updatedBook } : book
      )
    );
    if (selectedBook && selectedBook.isbn === isbn) {
      setSelectedBook(prevBook => ({ ...prevBook, ...updatedBook }));
    }
  };

  // Function to handle book borrowing action
  const handleBook = async () => {
    const result = await handleBorrowBook(selectedBook.isbn);
    if (!result.error) await refetchBookData(selectedBook.isbn);
  };

  // Function to handle borrowing a book by making a POST request
  const handleBorrowBook = async (isbn) => {
    const csrfToken = await fetchCsrfToken(); // Fetch CSRF token
    const response = await fetch(`http://127.0.0.1:8000/api/borrow/${isbn}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
    });
    const data = await response.json();
    if (data.error) showMessage(data.error, 'error');
    else showMessage(data.message, 'success');
    return data;
  };

  const filteredBooks = books.filter(book => {
    const authorNames = getAuthorNames(book.authors);
    const searchTerm = searchQuery.toLowerCase().trim();
    const matchesSearch = searchTerm === '' || ( // If search term is empty then all books are matched else check if book matches search term
      book.title.toLowerCase().includes(searchTerm) ||
      book.isbn.toLowerCase().includes(searchTerm) ||
      authorNames.toLowerCase().includes(searchTerm)
    );
    // If no genres are selected then all books are matched else check if book matches selected genres
    const matchesGenres = selectedGenres.length === 0 || 
      selectedGenres.every(selectedGenre => 
        book.genres.some(bookGenre => bookGenre.name === selectedGenre.value)
      );

    const isAvailable = !showOnlyAvailable || (book.copies - book.lended > 0);

    return matchesSearch && matchesGenres && isAvailable;
  });

  const handleWishlist = async (isbn) => {
    if (!currentUser) {
      openAuthModal(true);
      return;
    }

    const csrfToken = await fetchCsrfToken();
    const response = await fetch(`http://127.0.0.1:8000/api/wishlist/${isbn}/`, {
      method: wishlist.has(isbn) ? 'DELETE' : 'POST',
      credentials: 'include',
      headers: {
        'X-CSRFToken': csrfToken,
      },
    });
    if (response.ok) setWishlist(await fetchWishlist()); //If we successfully updated the wishlist then fetch the new wishlist
  };

  return (
    <div>
      <div className="introSection">
        <h1 className="title">Welcome to the University Library</h1>
        <p className="description">
          Discover your next favorite book! Our collection includes a wide range of genres, from academic texts to captivating stories.
        </p>
      </div>
      <div className="searchSection">
        <h2>Explore Our Book Collection</h2>
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          alignItems: 'center', 
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            placeholder="Search by ISBN, Author, or Title"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="searchInput"
          />
          <Select
            isMulti
            options={genres}
            value={selectedGenres}
            onChange={setSelectedGenres}
            placeholder="Select Genres"
            styles={{
              container: (base) => ({ ...base, minWidth: '200px', width: 'auto', maxWidth: '350px' }),
              control: (base) => ({ 
                ...base, 
                minHeight: '24px',
                fontSize: '12px',
                backgroundColor: '#FAFAE6',
                color: '#363B35',
                zIndex: 0
              }),
              input: (base) => ({ ...base, color: '#363B35' }),
              singleValue: (base) => ({ ...base, color: '#363B35' }),
              multiValue: (base) => ({ 
                ...base, 
                backgroundColor: '#f5f5dc',
                color: '#363B35',
                zIndex: 1
              }),
              multiValueLabel: (base) => ({ ...base, color: '#363B35' }),
              menu: (base) => ({
                ...base,
                backgroundColor: '#f5f5dc',
                zIndex: 2
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused ? '#FAFAE6' : '#f5f5dc',
                color: '#363B35',
                zIndex: 1
              }),
            }}
          />
          <div className="filterCheckbox">
            <input type="checkbox" id="availableOnly" checked={showOnlyAvailable}
              onChange={(e) => setShowOnlyAvailable(e.target.checked)}
            />
            <label htmlFor="availableOnly">Available only</label>
          </div>
        </div>
      </div>
      <div className="container">
        {isLoading ? (
          <div className="container">
            {Array(50).fill(0).map((_, i) => (
              <div key={i} className="bookCard">
                <BookCardSkeleton />
              </div>
            ))}
          </div>
        ) : (
          filteredBooks.map((book) => (
            <div key={book.isbn} className="bookCard">
              <div className="bookCardContent" onClick={() => handleBookClick(book)}>
                <img src={book.cover} alt={book.title} className="bookImage" />
                <h3 className="bookTitle">{book.title}</h3>
                <div className="bookInfo">
                  <p className="bookCopies">{'Authors: ' + getAuthorNames(book.authors)}</p>
                  <p className="bookCopies">Copies: {book.copies - book.lended}</p>
                </div>
              </div>
              <button style={{ zIndex: 0 }}
                className={`wishlistButton ${wishlist.has(book.isbn) ? 'active' : ''}`}
                onClick={(e) => handleWishlist(book.isbn)}
              >
                <span style={{ fontSize: '20px', zIndex: 1 }}>♥</span>
              </button>
            </div>
          ))
        )}
      </div>

      {selectedBook && (
        <CustomModal
          isOpen={isModalOpen}
          onRequestClose={handleRequestClose}
          contentLabel="Book Details"
          initialBook={selectedBook}
          onBook={handleBook}
          isLoading={isModalLoading}
          openAuthModal={openAuthModal}
          wishlist={wishlist}
          setWishlist={setWishlist}
        />
      )}
    </div>
  );
}

export default BookList;
