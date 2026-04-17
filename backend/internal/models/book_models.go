package models

type Book struct {
	ID          uint   `gorm:"primaryKey"`
	Title       string
	Description string
	PublishedYear int

	Authors []Author `gorm:"many2many:books_authors;"`
	Genres  []Genre  `gorm:"many2many:books_genres;"`
}

type Author struct {
	ID   uint   `gorm:"primaryKey"`
	Name string
}

type Genre struct {
	ID   uint   `gorm:"primaryKey"`
	Name string
}

type BookAuthor struct {
	BookID   uint `gorm:"primaryKey"`
	AuthorID uint `gorm:"primaryKey"`
}

type BookGenre struct {
	BookID  uint `gorm:"primaryKey"`
	GenreID uint `gorm:"primaryKey"`
}