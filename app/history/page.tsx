'use client'

import { useState, useEffect } from 'react'
import { api, LearningItem, Language } from '@/lib/api'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'

export default function HistoryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const userId = user?.userId || 0
  const [languages, setLanguages] = useState<Language[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<number | null>(null)
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [items, setItems] = useState<LearningItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadLanguages()
  }, [])

  useEffect(() => {
    if (selectedLanguage !== null || dateFilter !== 'all') {
      loadItems()
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

  const loadItems = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const data = await api.getLearningItems(
        userId,
        selectedLanguage || undefined,
        dateFilter
      )
      setItems(data)
    } catch (error) {
      console.error('Failed to load items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    try {
      await api.deleteLearningItem(id)
      loadItems()
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }

  const getLanguageName = (langId: number) => {
    return languages.find((l) => l.id === langId)?.language_name || 'Unknown'
  }

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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-amber-400">Learning History</h1>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6 border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Language</label>
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
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Date Filter</label>
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
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-600 dark:text-slate-400">Loading...</div>
          ) : items.length === 0 ? (
            <div className="bg-slate-100 dark:bg-slate-800 p-8 rounded-lg text-center border border-slate-200 dark:border-slate-700">
              <p className="text-slate-600 dark:text-slate-400">No learning items found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="inline-block bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs px-2 py-1 rounded mr-2">
                        {item.type}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {getLanguageName(item.language_id)}
                      </span>
                    </div>
                    <button
                      onClick={() => item.id && handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="text-2xl font-bold mb-3 text-slate-900 dark:text-amber-400">{item.content}</div>
                  {item.translation && (
                    <div className="mb-2 text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-900 dark:text-amber-400">Translation: </span>
                      {item.translation}
                    </div>
                  )}
                  {item.meaning && (
                    <div className="mb-2 text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-900 dark:text-amber-400">Meaning: </span>
                      {item.meaning}
                    </div>
                  )}
                  {item.pronunciation && (
                    <div className="mb-2 text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-900 dark:text-amber-400">Pronunciation: </span>
                      {item.pronunciation}
                    </div>
                  )}
                  {item.example_usage && (
                    <div className="mb-2 text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-900 dark:text-amber-400">Example: </span>
                      {item.example_usage}
                    </div>
                  )}
                  {item.notes && (
                    <div className="mb-2 text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-900 dark:text-amber-400">Notes: </span>
                      {item.notes}
                    </div>
                  )}
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    {item.created_at && new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  )
}

