from django.urls import path, include
from .views import LendedBookViewSet, BookViewSet, AuthorViewSet, GenreViewSet
from .views import login_view, register_view, logout_view, resend_verification_email, get_csrf_token, change_password, password_reset_request
from .views import borrowed_books_view, return_book_view, add_book_view, edit_book_view, borrow_book_view
from .views import book_reviews_view, current_user_view, wishlist_view, search_books_view, delete_book_view
from .views import validate_reset_token, password_reset_confirm, delete_review_view, verify_email
from .views import user_borrowed_books_view
from rest_framework.routers import DefaultRouter

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'books', BookViewSet)
router.register(r'authors', AuthorViewSet)
router.register(r'genres', GenreViewSet)
router.register(r'lendedbooks', LendedBookViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/login/', login_view, name='login'),
    path('api/register/', register_view, name='register'),
    path('api/logout/', logout_view, name='logout'),
    path('api/get-csrf-token/', get_csrf_token, name='get_csrf_token'),
    path('api/borrowed-books/', borrowed_books_view, name='borrowed_books'),
    path('api/return-book/<str:isbn>/<str:username>/', return_book_view, name='return_book'),
    path('api/password-reset/', password_reset_request, name='password_reset_request'),
    path('api/add-book/', add_book_view, name='add_book'),
    path('api/edit-book/<str:isbn>/', edit_book_view, name='edit_book'),
    path('api/borrow/<str:isbn>/', borrow_book_view, name='borrow_book'),
    path('api/genres/', include(router.urls)),
    path('api/resend-verification-email/<uid>/', resend_verification_email, name='resend_verification_email'),    
    path('api/book-reviews/<str:isbn>/', book_reviews_view, name='book_reviews'),
    path('api/add-review/<str:isbn>/', book_reviews_view, name='add_review'),
    path('api/current-user/', current_user_view, name='current_user'),
    path('api/wishlist/', wishlist_view, name='wishlist'),
    path('api/wishlist/<str:isbn>/', wishlist_view, name='wishlist_item'),
    path('api/account/change_password/', change_password, name='change_password'),
    path('api/books/search/', search_books_view, name='search_books'),
    path('api/books/<str:isbn>/edit/', edit_book_view, name='edit_book'),
    path('api/books/<str:isbn>/delete/', delete_book_view, name='delete_book'),
    path('api/password-reset/validate-token/<str:uidb64>/<str:token>/', validate_reset_token, name='validate_reset_token'),
    path('api/password-reset/confirm/', password_reset_confirm, name='password_reset_confirm'),
    path('api/delete-review/<int:review_id>/', delete_review_view, name='delete_review'),
    path('verify-email/<uidb64>/<token>/', verify_email, name='verify_email'),
    path('api/user-borrowed-books/', user_borrowed_books_view, name='user_borrowed_books'),
]