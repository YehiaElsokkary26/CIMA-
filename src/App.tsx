import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/store/toastStore'
import { supabase } from '@/lib/supabase'
import { usersApi } from '@/lib/api'
import ToastContainer from '@/components/ui/Toast'
import AppShell from '@/components/layout/AppShell'
import WelcomePage from '@/pages/WelcomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import OnboardingPage from '@/pages/OnboardingPage'
import HomePage from '@/pages/HomePage'
import VotePage from '@/pages/VotePage'
import FilmDetailPage from '@/pages/FilmDetailPage'
import UploadPage from '@/pages/UploadPage'
import ProfilePage from '@/pages/ProfilePage'
import EditProfilePage from '@/pages/EditProfilePage'
import CrewPage from '@/pages/CrewPage'
import DiscoverPage from '@/pages/DiscoverPage'
import NotificationsPage from '@/pages/NotificationsPage'
import RevealPage from '@/pages/RevealPage'
import SettingsPage from '@/pages/SettingsPage'

// ─── Route guards ────────────────────────────────────────────────────────────

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  if (isLoggedIn) return <Navigate to="/home" replace />
  return <>{children}</>
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const hasSelectedRole = useAuthStore((s) => s.hasSelectedRole)
  if (!isLoggedIn) return <Navigate to="/welcome" replace />
  if (hasSelectedRole) return <Navigate to="/home" replace />
  return <>{children}</>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const hasSelectedRole = useAuthStore((s) => s.hasSelectedRole)
  if (!isLoggedIn) return <Navigate to="/welcome" replace />
  if (!hasSelectedRole) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function FilmmakerRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const role = useAuthStore((s) => s.role)

  useEffect(() => {
    if (role !== 'filmmaker') {
      toast.error('Only filmmakers can upload films. You can switch on your profile.')
      navigate('/home', { replace: true })
    }
  }, [role, navigate])

  if (role !== 'filmmaker') return null
  return <>{children}</>
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const { isDarkMode } = useUIStore()
  const { setAuth, logout } = useAuthStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  // Supabase session restoration + auth state sync
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const profile = (await usersApi.get(session.user.id)).data
          setAuth(session.access_token, profile)
        } catch { /* profile row may not exist yet right after signup */ }
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        logout()
      } else if (session && (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN')) {
        try {
          const profile = (await usersApi.get(session.user.id)).data
          setAuth(session.access_token, profile)
        } catch { /* profile row may not exist yet right after signup */ }
      }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <ToastContainer />
      <Routes>
        {/* Public */}
        <Route path="/welcome" element={<PublicOnlyRoute><WelcomePage /></PublicOnlyRoute>} />
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
        <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
        {/* Not guarded: the reset link signs you in, and the page must stay open. */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Role selection: signed in, no role yet */}
        <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />

        <Route path="/" element={<Navigate to="/home" replace />} />
        {/* Old name for the crew screen */}
        <Route path="/cima" element={<Navigate to="/crew" replace />} />

        {/* App */}
        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/vote" element={<VotePage />} />
          <Route path="/reveal" element={<RevealPage />} />
          <Route path="/film/:id" element={<FilmDetailPage />} />
          <Route path="/upload" element={<FilmmakerRoute><UploadPage /></FilmmakerRoute>} />
          <Route path="/profile/me/edit" element={<EditProfilePage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/crew" element={<CrewPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </>
  )
}
