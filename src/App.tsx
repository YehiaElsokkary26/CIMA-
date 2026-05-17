import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import AppShell from '@/components/layout/AppShell'
import OnboardingPage from '@/pages/OnboardingPage'
import HomePage from '@/pages/HomePage'
import FilmDetailPage from '@/pages/FilmDetailPage'
import UploadPage from '@/pages/UploadPage'
import ProfilePage from '@/pages/ProfilePage'
import CimaHubPage from '@/pages/CimaHubPage'
import DiscoverPage from '@/pages/DiscoverPage'
import NotificationsPage from '@/pages/NotificationsPage'
import SettingsPage from '@/pages/SettingsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  if (!isLoggedIn) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function FilmmakerRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (user?.role !== 'filmmaker') return <Navigate to="/home" replace />
  return <>{children}</>
}

export default function App() {
  const { isDarkMode } = useUIStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  return (
    <Routes>
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/" element={<Navigate to="/onboarding" replace />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<HomePage />} />
        <Route path="/film/:id" element={<FilmDetailPage />} />
        <Route
          path="/upload"
          element={
            <FilmmakerRoute>
              <UploadPage />
            </FilmmakerRoute>
          }
        />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/cima" element={<CimaHubPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  )
}
