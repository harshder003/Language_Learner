import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

export interface Language {
  id?: number
  user_id: number
  language_code: string
  language_name: string
}

export interface LearningItem {
  id?: number
  user_id: number
  language_id: number
  type: 'word' | 'sentence' | 'grammar' | 'letter'
  content: string
  translation?: string
  meaning?: string
  pronunciation?: string
  audio_data?: string
  example_usage?: string
  notes?: string
  created_at?: string
}

export interface FlashcardItem extends LearningItem {
  last_reviewed?: string
  review_count: number
  correct_count: number
}

export interface FlashcardSession {
  user_id: number
  language_id: number
  item_id: number
  was_correct: boolean
}

export const api = {
  // Languages
  getLanguages: async (userId: number): Promise<Language[]> => {
    const response = await axios.get(`${API_BASE}/languages?user_id=${userId}`)
    return response.data
  },

  createLanguage: async (language: Language): Promise<Language> => {
    const response = await axios.post(`${API_BASE}/languages`, language)
    return response.data
  },

  // Learning Items
  getLearningItems: async (
    userId: number,
    languageId?: number,
    dateFilter?: string
  ): Promise<LearningItem[]> => {
    let url = `${API_BASE}/items?user_id=${userId}`
    if (languageId) url += `&language_id=${languageId}`
    if (dateFilter) url += `&date_filter=${dateFilter}`
    const response = await axios.get(url)
    return response.data
  },

  createLearningItem: async (item: LearningItem): Promise<LearningItem> => {
    const response = await axios.post(`${API_BASE}/items`, item)
    return response.data
  },

  deleteLearningItem: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE}/items/delete?id=${id}`)
  },

  // Flashcards
  getFlashcards: async (
    userId: number,
    languageId?: number,
    dateFilter?: string
  ): Promise<FlashcardItem[]> => {
    let url = `${API_BASE}/flashcards?user_id=${userId}`
    if (languageId) url += `&language_id=${languageId}`
    if (dateFilter) url += `&date_filter=${dateFilter}`
    const response = await axios.get(url)
    return response.data
  },

  recordFlashcardSession: async (session: FlashcardSession): Promise<void> => {
    await axios.post(`${API_BASE}/flashcards`, session)
  },
}

