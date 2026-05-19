export interface GoogleBookVolume {
  id: string
  volumeInfo: {
    title: string
    authors?: string[]
    description?: string
    pageCount?: number
    imageLinks?: {
      thumbnail: string
    }
    // TAMBAHKAN FIELD DI BAWAH INI:
    categories?: string[] // Ini untuk genres
    publishedDate?: string // Ini untuk publication_year
    language?: string // Ini untuk language
  }
}

export interface GoogleBooksResponse {
  items?: GoogleBookVolume[]
}
