   # serializers.py
from rest_framework import serializers
from .models import Book, Author, Genre, LendedBook


class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = ['id', 'name']

        
class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['name']
        
class BookSerializer(serializers.ModelSerializer):
    genres = GenreSerializer(many=True, read_only=True)
    authors = AuthorSerializer(many=True, read_only=True)

    
    class Meta:
        model = Book
        fields = ['isbn', 'title', 'copies', 'lended', 'cover', 'year', 'genres', 'authors']

class LendedBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = LendedBook
        fields = ['id', 'book', 'user', 'borrowed_on', 'return_on'] 
