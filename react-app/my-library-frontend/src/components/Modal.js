/*
 * Modal Book component
 * Handles the modal for the book page
 * Permits adding reviews, wishlisting, borrowing and deleting reviews
 */


import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import ReactStars from 'react-rating-stars-component';
import Cookies from 'js-cookie';
import { useUser } from '../context/userContext';
import LoadingDots from './LoadingDots';

Modal.setAppElement('#root');

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
};

const confirmModalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    maxWidth: '400px',
    width: '90%',
    textAlign: 'center',
  },
};

const generalButtonStyle = {
  padding: '10px 20px',
  backgroundColor: '#4E8574',
  color: '#fff',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  margin: '10px',
  fontSize: '16px',
  transition: 'background-color 0.3s',
};

//Helper function to get author names
function getAuthorNames(authors) {
  if (!authors || !Array.isArray(authors) || authors.length === 0) return 'Unknown';
  return authors.map(author => author.name).join(', ');
}

//Helper function to get genre names
function getGenreNames(genres) {
  if (!genres || !Array.isArray(genres) || genres.length === 0) return 'None';
  return genres.map(genre => genre.name).join(', ');
}

function CustomModal({ isOpen, onRequestClose, contentLabel, initialBook, onBook, openAuthModal, wishlist, setWishlist }) {
  const { currentUser } = useUser(); //User context
  const [book, setBook] = useState(initialBook); //Store book data
  const [reviews, setReviews] = useState([]); //Store reviews
  const [userReview, setUserReview] = useState(null); //Store user review
  const [averageRating, setAverageRating] = useState(0); //Store average rating
  const [reviewCount, setReviewCount] = useState(0); //Store review count
  const [newReview, setNewReview] = useState({ content: '', rating: 0 }); //Store new review
  const [isLoadingReviews, setIsLoadingReviews] = useState(true); //Track if reviews are loading
  const [isWishlistLoading, setIsWishlistLoading] = useState(false); //Track if wishlist is loading
  const [isBorrowLoading, setIsBorrowLoading] = useState(false); //Track if borrowing is loading
  const [isDeletingReview, setIsDeletingReview] = useState(false); //Track if deleting review is loading
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); //Track if confirm modal is open
  const [error, setError] = useState(''); //Store error message

  //Fetch book details and reviews
  useEffect(() => {
    if (initialBook) {
      setIsLoadingReviews(true);

      // Fetch book details
      const fetchBookDetails = async () => {
        const response = await fetch(`http://127.0.0.1:8000/api/books/${initialBook.isbn}/`, {
          credentials: 'include'
        });
        const data = await response.json();
        if (data.authors) {
          setBook(prevBook => ({ ...prevBook, authors: data.authors }));
        }
      };

      // Fetch reviews
      const fetchReviews = async () => {
        const response = await fetch(`http://127.0.0.1:8000/api/book-reviews/${initialBook.isbn}/`, {
          credentials: 'include'
        });
        const data = await response.json();
        setReviews(data.reviews || []); //Set reviews
        setUserReview(data.user_review || null);
        const rating = parseFloat(data.average_rating); //Set average rating
        setAverageRating(isNaN(rating) ? 0 : rating);
        setReviewCount(data.review_count || 0); //Set review count
        setIsLoadingReviews(false);
      };

      fetchBookDetails();
      fetchReviews();
    }
  }, [initialBook]);

  //Handle review submission
  const handleReviewSubmit = async () => {

    setError('');
    if (newReview.rating === 0) { //If no rating, set error
      setError('Please select a star rating before submitting your review.');
      return;
    }
    const response = await fetch(`http://127.0.0.1:8000/api/add-review/${book.isbn}/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': Cookies.get('csrftoken'),
      },
      body: JSON.stringify(newReview),
    });
    if (response.ok) {
      // Refetch all reviews after successful submission
      const reviewsResponse = await fetch(`http://127.0.0.1:8000/api/book-reviews/${book.isbn}/`, {
        credentials: 'include'
      });
      const reviewsData = await reviewsResponse.json();
      setReviews(reviewsData.reviews || []); //Set reviews and other data
      setUserReview(reviewsData.user_review || null);
      setAverageRating(parseFloat(reviewsData.average_rating) || 0);
      setReviewCount(reviewsData.review_count || 0);
      setNewReview({ content: '', rating: 0 });
    }
  };

  const handleWishlistClick = async () => {
    if (!currentUser) { //If no user open the login form
      onRequestClose();
      openAuthModal(true);
      return;
    }

    setIsWishlistLoading(true);
    const method = wishlist.has(book.isbn) ? 'DELETE' : 'POST';
    const response = await fetch(`http://127.0.0.1:8000/api/wishlist/${book.isbn}/`, {
      method,
      credentials: 'include',
      headers: {
        'X-CSRFToken': Cookies.get('csrftoken'),
      }
    });
    if (response.ok) {
      // Update the wishlist state based on the response
      setWishlist(prev => {
        const newWishlist = new Set(prev); //Create new wishlist from previous
        if (method === 'POST') newWishlist.add(book.isbn); //If we're trying to POST add the book's ISBN
        else newWishlist.delete(book.isbn); //If we're trying to DELETE remove the book's ISBN
        return newWishlist;
      });
    }
    setIsWishlistLoading(false);
  };

  const handleBorrowClick = async () => {
    if (!currentUser) return;
    
    setIsBorrowLoading(true);
    await onBook();
    setTimeout(() => {
      onRequestClose();
      setIsBorrowLoading(false);
    }, 50);
    setIsBorrowLoading(false);
  };

  const handleDeleteReview = async () => {
    if (!userReview) return; //If no user review return else start "deleting"
    setIsDeletingReview(true);
    const response = await fetch(`http://127.0.0.1:8000/api/delete-review/${userReview.id}/`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'X-CSRFToken': Cookies.get('csrftoken'),
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) {
      setReviews(reviews.filter(review => review.id !== userReview.id)); //Filter out the deleted review
      setUserReview(null);
      setIsConfirmModalOpen(false);
    }
    setIsDeletingReview(false);
  };

  const openConfirmModal = () => {
    setIsConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
  };

  if (!book) return null;

  //Skeleton for reviews while loading
  const ReviewsSkeleton = () => (
    <>
      {[1, 2, 3].map((n) => (
        <div key={n} style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <div style={{ 
            width: '120px', 
            height: '24px', 
            backgroundColor: '#b7b7b7',
            marginBottom: '8px',
            borderRadius: '4px',
            animation: 'pulse 1.5s infinite'
          }} />
          <div style={{ 
            width: '80px', 
            height: '16px', 
            backgroundColor: '#b7b7b7',
            marginBottom: '8px',
            borderRadius: '4px'
          }} />
          <div style={{ 
            width: '100%', 
            height: '40px', 
            backgroundColor: '#b7b7b7',
            borderRadius: '4px'
          }} />
        </div>
      ))}
    </>
  );

  const hasAvailableCopies = book && (book.copies - book.lended) > 0; //Check if there are available copies

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel={contentLabel}
      style={{
        content: {
          ...customStyles.content,
          backgroundColor: '#f5f5dc',
          fontFamily: "'Playfair Display', serif",
          color: '#363B35'
        }
      }}
    >
      
      <div style={{ display: 'flex', gap: '20px' }} className="modal-content">
        <div className="book-info-section" style={{ 
          flex: '1.5',
          paddingRight: '20px',
          borderRight: '1px solid #ccc',
          minWidth: '250px',
        }}>
          <div style={{ 
            display: 'flex',
            gap: '15px',
            marginBottom: '20px',
            alignItems: 'flex-start'
          }}>
            <img
              src={book.cover}
              alt={book.title}
              className="book-cover-image"
              style={{ 
                width: '150px',
                height: '225px',
                objectFit: 'cover',
              }}
            />
            <div style={{ marginTop: '10px' }}>
              <ReactStars
                key={averageRating}
                value={parseFloat(averageRating)}
                count={5}
                edit={false}
                size={24}
                isHalf={true}
                activeColor="#ffd700"
                color={'#ddd'}
              />
              <span>({averageRating.toFixed(1)} - {reviewCount} reviews)</span>
            </div>
          </div>

          {/* Book information section */}
          <div style={{ marginTop: '-10px' }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              marginBottom: '10px',
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              color: '#363B35'
            }}>{book.title}</h2>
            <p style={{ 
              marginBottom: '5px',
              fontFamily: "'Playfair Display', serif",
              fontWeight: 300,
              color: '#363B35'
            }}>
              <strong style={{ fontWeight: 700 }}>Author(s): </strong> 
              {book.authors ? getAuthorNames(book.authors) : 'Loading...'}
            </p>
            <p style={{ 
              marginBottom: '5px',
              fontFamily: "'Playfair Display', serif",
              fontWeight: 300,
              color: '#363B35'
            }}><strong style={{ fontWeight: 700 }}>Year of Publish:</strong> {book.year}</p>
            <p style={{ 
              marginBottom: '5px',
              fontFamily: "'Playfair Display', serif",
              fontWeight: 300,
              color: '#363B35'
            }}><strong style={{ fontWeight: 700 }}>Genres:</strong> {book.genres ? getGenreNames(book.genres) : 'Loading...'}</p>
            <p style={{ 
              marginBottom: '5px',
              fontFamily: "'Playfair Display', serif",
              fontWeight: 300,
              color: '#363B35'
            }}><strong style={{ fontWeight: 700 }}>ISBN:</strong> {book.isbn}</p>
            <p style={{ 
              marginBottom: '15px',
              fontFamily: "'Playfair Display', serif",
              fontWeight: 300,
              color: '#363B35'
            }}><strong style={{ fontWeight: 700 }}>Available Copies:</strong> {book.copies - book.lended}</p>
            
            {currentUser && (
              <button
                onClick={handleWishlistClick}
                disabled={isWishlistLoading}
                style={{
                  width: '36%',
                  padding: '8px 15px',
                  backgroundColor: wishlist.has(book.isbn) ? '#dc3545' : '#28a745',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginRight: '10px',
                  marginBottom: '10px'
                }}
              >
                {isWishlistLoading ? (
                  <span>
                    {wishlist.has(book.isbn) ? 'Removing' : 'Adding'}
                    <LoadingDots />
                  </span>
                ) : (
                  wishlist.has(book.isbn) ? 'Remove from Wishlist' : 'Add to Wishlist'
                )}
              </button>
            )}
            <button
              onClick={currentUser ? handleBorrowClick : null}
              disabled={!currentUser || isBorrowLoading || !hasAvailableCopies}
              style={{
                width: '50%',
                padding: '8px 15px',
                backgroundColor: currentUser && hasAvailableCopies ? '#4E8574' : '#cccccc',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: currentUser && hasAvailableCopies ? 'pointer' : 'not-allowed',
                opacity: currentUser && hasAvailableCopies ? 1 : 0.7,
                position: 'relative'
              }}
              title={!currentUser ? "Please log in to borrow books" : !hasAvailableCopies ? "No copies available" : ""}
            >
              {isBorrowLoading ? (
                <span>
                  Borrowing<LoadingDots />
                </span>
              ) : (
                !currentUser ? "Login to Borrow" : 
                !hasAvailableCopies ? "No Copies Available" : 
                "Borrow"
              )}
            </button>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="reviews-section" style={{
          flex: '1',
          overflow: 'auto',
          maxHeight: '60vh',
          paddingLeft: '20px',
          fontFamily: "'Playfair Display', serif",
          color: '#363B35'
        }}>
          <h3 style={{ 
            marginTop: '0',
            fontWeight: 700,
            color: '#363B35'
          }}>Reviews</h3>
          {isLoadingReviews ? (
            <ReviewsSkeleton />
          ) : (
            <>
              {currentUser && !userReview && (
                <div>
                  <h3>Leave a Review:</h3>
                  {error && <p style={{ color: 'red' }}>{error}</p>}
                  <ReactStars
                    count={5}
                    value={newReview.rating}
                    onChange={(newRating) => setNewReview({ ...newReview, rating: newRating })}
                    size={24}
                    color2={'#ffd700'}
                    color1={'#ddd'}
                  />
                  <textarea
                    value={newReview.content}
                    onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                    placeholder="Write your review here..."
                    rows="4"
                    style={{ width: '80%', marginTop: '10px', backgroundColor: '#fafae6' }}
                  />
                  <button
                    onClick={handleReviewSubmit}
                    style={generalButtonStyle}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#3a6b5c'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#4E8574'}
                  >
                    Submit Review
                  </button>
                </div>
              )}
              
              {currentUser && userReview && (
                <div style={{
                  marginBottom: '20px',
                  padding: '10px',
                  backgroundColor: '#fafae6',
                  borderRadius: '5px',
                  border: '1px solid #e9ecef',
                  position: 'relative',
                  maxWidth: '90%',
                  overflowWrap: 'break-word',
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  boxSizing: 'border-box',
                }}>
                  <button
                    onClick={openConfirmModal}
                    disabled={isDeletingReview}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: '#fafae6',
                      border: 'none',
                      color: '#dc3545',
                      cursor: 'pointer',
                      fontSize: '16px',
                    }}
                    title="Delete Review"
                  >
                    &times;
                  </button>
                  <p style={{
                    fontStyle: 'italic',
                    color: '#666',
                    margin: '0'
                  }}>
                    Your review:
                  </p>
                  <ReactStars
                    count={5}
                    value={parseFloat(userReview.rating)}
                    edit={false}
                    size={24}
                    color2={'#ffd700'}
                    color1={'#ddd'}
                  />
                  <p style={{ margin: '5px 0' }}>{userReview.content}</p>
                </div>
              )}
              
              {!currentUser && (
                <div style={{ 
                  marginBottom: '20px',
                  padding: '10px',
                  backgroundColor: '#fafae6',
                  borderRadius: '5px',
                  border: '1px solid #e9ecef',
                  textAlign: 'center'
                }}>
                  <p style={{ 
                    fontStyle: 'italic', 
                    color: '#666',
                    margin: '0'
                  }}>
                    Please log in to leave a review.
                  </p>
                </div>
              )}

              {reviews.map(review => (
                <div key={review.id} style={{ backgroundColor: '#fafae6', padding: '5px', marginBottom: '5px', border: '1px solid #eee'}}>
                  <ReactStars
                    count={5}
                    value={parseFloat(review.rating)}
                    edit={false}
                    size={24}
                    color2={'#ffd700'}
                    color1={'#ddd'}
                  />
                  <p><strong>{review.user.firstName} {review.user.lastName}: </strong></p>
                  <p>{review.content}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={isConfirmModalOpen}
        onRequestClose={closeConfirmModal}
        contentLabel="Confirm Delete"
        style={confirmModalStyles}
      >
        <h2>Are you sure you want to delete your review?</h2>
        <button
          onClick={handleDeleteReview}
          disabled={isDeletingReview}
          style={generalButtonStyle}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#3a6b5c'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#4E8574'}
        >
          Yes, Delete
        </button>
        <button
          onClick={closeConfirmModal}
          style={generalButtonStyle}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#3a6b5c'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#4E8574'}
        >
          Cancel
        </button>
      </Modal>
    </Modal>
  );
}

export default CustomModal;
