import axios from 'axios'
import { GoogleBooksResponse } from '@/types/google-books'

export const externalService = {
  searchGoogleBooks: async (query: string): Promise<GoogleBooksResponse> => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY

    // Tambahkan parameter key di akhir URL
    const res = await axios.get<GoogleBooksResponse>(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8&key=${apiKey}`,
    )
    return res.data
  },
}
