import { createContext, useContext, useState } from "react"

export type UserRole = "admin" | "manager"

interface Account {
  email: string
  password: string
  name: string
  role: UserRole
}

// Mock credentials — there's no real backend yet, so this validates
// client-side against a fixed list of accounts. Swap this check for a real API
// call later; useAuth()'s shape stays the same.
const ACCOUNTS: Account[] = [
  {
    email: "admin@hobinh.com",
    password: "webadmin.Tanay.2026",
    name: "Admin",
    role: "admin",
  },
  {
    email: "manager@hobinh.com",
    password: "hobinh.jui.2026",
    name: "Jui",
    role: "manager",
  },
]

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  manager: "Manager",
}

interface AuthContextValue {
  isAuthenticated: boolean
  userEmail: string | null
  userName: string | null
  role: UserRole | null
  login: (email: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const STORAGE_KEY = "auth"
const EMAIL_STORAGE_KEY = "auth_email"

function findAccount(email: string | null) {
  if (!email) return null
  const normalized = email.trim().toLowerCase()
  return ACCOUNTS.find((a) => a.email === normalized) ?? null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "true"
  )
  const [userEmail, setUserEmail] = useState<string | null>(() =>
    localStorage.getItem(EMAIL_STORAGE_KEY)
  )

  // Name and role are derived from the stored email rather than persisted
  // beside it, so sessions created before roles existed still resolve, and
  // editing an account here can't leave a stale value in localStorage.
  const account = findAccount(userEmail)

  function login(email: string, password: string) {
    const normalized = email.trim().toLowerCase()
    const match = ACCOUNTS.find((a) => a.email === normalized && a.password === password)
    if (!match) return false

    localStorage.setItem(STORAGE_KEY, "true")
    localStorage.setItem(EMAIL_STORAGE_KEY, match.email)
    setIsAuthenticated(true)
    setUserEmail(match.email)
    return true
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(EMAIL_STORAGE_KEY)
    setIsAuthenticated(false)
    setUserEmail(null)
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userEmail,
        userName: account?.name ?? null,
        role: account?.role ?? null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
