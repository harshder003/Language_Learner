'use client'

import { useState, useEffect } from 'react'
import { api, Language, LearningItem } from '@/lib/api'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import AudioRecorder from '@/components/AudioRecorder'

export default function LogPage() {
  const router = useRouter()
  const { user } = useAuth()
  const userId = user?.userId || 0
  const [languages, setLanguages] = useState<Language[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState<number | null>(null)
  const [formData, setFormData] = useState<Partial<LearningItem>>({
    type: 'word',
    content: '',
    translation: '',
    meaning: '',
    pronunciation: '',
    example_usage: '',
    notes: '',
  })
  const [audioData, setAudioData] = useState<string | null>(null)
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
      if (langs.length > 0 && !selectedLanguage) {
        setSelectedLanguage(langs[0].id!)
      }
    } catch (error) {
      console.error('Failed to load languages:', error)
      setMessage({ type: 'error', text: 'Failed to load languages. Please add a language first.' })
    }
  }

  const handleAudioRecorded = async (audioBlob: Blob) => {
    // Convert blob to base64
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64Audio = reader.result as string
      setAudioData(base64Audio)
    }
    reader.readAsDataURL(audioBlob)
  }

  const handleAudioClear = () => {
    setAudioData(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLanguage || !formData.content) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' })
      return
    }

    setLoading(true)
    try {
      await api.createLearningItem({
        user_id: userId,
        language_id: selectedLanguage,
        type: formData.type as 'word' | 'sentence' | 'grammar' | 'letter',
        content: formData.content,
        translation: formData.translation,
        meaning: formData.meaning,
        pronunciation: formData.pronunciation,
        audio_data: audioData || undefined,
        example_usage: formData.example_usage,
        notes: formData.notes,
      })
      setMessage({ type: 'success', text: 'Learning item logged successfully!' })
      setFormData({
        type: 'word',
        content: '',
        translation: '',
        meaning: '',
        pronunciation: '',
        example_usage: '',
        notes: '',
      })
      setAudioData(null)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to log learning item' })
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-amber-400">Log New Learning</h1>
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

        {languages.length === 0 ? (
          <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-400 dark:border-amber-700 p-4 rounded-lg mb-4">
            <p className="mb-2 text-amber-800 dark:text-amber-300">No languages found. Please add a language first.</p>
            <button
              onClick={() => router.push('/languages')}
              className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white px-4 py-2 rounded-lg transition"
            >
              Add Language
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Language *</label>
              <select
                value={selectedLanguage || ''}
                onChange={(e) => setSelectedLanguage(parseInt(e.target.value))}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
                required
              >
                <option value="">Select a language</option>
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.language_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
                required
              >
                <option value="word">Word</option>
                <option value="sentence">Sentence</option>
                <option value="grammar">Grammar</option>
                <option value="letter">Letter</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Content (in target language) *</label>
              <input
                type="text"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Translation</label>
              <input
                type="text"
                value={formData.translation}
                onChange={(e) => setFormData({ ...formData, translation: e.target.value })}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Meaning</label>
              <textarea
                value={formData.meaning}
                onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
                rows={3}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Pronunciation (Text)</label>
              <input
                type="text"
                value={formData.pronunciation}
                onChange={(e) => setFormData({ ...formData, pronunciation: e.target.value })}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
                placeholder="e.g., /həˈloʊ/"
              />
            </div>

            <div className="mb-4">
              <AudioRecorder
                onRecordingComplete={handleAudioRecorded}
                onClear={handleAudioClear}
                initialAudio={audioData}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Example Usage</label>
              <textarea
                value={formData.example_usage}
                onChange={(e) => setFormData({ ...formData, example_usage: e.target.value })}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
                rows={2}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
                rows={2}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging...' : 'Log Learning'}
            </button>
          </form>
        )}
      </div>
    </main>
    </ProtectedRoute>
  )
}

