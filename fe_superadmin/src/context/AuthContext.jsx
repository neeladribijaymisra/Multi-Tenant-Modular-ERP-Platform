import { createContext, useContext, useEffect, useState } from 'react'
import { apiRequest } from '../lib/api'

const AuthContext = createContext(null)
const USER_KEY = 'erp_sa_user'
const TOKEN_KEY = 'erp_sa_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(USER_KEY)
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifySession = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await apiRequest('/auth/verify', { token })
        const userData = response.user
        setUser(userData)
        localStorage.setItem(USER_KEY, JSON.stringify(userData))
      } catch (error) {
        setUser(null)
        setToken(null)
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem(TOKEN_KEY)
      } finally {
        setLoading(false)
      }
    }

    verifySession()
  }, [token])

  const login = async (username, password) => {
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: { username, password },
      })

      const userData = response.user
      setUser(userData)
      setToken(response.token)
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
      localStorage.setItem(TOKEN_KEY, response.token)
      return { success: true }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  const logout = async () => {
    try {
      if (token) {
        await apiRequest('/auth/logout', { method: 'POST', token })
      }
    } catch (error) {
      // Clear session locally even if the logout request fails.
    }

    setUser(null)
    setToken(null)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(TOKEN_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
