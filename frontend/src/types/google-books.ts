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
  }
}

export interface GoogleBooksResponse {
  items?: GoogleBookVolume[]
}
