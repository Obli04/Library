/*
 * Add Book Modal Component
 * Handles adding a new book
 */


import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import CreatableSelect from 'react-select/creatable';
import { useMessage } from '../context/MessageContext';
import { fetchCsrfToken } from '../utils/authUtils';
import LoadingDots from './LoadingDots';

const AddBookModal = ({ isOpen, onClose, onAdd }) => {
  const initialBookData = { // Empty book
    title: '',
    authors: [],
    genres: [],
    year: '',
    isbn: '',
    copies: 1,
    cover: null
  };

  const showMessage = useMessage(); // Hook for displaying messages
  const [bookData, setBookData] = useState(initialBookData); // Book Data
  const [allAuthors, setAllAuthors] = useState([]); // All Authors
  const [allGenres, setAllGenres] = useState([]); // All Genres
  const [shouldClose, setShouldClose] = useState(true); // Close Modal
  const [isSubmitting, setIsSubmitting] = useState(false); // Submission Status

  // Fetch authors and genres
  useEffect(() => {
    const fetchAuthors = async () => {
      const response = await fetch('http://127.0.0.1:8000/api/authors/');
      const data = await response.json();
      setAllAuthors(data.map(author => ({ label: author.name, value: author.name }))); //Map authors 
      if(!response.ok) console.error('Error fetching authors:', response.statusText);
    };


    const fetchGenres = async () => {
      const response = await fetch('http://127.0.0.1:8000/api/genres/');
      const data = await response.json();
      setAllGenres(data.map(genre => ({ label: genre.name, value: genre.name }))); //Map genres
      if(!response.ok) console.error('Error fetching genres:', response.statusText);
    };

    fetchAuthors();
    fetchGenres();
  }, []);

  // Add new book
  const addBook = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Get a fresh CSRF token for each submission
    const csrfToken = await fetchCsrfToken();
    
    const formData = new FormData();
    formData.append('title', bookData.title);
    formData.append('year', bookData.year);
    formData.append('isbn', bookData.isbn);
    formData.append('copies', bookData.copies);
    
    // Only append cover if it exists
    if (bookData.cover) {
      formData.append('cover', bookData.cover);
    }

    formData.append('authors', JSON.stringify(bookData.authors.map(author => author.value)));
    formData.append('genres', JSON.stringify(bookData.genres.map(genre => genre.value)));

    const response = await fetch('http://127.0.0.1:8000/api/add-book/', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-CSRFToken': csrfToken,
      },
      body: formData,
    });
    
    const result = await response.json();
    if (response.ok) {
      showMessage(result.message, 'success');
      if (onAdd) onAdd(result);
      
      if (shouldClose) {
        setTimeout(() => {
          onClose();
          setBookData(initialBookData); // Reset form data
        }, 500);
      } else {
        setBookData(initialBookData); // Reset form data
      }
    } else {
      // Add error handling
      showMessage(result.error || 'Failed to add book', 'error');
    }
    setIsSubmitting(false);
  };

  const customStyles = {
    content: {
      backgroundColor: '#f5f5dc',
      width: '50%',
      height: 'auto',
      maxHeight: '80%',
      margin: 'auto',
      top: '10%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      transform: 'translate(-50%, 0)',
      padding: '20px', 
    },
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Add New Book"
      style={customStyles}
    >
      <h2>Add New Book</h2>
      <form onSubmit={addBook}>
        <div>
          <label>Title:</label>
          <input
            type="text"
            value={bookData.title}
            onChange={(e) => setBookData({...bookData, title: e.target.value})}
            placeholder="e.g., The Great Gatsby"
            required
          />
        </div>
        <div>
          <label>Authors:</label>
          <CreatableSelect
            isMulti
            options={allAuthors}
            value={bookData.authors}
            onChange={(selected) => setBookData({...bookData, authors: selected})}
            placeholder="e.g., F. Scott Fitzgerald, Ernest Hemingway..."
            styles={{
              control: (base) => ({ 
                ...base, 
                backgroundColor: '#FAFAE6',
                color: '#363B35',
              }),
              input: (base) => ({ ...base, color: '#363B35' }),
              singleValue: (base) => ({ ...base, color: '#363B35' }),
              multiValue: (base) => ({ 
                ...base, 
                backgroundColor: '#f5f5dc',
                color: '#363B35',
                border: '0.1px solid #D3D3D3',
              }),
              multiValueLabel: (base) => ({ ...base, color: '#363B35' }),
              menu: (base) => ({
                ...base,
                backgroundColor: '#f5f5dc',
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused ? '#FAFAE6' : '#f5f5dc',
                color: '#363B35',
              }),
            }}
          />
        </div>
        <div>
          <label>Genres:</label>
          <CreatableSelect
            isMulti
            options={allGenres}
            value={bookData.genres}
            onChange={(selected) => setBookData({...bookData, genres: selected})}
            placeholder="e.g., Fiction, Gothic, Satire..."
            styles={{
              control: (base) => ({ 
                ...base, 
                backgroundColor: '#FAFAE6',
                color: '#363B35',
              }),
              input: (base) => ({ ...base, color: '#363B35' }),
              singleValue: (base) => ({ ...base, color: '#363B35' }),
              multiValue: (base) => ({ 
                ...base, 
                backgroundColor: '#f5f5dc',
                color: '#363B35',
                border: '0.1px solid #D3D3D3',
              }),
              multiValueLabel: (base) => ({ ...base, color: '#363B35' }),
              menu: (base) => ({
                ...base,
                backgroundColor: '#f5f5dc',
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused ? '#FAFAE6' : '#f5f5dc',
                color: '#363B35',
              }),
            }}
          />
        </div>
        <div>
          <label>Year:</label>
          <input
            type="number"
            value={bookData.year}
            onChange={(e) => setBookData({...bookData, year: e.target.value})}
            placeholder="e.g., 1925"
          />
        </div>
        <div>
          <label>ISBN:</label>
          <input
            type="text"
            value={bookData.isbn}
            onChange={(e) => setBookData({...bookData, isbn: e.target.value})}
            placeholder="e.g., 9780743273565"
            required
          />
        </div>
        <div>
          <label>Number of Copies:</label>
          <input
            type="number"
            value={bookData.copies}
            onChange={(e) => setBookData({...bookData, copies: parseInt(e.target.value)})}
            min="1"
            placeholder="e.g., 5"
            required
          />
        </div>
        <div>
          <label>Cover:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setBookData({...bookData, cover: e.target.files[0]})}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            className="generalbutton"
            type="submit"
            disabled={isSubmitting}
            style={{ width: '48%' }}
            onClick={() => setShouldClose(true)}
          >
            {isSubmitting ? (
              <>Adding<LoadingDots /></>
            ) : (
              'Add Book'
            )}
          </button>
          <button
            className="generalbutton"
            type="submit"
            disabled={isSubmitting}
            style={{ width: '48%' }}
            onClick={() => setShouldClose(false)}
          >
            {isSubmitting ? (
              <>Adding<LoadingDots /></>
            ) : (
              'Save & Add Another'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddBookModal;