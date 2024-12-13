from django.contrib import admin
from .models import Genre, Author, Book, Write, Belong, LendedBook, Wishlist, Review

class BookAdmin(admin.ModelAdmin):
    readonly_fields = ('lended',)

admin.site.register(Genre)
admin.site.register(Author)
admin.site.register(Book, BookAdmin)
admin.site.register(Write)
admin.site.register(Belong)
admin.site.register(LendedBook)
admin.site.register(Wishlist)
admin.site.register(Review)