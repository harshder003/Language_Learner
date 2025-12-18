'use client'

import { useState, useEffect } from 'react'
import { api, Language } from '@/lib/api'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'

export default function LanguagesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const userId = user?.userId || 0
  const [languages, setLanguages] = useState<Language[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ language_code: '', language_name: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadLanguages()
  }, [])

  const loadLanguages = async () => {
    if (!userId) return
    try {
      const langs = await api.getLanguages(userId)
      setLanguages(langs)
    } catch (error) {
      console.error('Failed to load languages:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.language_code || !formData.language_name) {
      setMessage({ type: 'error', text: 'Please fill in all fields' })
      return
    }

    setLoading(true)
    try {
      await api.createLanguage({
        user_id: userId,
        language_code: formData.language_code,
        language_name: formData.language_name,
      })
      setMessage({ type: 'success', text: 'Language added successfully!' })
      setFormData({ language_code: '', language_name: '' })
      setShowForm(false)
      loadLanguages()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add language'
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen p-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => router.push('/')}
              className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 mb-4"
            >
              ← Back to Home
            </button>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-amber-400">Manage Languages</h1>
          </div>

          {message && (
            <div
              className={`p-4 rounded-lg mb-4 border ${
                message.type === 'success' 
                  ? 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-700 text-green-800 dark:text-green-300' 
                  : 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-700 text-red-800 dark:text-red-300'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="mb-6">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white px-4 py-2 rounded-lg transition"
            >
              {showForm ? 'Cancel' : '+ Add Language'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-6 border border-slate-200 dark:border-slate-700">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Language Code (e.g., en, es, fr)</label>
                <input
                  type="text"
                  value={formData.language_code}
                  onChange={(e) => setFormData({ ...formData, language_code: e.target.value })}
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
                  placeholder="en"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Language Name</label>
                <input
                  type="text"
                  value={formData.language_name}
                  onChange={(e) => setFormData({ ...formData, language_name: e.target.value })}
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
                  placeholder="English"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Language'}
              </button>
            </form>
          )}

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold p-4 border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-amber-400">Your Languages</h2>
            {languages.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                No languages added yet. Add your first language to get started!
              </div>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {languages.map((lang) => (
                  <li key={lang.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-lg text-slate-900 dark:text-slate-100">{lang.language_name}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Code: {lang.language_code}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}

