'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'username' | 'answer' | 'reset'>('username')
  const [username, setUsername] = useState('')
  const [forgotAnswer, setForgotAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [question, setQuestion] = useState('')
  const [userId, setUserId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // First, get the question for this username
      const response = await axios.post('/api/auth/forgot-password', { username })
      if (response.data.success) {
        setQuestion(response.data.question)
        setUserId(response.data.userId)
        setStep('answer')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'User not found')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post('/api/auth/forgot-password', { username, forgot_answer: forgotAnswer })
      if (response.data.success) {
        setStep('reset')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Incorrect answer')
    } finally {
      setLoading(false)
    }
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await axios.post('/api/auth/reset-password', {
        userId,
        newPassword
      })
      if (response.data.success) {
        router.push('/login')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
        <h1 className="text-3xl font-bold text-center mb-2 text-slate-900 dark:text-amber-400">
          Reset Password
        </h1>
        <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
          {step === 'username' && 'Enter your username to retrieve your security question'}
          {step === 'answer' && 'Answer your security question'}
          {step === 'reset' && 'Enter your new password'}
        </p>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {step === 'username' && (
          <form onSubmit={handleUsernameSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Continue'}
            </button>
          </form>
        )}

        {step === 'answer' && (
          <form onSubmit={handleAnswerSubmit} className="space-y-6">
            {question && (
              <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Security Question:</p>
                <p className="text-slate-900 dark:text-slate-100">{question}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Security Answer
              </label>
              <input
                type="text"
                value={forgotAnswer}
                onChange={(e) => setForgotAnswer(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-6">

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}

