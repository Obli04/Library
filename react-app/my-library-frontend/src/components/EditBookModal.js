/*
 * Edit Book Modal component
 * Handles editing a book in all their parts (isbn is read only as its the Primary Key)
 */


import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import { useMessage } from '../context/MessageContext';
import { fetchCsrfToken } from '../utils/authUtils';
import LoadingDots from './LoadingDots';

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '90%', 
    maxWidth: '800px',
    minWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
    backgroundColor: '#f5f5dc',
    border: '2px solid #DEB887',
    borderRadius: '8px',
    padding: '20px',
  },
};

const EditBookModal = ({ isOpen, onClose, onEdit, onDelete }) => {
  const showMessage = useMessage(); //Message context
  const [searchResults, setSearchResults] = useState([]); //Search results  
  const [selectedBook, setSelectedBook] = useState(null); //Selected book
  const [isLoading, setIsLoading] = useState(false); //Loading state
  const [allAuthors, setAllAuthors] = useState([]); //All authors
  const [allGenres, setAllGenres] = useState([]); //All genres
  const [bookData, setBookData] = useState({ //Book data
    title: '',
    authors: [],
    genres: [],
    year: '',
    isbn: '',
    copies: 1,
    cover: null
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); //Delete modal state
  const [isSubmitting, setIsSubmitting] = useState(false); //Submitting state
  const [isDeleting, setIsDeleting] = useState(false); //Deleting state

  // Fetch authors and genres
  useEffect(() => {
    // Promise.all allows us to perform multiple asynchronous operations in parallel and wait for all of them to complete before proceeding
    Promise.all([
      fetch('http://127.0.0.1:8000/api/authors/'),
      fetch('http://127.0.0.1:8000/api/genres/')
    ])
      .then(([authorsRes, genresRes]) => Promise.all([authorsRes.json(), genresRes.json()]))
      .then(([authorsData, genresData]) => {
        setAllAuthors(authorsData.map(author => ({ label: author.name, value: author.name })));
        setAllGenres(genresData.map(genre => ({ label: genre.name, value: genre.name })));
      })
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  const searchBooks = async (query) => {
    if (!query.trim()) {
      setSearchResults([]); //If the query is empty, clear the search results
      return;
    }

    setIsLoading(true); //Set loading state to true
    const response = await fetch('http://127.0.0.1:8000/api/books/');
    const books = await response.json();
    
    const filteredBooks = books.filter(book => { //Filter the books
      const authorNames = book.authors.map(author => author.name).join(', ');
      const searchTerm = query.toLowerCase().trim(); //Convert the query to lowercase and trim it
      return book.title.toLowerCase().includes(searchTerm) || //Check if the title contains the search term
              book.isbn.toLowerCase().includes(searchTerm) || //Check if the isbn contains the search term
              authorNames.toLowerCase().includes(searchTerm); //Check if the author names contain the search term
    });
    
    setSearchResults(filteredBooks.map(book => ({ //Map the filtered books to the search results
      value: book.isbn,
      label: `${book.title} (${book.isbn})`,
      ...book
    })));
    setIsLoading(false); //Set loading state to false
  };

  // Handle book selection
  const handleBookSelect = (selected) => {
    setSelectedBook(selected);
    if (selected) { //If a book is selected
      setBookData({
        title: selected.title,
        authors: selected.authors.map(author => ({ label: author.name, value: author.name })),
        genres: selected.genres.map(genre => ({ label: genre.name, value: genre.name })),
        year: selected.year,
        isbn: selected.isbn,
        copies: selected.copies,
        cover: null // Keep existing cover unless changed
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBook) return; //If no book is selected, return
    setIsSubmitting(true); //Set submitting state to true
    const csrfToken = await fetchCsrfToken(); //Get the CSRF token
    const data = { //Create the data object
      title: bookData.title,
      year: bookData.year,
      copies: bookData.copies,
      authors: bookData.authors.map(author => author.value).join(','),
      genres: bookData.genres.map(genre => genre.value).join(',')
    };

    const response = await fetch(`http://127.0.0.1:8000/api/books/${selectedBook.isbn}/edit/`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',  //Changed to JSON
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify(data), //Stringify the data object
    });

    const result = await response.json();

    if (response.ok) {
      showMessage('Book updated successfully!', 'success');
      if (onEdit) onEdit(result);
      handleClose();
    } 
    else showMessage(result.error || 'An error occurred while updating the book.', 'error');
    setIsSubmitting(false); //Set submitting state to false
  };

  // Update handleDelete to open confirmation modal instead of alert
  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  // New function to handle actual deletion
  const confirmDelete = async () => {
    setIsDeleting(true);
    const csrfToken = await fetchCsrfToken();
    const response = await fetch(`http://127.0.0.1:8000/api/books/${selectedBook.isbn}/delete/`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'X-CSRFToken': csrfToken,
      },
    });

    if (response.ok) {
      showMessage('Book deleted successfully!', 'success');
      if (onDelete) onDelete(selectedBook.isbn);
      handleClose();
    }
    else showMessage('An error occurred while deleting the book.', 'error');
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
  };

  const handleClose = () => {
    setSelectedBook(null);
    setSearchResults([]);
    setBookData({
      title: '',
      authors: [],
      genres: [],
      year: '',
      isbn: '',
      copies: 1,
      cover: null
    });
    onClose();
  };

  const handleSearch = (query) => {
    if (query.length < 2) { //If the query is less than 2 characters, clear the search results
      setSearchResults([]);
      return;
    }
    searchBooks(query); //Search for the books
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onRequestClose={handleClose}
        style={{...customStyles, content: {...customStyles.content, minHeight: '50vh'}}}
        contentLabel="Edit Book"
      >
        <div className="modal-content">
          <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Edit Book</h2>
          
          {/* Search Section */}
          <div className="search-section" style={{ marginBottom: '20px' }}>
            <Select
              options={searchResults}
              onInputChange={handleSearch}
              onChange={handleBookSelect}
              value={selectedBook}
              isLoading={isLoading}
              placeholder="Search by ISBN or Title"
              isClearable
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: '#FAFAE6',
                  border: '1px solid #DEB887',
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: '#FAFAE6',
                }),
              }}
            />
          </div>
          {selectedBook && (
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '200px minmax(300px, 500px)',
              gap: '20px',
              padding: '15px',
              backgroundColor: '#FAFAE6',
              borderRadius: '8px',
              border: '1px solid #DEB887',
              justifyContent: 'center',
            }}>
              {/* Left Column - Cover Image */}
              <div style={{ textAlign: 'center' }}>
                <img 
                  src={bookData.cover || selectedBook.cover} 
                  alt={bookData.title}
                  style={{
                    width: '180px',
                    height: '270px',
                    objectFit: 'cover',
                    marginBottom: '10px',
                    border: '1px solid #DEB887',
                    borderRadius: '4px',
                  }}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBookData({...bookData, cover: e.target.files[0]})}
                  style={{ display: 'none' }}
                  id="cover-upload"
                />
                <label 
                  htmlFor="cover-upload"
                  className="generalbutton"
                  style={{
                    display: 'block',
                    padding: '8px',
                    backgroundColor: '#4E8574',
                    color: 'white',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '10px',
                  }}
                >
                  Change Cover
                </label>
              </div>

              {/* Right Column - Form */}
              <div style={{ width: '100%', maxWidth: '600px' }}>
                <form onSubmit={handleSubmit}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '10px',
                    width: '100%',
                  }}>
                                        {/* ISBN Input */}
                                        <div style={{ width: '100%' }}>
                      <label style={{ 
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        ISBN (Read Only)
                      </label>
                      <input
                        type="text"
                        value={bookData.isbn}
                        readOnly
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #DEB887',
                          borderRadius: '4px',
                          backgroundColor: '#e9e9d9',
                          cursor: 'not-allowed',
                          height: '25px',
                          maxWidth: '400px',
                        }}
                      />
                    </div>

                    {/* Title Input */}
                    <div style={{ width: '100%' }}>
                      <label style={{ 
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        Title
                      </label>
                      <input
                        type="text"
                        value={bookData.title}
                        onChange={(e) => setBookData({...bookData, title: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #DEB887',
                          borderRadius: '4px',
                          backgroundColor: '#FAFAE6',
                          height: '22px',
                          maxWidth: '400px',
                        }}
                        required
                      />
                    </div>

                    {/* Authors Select */}
                    <div style={{ width: '100%' }}>
                      <label style={{ 
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        Authors
                      </label>
                      <CreatableSelect
                        isMulti
                        options={allAuthors}
                        value={bookData.authors}
                        onChange={(selected) => setBookData({...bookData, authors: selected || []})}
                        styles={{
                          container: (base) => ({
                            ...base,
                            width: '100%',
                            maxWidth: '400px',
                          }),
                          control: (base) => ({ 
                            ...base, 
                            minHeight: '24px',
                            fontSize: '12px',
                            backgroundColor: '#FAFAE6',
                            color: '#363B35',
                            zIndex: 0,
                            border: '1px solid #DEB887',
                          }),
                          input: (base) => ({ ...base, color: '#363B35' }),
                          singleValue: (base) => ({ ...base, color: '#363B35' }),
                          multiValue: (base) => ({ 
                            ...base, 
                            backgroundColor: '#f5f5dc',
                            color: '#363B35',
                            border: '0.1px solid #D3D3D3',
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
                    </div>

                    {/* Genres Select */}
                    <div style={{ width: '100%' }}>
                      <label style={{ 
                        display: 'block',
                        marginBottom: '4px'
                      }}>
                        Genres
                      </label>
                      <CreatableSelect
                        isMulti
                        options={allGenres}
                        value={bookData.genres}
                        onChange={(selected) => setBookData({...bookData, genres: selected || []})}
                        styles={{
                          container: (base) => ({
                            ...base,
                            width: '100%',
                            maxWidth: '400px',
                          }),
                          control: (base) => ({ 
                            ...base, 
                            minHeight: '24px',
                            fontSize: '12px',
                            backgroundColor: '#FAFAE6',
                            color: '#363B35',
                            zIndex: 0,
                            border: '1px solid #DEB887',
                          }),
                          input: (base) => ({ ...base, color: '#363B35' }),
                          singleValue: (base) => ({ ...base, color: '#363B35' }),
                          multiValue: (base) => ({ 
                            ...base, 
                            backgroundColor: '#f5f5dc',
                            color: '#363B35',
                            border: '0.1px solid #D3D3D3',
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
                    </div>

                    {/* Year and Copies Grid */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: '50px',
                      maxWidth: '390px',
                    }}>
                      {/* Year Input */}
                      <div>
                        <label style={{ 
                          display: 'block',
                          marginBottom: '4px'
                        }}>
                          Year
                        </label>
                        <input
                          type="number"
                          value={bookData.year}
                          onChange={(e) => setBookData({...bookData, year: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '6px',
                            border: '1px solid #DEB887',
                            borderRadius: '4px',
                            backgroundColor: '#FAFAE6',
                            height: '32px',
                          }}
                        />
                      </div>

                      {/* Copies Input */}
                      <div>
                        <label style={{ 
                          display: 'block',
                          marginBottom: '4px'
                        }}>
                          Copies
                        </label>
                        <input
                          type="number"
                          value={bookData.copies}
                          onChange={(e) => setBookData({...bookData, copies: parseInt(e.target.value)})}
                          style={{
                            width: '100%',
                            padding: '6px',
                            border: '1px solid #DEB887',
                            borderRadius: '4px',
                            backgroundColor: '#FAFAE6',
                            height: '32px',
                          }}
                          min="1"
                          required
                        />
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div style={{ 
                      display: 'flex',
                      gap: '10px',
                      marginTop: '10px',
                      maxWidth: '400px',
                    }}>
                      <button
                        type="submit"
                        className="generalbutton"
                        disabled={isSubmitting}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: '#4CAF50',
                        }}
                      >
                        {isSubmitting ? (
                          <>Saving<LoadingDots /></>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="generalbutton"
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: '#ff4444',
                        }}
                      >
                        Delete Book
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onRequestClose={() => setIsDeleteModalOpen(false)}
        style={{
          content: {
            ...customStyles.content,
            width: '350px',
            minWidth: 'auto'
          }
        }}
        contentLabel="Confirm Delete"
      >
        <h2>Confirm Delete</h2>
        <p>Are you sure you want to delete this book?</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <button
            onClick={confirmDelete}
            className="generalbutton"
            disabled={isDeleting}
            style={{ backgroundColor: '#ff4444', width: '48%' }}
          >
            {isDeleting ? (
              <>Deleting<LoadingDots /></>
            ) : (
              'Delete'
            )}
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(false)}
            className="generalbutton"
            style={{ width: '48%' }}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </>
  );
};

export default EditBookModal;
