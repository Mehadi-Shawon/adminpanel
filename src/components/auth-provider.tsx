import { createContext, useContext, useState } from "react"

interface AuthContextValue {
  isAuthenticated: boolean
  userEmail: string | null
  login: (email: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const STORAGE_KEY = "auth"
const EMAIL_STORAGE_KEY = "auth_email"

// Mock credentials — there's no real backend yet, so this validates
// client-side against a fixed account. Swap this check for a real API
// call later; useAuth()'s shape (isAuthenticated/userEmail/login/logout) stays the same.
const VALID_EMAIL = "admin@hobinh.com"
const VALID_PASSWORD = "webadmin.Tanay.2026"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "true"
  )
  const [userEmail, setUserEmail] = useState<string | null>(() =>
    localStorage.getItem(EMAIL_STORAGE_KEY)
  )

  function login(email: string, password: string) {
    const success = email.trim().toLowerCase() === VALID_EMAIL && password === VALID_PASSWORD
    if (success) {
      localStorage.setItem(STORAGE_KEY, "true")
      localStorage.setItem(EMAIL_STORAGE_KEY, email.trim().toLowerCase())
      setIsAuthenticated(true)
      setUserEmail(email.trim().toLowerCase())
    }
    return success
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(EMAIL_STORAGE_KEY)
    setIsAuthenticated(false)
    setUserEmail(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
