'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

interface User {
  userId: number
  username: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  signup: (username: string, password: string, forgotQuestion: string, forgotAnswer: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await axios.post('/api/auth/verify', { token })
      if (response.data.valid) {
        setUser({
          userId: response.data.userId,
          username: response.data.username
        })
      } else {
        localStorage.removeItem('token')
      }
    } catch (error) {
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    const response = await axios.post('/api/auth/login', { username, password })
    if (response.data.success) {
      localStorage.setItem('token', response.data.token)
      setUser({
        userId: response.data.userId,
        username: response.data.username
      })
      router.push('/')
    } else {
      throw new Error(response.data.error || 'Login failed')
    }
  }

  const signup = async (username: string, password: string, forgotQuestion: string, forgotAnswer: string) => {
    const response = await axios.post('/api/auth/signup', {
      username,
      password,
      forgot_question: forgotQuestion,
      forgot_answer: forgotAnswer
    })
    if (response.data.success) {
      // Auto login after signup
      await login(username, password)
    } else {
      throw new Error(response.data.error || 'Signup failed')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

