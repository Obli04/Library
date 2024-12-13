from django.db import models
from datetime import date
from django.contrib.auth.models import User
from dateutil.relativedelta import relativedelta
from django.utils import timezone
from django.db.models import Avg

class Genre(models.Model):
    name = models.CharField(max_length=100, primary_key=True)

    def __str__(self):
        return self.name

class Author(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    

    def __str__(self):
        return self.name

class Book(models.Model):
    isbn = models.CharField(max_length=13, primary_key=True)
    title = models.CharField(max_length=200)
    copies = models.PositiveIntegerField(default=0)
    lended = models.PositiveIntegerField(default=0)
    cover = models.ImageField(upload_to='book_covers', blank=True, null=True)
    year = models.IntegerField(default=0)
    genres = models.ManyToManyField(Genre, related_name="books", through="Belong")
    authors = models.ManyToManyField(Author, related_name="books", through="Write")

    def __str__(self):
        return self.title

class Review(models.Model):
    id = models.AutoField(primary_key=True)
    content = models.TextField()
    rating = models.IntegerField()
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews")

    def __str__(self):
        return f"Review by {self.user} on {self.book}"

class LendedBook(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    number = models.PositiveIntegerField(default=1)
    borrowed_on = models.DateField(default=timezone.now)
    return_on = models.DateField(default=date.today() + relativedelta(months=1))

    class Meta:
        unique_together = ("user", "book")

class Wishlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("user", "book")

class Belong(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    genre = models.ForeignKey(Genre, on_delete=models.CASCADE)

class Write(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    author = models.ForeignKey(Author, on_delete=models.CASCADE)