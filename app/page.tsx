'use client'

import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <main className="min-h-screen p-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-center text-slate-900 dark:text-amber-400">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
            Continue your language learning journey
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Link href="/log" className="block p-6 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105">
              <h2 className="text-2xl font-semibold mb-2">Log New Learning</h2>
              <p className="text-blue-100">Add new words, sentences, grammar, or letters you've learned today</p>
            </Link>
            
            <Link href="/flashcards" className="block p-6 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105">
              <h2 className="text-2xl font-semibold mb-2">Practice with Flashcards</h2>
              <p className="text-green-100">Review your previous learnings with customizable flashcards</p>
            </Link>
            
            <Link href="/languages" className="block p-6 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105">
              <h2 className="text-2xl font-semibold mb-2">Manage Languages</h2>
              <p className="text-purple-100">Add or manage the languages you're learning</p>
            </Link>
            
            <Link href="/history" className="block p-6 bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105">
              <h2 className="text-2xl font-semibold mb-2">Learning History</h2>
              <p className="text-amber-100">View all your logged learnings</p>
            </Link>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  )
}

