'use client'

import { useState, useEffect } from 'react'
import { api, FlashcardItem, Language, FlashcardSession } from '@/lib/api'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import AudioPlayer from '@/components/AudioPlayer'

export default function FlashcardsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const userId = user?.userId || 0
  const [languages, setLanguages] = useState<Language[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<number | null>(null)
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadLanguages()
  }, [])

  useEffect(() => {
    if (selectedLanguage !== null) {
      loadFlashcards()
    }
  }, [selectedLanguage, dateFilter])

  const loadLanguages = async () => {
    if (!userId) return
    try {
      const langs = await api.getLanguages(userId)
      setLanguages(langs)
      if (langs.length > 0 && selectedLanguage === null) {
        setSelectedLanguage(langs[0].id!)
      }
    } catch (error) {
      console.error('Failed to load languages:', error)
    }
  }

  const loadFlashcards = async () => {
    if (selectedLanguage === null || !userId) return
    setLoading(true)
    try {
      const cards = await api.getFlashcards(userId, selectedLanguage, dateFilter)
      setFlashcards(cards)
      setCurrentIndex(0)
      setShowAnswer(false)
    } catch (error) {
      console.error('Failed to load flashcards:', error)
    } finally {
      setLoading(false)
    }
  }

  const [message, setMessage] = useState<string | null>(null)

  const handleAnswer = async (wasCorrect: boolean) => {
    if (flashcards.length === 0 || currentIndex >= flashcards.length) return

    const currentCard = flashcards[currentIndex]
    try {
      await api.recordFlashcardSession({
        user_id: userId,
        language_id: currentCard.language_id,
        item_id: currentCard.id!,
        was_correct: wasCorrect,
      })

      // Move to next card
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setShowAnswer(false)
        setMessage(null)
      } else {
        // All cards reviewed
        setMessage('All flashcards reviewed! Loading more...')
        setTimeout(async () => {
          await loadFlashcards()
          setMessage(null)
        }, 1000)
      }
    } catch (error) {
      console.error('Failed to record flashcard session:', error)
      setMessage('Failed to save answer. Please try again.')
    }
  }

  const currentCard = flashcards[currentIndex]

  return (
    <ProtectedRoute>
      <main className="min-h-screen p-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => router.push('/')}
              className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 mb-4"
            >
              ← Back to Home
            </button>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-amber-400">Flashcards</h1>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6 border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Language</label>
              <select
                value={selectedLanguage || ''}
                onChange={(e) => setSelectedLanguage(parseInt(e.target.value))}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
              >
                <option value="">All Languages</option>
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.language_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date Filter</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
              >
                <option value="all">All Time</option>
                <option value="day">Previous Day</option>
                <option value="week">Previous Week</option>
                <option value="biweekly">Previous 2 Weeks</option>
                <option value="month">Previous Month</option>
              </select>
            </div>
          </div>

          {flashcards.length > 0 && (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Card {currentIndex + 1} of {flashcards.length}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-600 dark:text-slate-400">Loading flashcards...</div>
        ) : flashcards.length === 0 ? (
          <div className="bg-slate-100 dark:bg-slate-800 p-8 rounded-lg text-center border border-slate-200 dark:border-slate-700">
            <p className="text-slate-600 dark:text-slate-400">No flashcards found for the selected filters.</p>
            <button
              onClick={() => router.push('/log')}
              className="mt-4 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white px-4 py-2 rounded-lg transition"
            >
              Log Some Learnings First
            </button>
          </div>
        ) : currentCard ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 min-h-[400px] flex flex-col border border-slate-200 dark:border-slate-700">
            <div className="flex-1 flex items-center justify-center mb-6">
              <div className="text-center">
                <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">{currentCard.type.toUpperCase()}</div>
                <div className="text-4xl font-bold mb-4 text-slate-900 dark:text-amber-400">{currentCard.content}</div>
                {(currentCard.audio_data || currentCard.pronunciation) && (
                  <div className="mb-4 flex items-center justify-center gap-3">
                    {currentCard.audio_data && (
                      <AudioPlayer audioUrl={currentCard.audio_data} />
                    )}
                    {currentCard.pronunciation && (
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {currentCard.pronunciation}
                      </span>
                    )}
                  </div>
                )}
                {showAnswer && (
                  <div className="mt-6 space-y-3 text-left max-w-md mx-auto text-slate-700 dark:text-slate-300">
                    {currentCard.translation && (
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-amber-400">Translation: </span>
                        {currentCard.translation}
                      </div>
                    )}
                    {currentCard.meaning && (
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-amber-400">Meaning: </span>
                        {currentCard.meaning}
                      </div>
                    )}
                    {currentCard.pronunciation && !currentCard.audio_data && (
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-amber-400">Pronunciation: </span>
                        {currentCard.pronunciation}
                      </div>
                    )}
                    {currentCard.example_usage && (
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-amber-400">Example: </span>
                        {currentCard.example_usage}
                      </div>
                    )}
                    {currentCard.notes && (
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-amber-400">Notes: </span>
                        {currentCard.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              {!showAnswer ? (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white px-8 py-3 rounded-lg text-lg transition"
                >
                  Show Answer
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleAnswer(false)}
                    className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500 text-white px-8 py-3 rounded-lg text-lg transition"
                  >
                    ✗ Incorrect
                  </button>
                  <button
                    onClick={() => handleAnswer(true)}
                    className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500 text-white px-8 py-3 rounded-lg text-lg transition"
                  >
                    ✓ Correct
                  </button>
                </>
              )}
            </div>

            {currentCard.review_count > 0 && (
              <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                Reviewed {currentCard.review_count} times • 
                Correct {currentCard.correct_count} times
              </div>
            )}
          </div>
        ) : null}

        {message && (
          <div className="mt-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 p-4 rounded-lg text-green-800 dark:text-green-300 text-center">
            {message}
          </div>
        )}
      </div>
    </main>
    </ProtectedRoute>
  )
}

