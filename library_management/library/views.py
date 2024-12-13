import threading, json
from .models import Book, Review, LendedBook, Author, Genre, Wishlist
from .serializers import BookSerializer, AuthorSerializer, GenreSerializer, LendedBookSerializer
from datetime import date
from django.shortcuts import redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, get_user_model, logout
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.decorators import login_required
from django.db.models import Avg, F, Q, Count, Prefetch
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.urls import reverse
from dateutil.relativedelta import relativedelta
from rest_framework import viewsets
from rest_framework.permissions import BasePermission, IsAuthenticatedOrReadOnly
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST, require_http_methods
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.html import strip_tags

@require_POST
def password_reset_request(request): # Handles password reset requests by sending a reset email to the user.
    try:
        data = json.loads(request.body)
        email = data.get('email')  # Get the email from the JSON data
        if not email:
            return JsonResponse({'error': 'Email is required'}, status=400)

        user = User.objects.filter(email=email).first()  # Find user by email
        if user:
            # Generate a password reset token and encode user ID
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            reset_url = f"{request.build_absolute_uri('/').rstrip('/')}/reset-password?uid={uid}&token={token}" #Create the reset URL
            
            # Create the HTML content of the email
            html_content = render_to_string('registration/password_reset_email.html', {
                'user': user,
                'protocol': 'https' if request.is_secure() else 'http',
                'domain': request.get_host(),
                'uid': uid,
                'token': token,
                'reset_url': reset_url,
            })
            
            # Send the password reset email
            send_mail(
                'Password Reset Requested',
                strip_tags(html_content),  # Plain text version
                'libraryitue@gmail.com',  # From email
                [email],  # Recipient list
                html_message=html_content,  # HTML version
                fail_silently=False,
            )
        
        # Success message even if the user doesn't exist
        return JsonResponse({
            'message': 'Password reset email has been sent if the email exists in our system.'
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@require_http_methods(["GET"])
def validate_reset_token(request, uidb64, token): # Validates the password reset token and user ID.
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)  # Retrieve user by decoded UID
        
        if default_token_generator.check_token(user, token): #If the token is valid return true, else return false
            return JsonResponse({'valid': True})
        else:
            return JsonResponse({'valid': False, 'error': 'Invalid or expired token'}, status=400)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return JsonResponse({'valid': False, 'error': 'Invalid reset link'}, status=400)

@require_POST
def password_reset_confirm(request): # Update the user's password.
    try:
        data = json.loads(request.body)
        # Get all the necessary data from the JSON data
        uidb64 = data.get('uid')
        token = data.get('token')
        new_password = data.get('password')
        if not all([uidb64, token, new_password]): #If any of the required fields are missing return an error
            return JsonResponse({'error': 'Missing required fields'}, status=400)
        
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)  # Retrieve user by decoded UID
        
        if not default_token_generator.check_token(user, token): #If the token is invalid or expired return an error
            return JsonResponse({'error': 'Invalid or expired token'}, status=400)
        
        try:
            validate_password(new_password, user)  # Validate the new password and if there is any validation error return them
        except ValidationError as e:
            return JsonResponse({'error': e.messages}, status=400)
        
        user.set_password(new_password)  # If the password is valid then update the user's password
        user.save()
        
        return JsonResponse({'message': 'Password has been reset successfully'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
    
@require_http_methods(["GET"])
def search_books_view(request): # Book searching view
    query = request.GET.get('q', '') # Get the search query from GET parameters
    if not query:
        return JsonResponse({'results': []}) # If no query provided, return empty results
    
    books = Book.objects.filter( # Filter books where title or ISBN contains the query
        Q(title__icontains=query) | Q(isbn__icontains=query)
    ).prefetch_related('authors', 'genres')[:10] # Max 10 results
    
    results = [{ # Serialize the book data for JSON response
        'isbn': book.isbn,
        'title': book.title,
        'authors': [{'name': author.name} for author in book.authors.all()],
        'genres': [{'name': genre.name} for genre in book.genres.all()],
        'year': book.year,
        'copies': book.copies,
        'cover': book.cover.url if book.cover else None
    } for book in books]
    
    return JsonResponse({'results': results})

@require_http_methods(["DELETE"])
def delete_book_view(request, isbn): # Delete a book identified by its ISBN.
    if not request.user.is_staff: # If the user is not a staff member then return an error.
        return JsonResponse({'error': 'Permission denied'}, status=403)
        
    try:
        book = get_object_or_404(Book, isbn=isbn)  # Retrieve the book
        book.delete()  # Delete the book from the database
        return JsonResponse({'message': 'Book deleted successfully'}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@require_http_methods(["GET", "POST", "DELETE"])
def wishlist_view(request, isbn=None): # Manages the user's wishlist.
    if not request.user.is_authenticated: # If the user is not authenticated then return an error.
        return JsonResponse({'error': 'Authentication required'}, status=401)

    if request.method == "GET":
        wishlist_items = Wishlist.objects.filter(user=request.user).select_related('book') # Retrieve all wishlist items for the current user
        wishlist_data = [{ # Serialize the wishlist items for JSON response
            'isbn': item.book.isbn,
            'title': item.book.title,   
            'cover': f"http://127.0.0.1:8000{item.book.cover.url}" if item.book.cover else None
        } for item in wishlist_items]
        return JsonResponse({'wishlist': wishlist_data})

    if request.method == "POST":
        book = get_object_or_404(Book, isbn=isbn) # Add a book to the user's wishlist
        wishlist_item, created = Wishlist.objects.get_or_create(
            user=request.user,
            book=book
        )
        return JsonResponse({ # Serialize the wishlist item data for JSON response
            'message': 'Book added to wishlist' if created else 'Book already in wishlist',
            'added': created
        })

    if request.method == "DELETE":
        book = get_object_or_404(Book, isbn=isbn) # Remove a book from the user's wishlist
        Wishlist.objects.filter(user=request.user, book=book).delete()
        return JsonResponse({'message': 'Book removed from wishlist'})

def current_user_view(request): # Returns information about the currently authenticated user.
    user = request.user
    if not user.is_authenticated: # If the user is not authenticated then return an error.
        return JsonResponse({'error': 'User not authenticated'}, status=401)
    
    user_data = {
        'username': user.username,
        'email': user.email,
        'is_staff': user.is_staff,
    }
    return JsonResponse({'user': user_data}, status=200)

@require_http_methods(["GET", "POST"])
def book_reviews_view(request, isbn): # Handles fetching and adding reviews for a specific book.
    book = get_object_or_404( # Retrieve the book
        Book.objects.prefetch_related(
            Prefetch(
                'reviews',
                queryset=Review.objects.select_related('user')
            )
        ),
        isbn=isbn
    )

    if request.method == "GET":
        reviews = book.reviews.all() # Retrieve all reviews for the book
        average_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0 # Calculate the average rating
        review_count = len(reviews)  # Count the number of reviews
        
        user_review = None
        if request.user.is_authenticated: # If the user is authenticated then check if they have already reviewed the book
            user_review = next((
                review for review in reviews 
                if review.user_id == request.user.id
            ), None)
            if user_review:
                user_review = { # If the user has reviewed the book then serialize the user's review
                    'id': user_review.id,
                    'content': user_review.content,
                    'rating': user_review.rating,
                    'user': {'username': user_review.user.username, 'firstName': user_review.user.first_name, 'lastName': user_review.user.last_name}
                }
        
        reviews_data = [{ # Serialize all reviews for the book
            'id': review.id,
            'content': review.content,
            'rating': review.rating,
            'user': {'username': review.user.username, 'firstName': review.user.first_name, 'lastName': review.user.last_name}
        } for review in reviews]

        return JsonResponse({
            'reviews': reviews_data,
            'user_review': user_review,
            'average_rating': round(average_rating, 1),
            'review_count': review_count
        })

    elif request.method == "POST":
        if not request.user.is_authenticated: # If the user is not authenticated then return an error.
            return JsonResponse({'error': 'You must be logged in to add a review.'}, status=403)

        data = json.loads(request.body)
        content = data.get('content')
        rating = data.get('rating')

        if not content or not rating: # If the content or rating is not provided then return an error.
            return JsonResponse({'error': 'Content and rating are required.'}, status=400)

        review, created = Review.objects.get_or_create( # Create a new review
            book=book,
            user=request.user,
            defaults={'content': content, 'rating': rating}
        )

        return JsonResponse({ # Serialize the newly created review
            'review': {
                'id': review.id,
                'content': review.content,
                'rating': review.rating,
                'user': {'username': review.user.username}
            }
        }, status=201)

def get_inactive_user_uid(email):
    inactive_user = User.objects.filter(email=email, is_active=False).first() # Retrieves the UID of an inactive user based on their email.
    
    if inactive_user:
        uid = urlsafe_base64_encode(force_bytes(inactive_user.pk))
        return uid
    else:
        return None

@require_POST
def borrow_book_view(request, isbn): # Allows a user to borrow a book if copies are available.
    try:
        book = get_object_or_404(Book, isbn=isbn)  # Retrieve the book by ISBN
        if book.copies > book.lended:
            borrowed_book, created = LendedBook.objects.get_or_create( # Create a new lended book record or return an error if one already exists
                user=request.user,
                book=book,
                defaults={
                    'number': 1,
                    'borrowed_on': date.today(),
                    'return_on': date.today() + relativedelta(months=1),
                }
            )
            if not created:
                borrowed_book.number += 1 # If the user has already borrowed the book, increment the quantity
                borrowed_book.save()
            
            book.lended += 1  # Increment the number of lended copies
            book.save()

            return JsonResponse({'message': f"You have successfully borrowed '{book.title}'."}, status=200)
        else:
            return JsonResponse({'error': "Sorry, this book is currently unavailable for borrowing."}, status=400) # No available copies to borrow
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@require_POST
def add_book_view(request): # Allows staff users to add a new book to the library.
    try:
        data = request.POST  # Retrieve POST data
        title = data.get('title')
        authors = json.loads(data.get('authors', '[]'))
        genres = json.loads(data.get('genres', '[]'))
        year = data.get('year')
        isbn = data.get('isbn')
        copies = data.get('copies', 1)
        cover = request.FILES.get('cover')

        if not all([title, authors, genres, year, isbn]): # If any of the required fields are missing then return an error.
            return JsonResponse({'error': 'All fields are required.'}, status=400)
        
        book = Book.objects.create(title=title, year=year, isbn=isbn, copies=copies, cover=cover) # Create the book instance
        
        for author_name in authors:
            author, created = Author.objects.get_or_create(name=author_name.strip())
            book.authors.add(author)
        for genre_name in genres:
            genre, created = Genre.objects.get_or_create(name=genre_name.strip())
            book.genres.add(genre)

        return JsonResponse({'message': 'Book added successfully.'}, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@require_http_methods(["PUT"])
def edit_book_view(request, isbn): # Allows staff users to edit an existing book's details.
    try:
        book = get_object_or_404(Book, isbn=isbn)  # Retrieve the book by ISBN
        
        if request.content_type == 'application/json': # If the request is JSON then update the book details
            data = json.loads(request.body)
            book.title = data.get('title', book.title)
            book.year = data.get('year', book.year)
            book.copies = data.get('copies', book.copies)
            
            genres = data.get('genres', '').split(',') # Split the genres string into a list
            if genres and genres[0]:
                book.genres.clear()
                for genre_name in genres:
                    genre, created = Genre.objects.get_or_create(name=genre_name.strip())
                    book.genres.add(genre)
            
            authors = data.get('authors', '').split(',') # Split the authors string into a list
            if authors and authors[0]:
                book.authors.clear()
                for author_name in authors:
                    author, created = Author.objects.get_or_create(name=author_name.strip())
                    book.authors.add(author)

        else:
            book.title = request.POST.get('title', book.title)
            book.year = request.POST.get('year', book.year)
            book.copies = request.POST.get('copies', book.copies)
            
            if 'cover' in request.FILES:
                book.cover = request.FILES['cover']

        book.save() # Save the updated book details
        return JsonResponse({ # Serialize the updated book data for JSON response
            'message': 'Book updated successfully.',
            'book': {
                'isbn': book.isbn,
                'title': book.title,
                'year': book.year,
                'copies': book.copies,
                'authors': [{'name': author.name} for author in book.authors.all()],
                'genres': [{'name': genre.name} for genre in book.genres.all()],
                'cover': book.cover.url if book.cover else None
            }
        }, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@require_POST
def return_book_view(request, isbn, username): # Return the book to the library.
    if not request.user.is_staff: # If the user is not a staff member then return an error.
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    
    try:
        book = get_object_or_404(Book, isbn=isbn)
        user = get_object_or_404(User, username=username)
        lended_book = get_object_or_404(LendedBook, book=book, user=user)

        return_quantity = int(request.POST.get('quantity', 1)) # Quantity to return
        if return_quantity > lended_book.number:
            # If the return quantity exceeds the borrowed quantity then return an error.
            return JsonResponse({'error': 'Return quantity exceeds borrowed quantity.'}, status=400)
        
        lended_book.number -= return_quantity

        if lended_book.number == 0:
            lended_book.delete()
        else:
            lended_book.save()

        Book.objects.filter(isbn=isbn).update(lended=F('lended') - return_quantity)
        return JsonResponse({'message': 'Book returned successfully.'}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@ensure_csrf_cookie
def get_csrf_token(request): # Ensures that a CSRF token cookie is set for the client.
    csrf_token = request.META.get('CSRF_COOKIE', None) # Get the csrftoken from the request
    return JsonResponse({'message': 'CSRF cookie set', 'csrfToken': csrf_token}) # Return the csrftoken

def logout_view(request): # Logs out the currently authenticated user.
    if request.method == 'POST':
        logout(request)
        return JsonResponse({'message': 'Logout successful'}, status=200)
    return JsonResponse({'error': 'Invalid request method'}, status=405)

def login_view(request): # Authenticates and logs in a user based on provided credentials.
    if request.user.is_authenticated:
        return JsonResponse({'message': 'User already logged in.'}, status=400) # If the user is already logged in then return an error.

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
        except Exception as e:
            return JsonResponse({'error': 'Invalid format'}, status=400)

        user = authenticate(request, username=username, password=password) # Try to authenticate the user

        if user is not None:
            login(request, user) # Log in the user
            return JsonResponse({
                'message': 'Login successful',
                'is_staff': user.is_staff,
                'user': {
                    'username': user.username,
                    'email': user.email,
                    'firstName': user.first_name,
                    'lastName': user.last_name,
                }
            }, status=200)
        else:
            inactive_user = User.objects.filter(username=username, is_active=False).first() # Check if the user is inactive
            if inactive_user:
                uid = urlsafe_base64_encode(force_bytes(inactive_user.pk)) # Encode the user's ID
                verification_url = reverse('resend_verification_email', args=[uid]) # Generate the verification URL
                return JsonResponse({
                    'error': 'You have to verify your email.',
                    'verification_url': verification_url,
                    'uid': uid
                }, status=403)
            else:
                return JsonResponse({'error': 'Invalid username or password.'}, status=401) # If the username or password is invalid then return an error.
    return JsonResponse({'error': 'Invalid request method'}, status=405)

def register_view(request): # Handles user registration by creating a new inactive user and sending a verification email.
    if request.user.is_authenticated:
        return JsonResponse({'message': 'User already logged in.'}, status=400) # If the user is already logged in then return an error.

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            firstName = data.get('firstName')
            lastName = data.get('lastName')
            email = data.get('email')
            username = data.get('username')
            password = data.get('password')
        except Exception as e:
            return JsonResponse({'error': 'Invalid format'}, status=400)

        if not all([firstName, lastName, email, username, password]):
            return JsonResponse({'error': 'All fields are required.'}, status=400) # If any of the required fields are missing then return an error.

        try:
            validate_password(password) # Validate the password strength
        except ValidationError as e:
            return JsonResponse({'error': e.messages}, status=400) # If the password is not strong enough then return an error.

        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': "Username already exists."}, status=400) # If the username is already taken then return an error.

        if User.objects.filter(email=email).exists():
            return JsonResponse({'error': "Email already exists."}, status=400) # If the email is already registered then return an error.

        try:
            user = User.objects.create_user( # Create a new inactive user
                first_name=firstName, last_name=lastName,
                username=username, email=email, password=password,
                is_active=False 
            )

            token = default_token_generator.make_token(user) # Generate a verification token and encode user ID
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            verification_url = f"{request.build_absolute_uri(reverse('verify_email', args=[uid, token]))}"

            async_send_verification_email(user, verification_url) # Send the verification email asynchronously
            return JsonResponse({'message': 'Registration successful, check your email to verify your account.'}, status=200)
        except Exception as e:
            return JsonResponse({'error': f"An error occurred during registration: {str(e)}"}, status=400)
    return JsonResponse({'error': 'Invalid request method'}, status=405)


def resend_verification_email(request, uid): # Resends the email verification link to inactive users.
    user = get_object_or_404(User, pk=urlsafe_base64_decode(uid).decode())
    if not user.is_active:
        verification_url = request.build_absolute_uri(reverse('verify_email', args=[uid, default_token_generator.make_token(user)]))
        async_send_verification_email(user, verification_url)  # Send the email asynchronously
        return JsonResponse({'message': 'A new verification email has been sent to your email address.'}, status=200)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)


def send_verification_email(user, verification_url):
    html_content = render_to_string('registration/email_resend.html', { # Render the email template
        'user': user,
        'verification_url': verification_url,
    })
    
    text_content = strip_tags(html_content)  # Convert HTML to plain text
    
    send_mail(
        'Welcome to Library ITUe!',  # Email subject
        text_content,  # Plain text content
        'libraryitue@gmail.com',  # From email
        [user.email],  # Recipient list
        fail_silently=False,
        html_message=html_content  # HTML content
    )

def async_send_verification_email(user, verification_url): # Sends the verification email in a separate thread to avoid waiting for the email to be sent.
    thread = threading.Thread(target=send_verification_email, args=(user, verification_url))
    thread.start()

def verify_email(request, uidb64, token): # Verifies the user's email using the provided UID and token. 
    try:
        uid = urlsafe_base64_decode(uidb64).decode('utf-8') # Decode the UID
        user = get_user_model().objects.get(pk=uid)
        
        if default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            messages.success(request, "Your email has been successfully verified!") # If the email is verified then return a success message
            return redirect('http://127.0.0.1:3000/?message=You%20verified%20your%20email') # Redirect to the frontend with a success message
        else:
            messages.error(request, "The verification link is invalid or expired.") # If the token is invalid or expired then return an error message
            return redirect('http://127.0.0.1:3000/?message=Verification%20failed')  # Redirect with error message

    except (TypeError, ValueError, OverflowError, user.DoesNotExist):
        messages.error(request, "Invalid verification link.")
        return redirect('http://127.0.0.1:3000/?message=Verification%20failed')  # Redirect with error message

class IsAdminUserOrReadOnly(BasePermission): # Custom permission to allow only admin users to modify objects, but read-only access for others.
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True  # Allow read-only access for all users
        return request.user and request.user.is_staff  # Only allow modifications for staff users


def borrowed_books_view(request): # Retrieves all borrowed books
    if not request.user.is_staff:
        return JsonResponse({'error': 'Unauthorized'}, status=403) # If the user is not a staff member then return an error.
    if request.method == 'GET':
        borrowed_books = LendedBook.objects.select_related('book', 'user').all() # Retrieve all lended books with related book and user data
        borrowed_books_data = [
            {
                'book': {
                    'title': book.book.title,
                    'isbn': book.book.isbn,
                    'authors': [{'name': author.name} for author in book.book.authors.all()],
                    'cover': book.book.cover.url if book.book.cover else None
                },
                'user': {
                    'username': book.user.username,
                    'firstName': book.user.first_name,
                    'lastName': book.user.last_name
                },
                'number': book.number,
                'borrowed_on': book.borrowed_on,
                'return_on': book.return_on
            }
            for book in borrowed_books
        ]
        return JsonResponse(borrowed_books_data, safe=False)
    return JsonResponse({'error': 'Invalid request method'}, status=405)

@require_http_methods(["POST"])
def change_password(request): # Allows authenticated users to change their password by providing the old and new passwords.
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401) # If the user is not authenticated then return an error.

    try:
        data = json.loads(request.body)
        old_password = data.get("old_password")
        new_password = data.get("new_password")
    except Exception as e:
        return JsonResponse({'error': 'Invalid format'}, status=400)

    if not old_password or not new_password:
        return JsonResponse({'error': 'Old and new passwords are required.'}, status=400) # If the old and new passwords are not provided then return an error.

    user = request.user
    if not user.check_password(old_password):
        return JsonResponse({'error': 'Old password is incorrect.'}, status=400) # If the old password is incorrect then return an error.

    try:
        validate_password(new_password, user)  # Validate the new password
    except ValidationError as e:
        return JsonResponse({'error': e.messages}, status=400) # If the new password is not strong enough then return an error.

    user.set_password(new_password)  # Update the user's password
    user.save()  # Save changes to the database
    return JsonResponse({'message': 'Password changed successfully.'}, status=200)

class BookViewSet(viewsets.ModelViewSet): # ViewSet for Book model
    queryset = Book.objects.prefetch_related('authors', 'genres', 'reviews').annotate(
        rating_avg=Avg('reviews__rating'),
        review_count=Count('reviews')
    ).only('isbn', 'title', 'copies', 'lended', 'cover', 'year')  # Optimize selected fields
    serializer_class = BookSerializer
    permission_classes = [IsAdminUserOrReadOnly]  # Apply custom permissions

class AuthorViewSet(viewsets.ModelViewSet): # ViewSet for Author model
    queryset = Author.objects.all()
    serializer_class = AuthorSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]  # Allow read-only for unauthenticated users

class GenreViewSet(viewsets.ModelViewSet): # ViewSet for Genre model
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]  # Allow read-only for unauthenticated users

class LendedBookViewSet(viewsets.ModelViewSet): # ViewSet for LendedBook model
    queryset = LendedBook.objects.all()
    serializer_class = LendedBookSerializer
    permission_classes = [IsAdminUserOrReadOnly]  # Apply custom permissions

@require_http_methods(["DELETE"])
@login_required
def delete_review_view(request, review_id): # Allows a user to delete their own review.
    try:
        review = Review.objects.get(id=review_id, user=request.user) # Retrieve the review ensuring it belongs to the current user
        review.delete()  # Delete the review
        return JsonResponse({'message': 'Review deleted successfully.'}, status=200)
    except Review.DoesNotExist:
        return JsonResponse({'error': 'Review does not exist or you do not have permission to delete it.'}, status=404) # If the review does not exist or does not belong to the user then return an error.
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@login_required
def user_borrowed_books_view(request): # Retrieves all books currently borrowed by the authenticated user.
    try: 
        # Fetch borrowed books for the current user with related book and authors data
        borrowed_books = LendedBook.objects.filter(user=request.user).select_related('book').prefetch_related('book__authors')
        
        borrowed_books_data = [
            {
                'isbn': book.book.isbn,
                'title': book.book.title,
                'authors': [{'name': author.name} for author in book.book.authors.all()],
                'cover': f"http://127.0.0.1:8000{book.book.cover.url}" if book.book.cover else None,
                'borrowed_on': book.borrowed_on,
                'return_on': book.return_on
            }
            for book in borrowed_books
        ]
        
        return JsonResponse(borrowed_books_data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)