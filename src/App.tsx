import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import OnboardingConnectChild from './pages/OnboardingConnectChild'
import OnboardingJoinFamily from './pages/OnboardingJoinFamily'

import ParentDashboard from './pages/parent/Dashboard'
import ParentTasks from './pages/parent/Tasks'
import ParentApprovals from './pages/parent/Approvals'
import ParentRewards from './pages/parent/Rewards'
import ParentGrades from './pages/parent/Grades'
import ParentSettings from './pages/parent/Settings'

import ChildDashboard from './pages/child/Dashboard'
import ChildTasks from './pages/child/Tasks'
import ChildRewards from './pages/child/Rewards'
import ChildGrades from './pages/child/Grades'
import ChildHistory from './pages/child/History'

function Home() {
  const { profile, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center">Lädt…</div>
  if (!profile) return <Navigate to="/login" replace />
  if (profile.role === 'child' && !profile.family_id) return <Navigate to="/onboarding/join-family" replace />
  return <Navigate to={profile.role === 'parent' ? '/parent/dashboard' : '/child/dashboard'} replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/onboarding/connect-child"
              element={
                <ProtectedRoute role="parent">
                  <OnboardingConnectChild />
                </ProtectedRoute>
              }
            />
            <Route path="/onboarding/join-family" element={<OnboardingJoinFamily />} />

            <Route path="/parent/dashboard" element={<ProtectedRoute role="parent"><ParentDashboard /></ProtectedRoute>} />
            <Route path="/parent/tasks" element={<ProtectedRoute role="parent"><ParentTasks /></ProtectedRoute>} />
            <Route path="/parent/approvals" element={<ProtectedRoute role="parent"><ParentApprovals /></ProtectedRoute>} />
            <Route path="/parent/rewards" element={<ProtectedRoute role="parent"><ParentRewards /></ProtectedRoute>} />
            <Route path="/parent/grades" element={<ProtectedRoute role="parent"><ParentGrades /></ProtectedRoute>} />
            <Route path="/parent/settings" element={<ProtectedRoute role="parent"><ParentSettings /></ProtectedRoute>} />

            <Route path="/child/dashboard" element={<ProtectedRoute role="child"><ChildDashboard /></ProtectedRoute>} />
            <Route path="/child/tasks" element={<ProtectedRoute role="child"><ChildTasks /></ProtectedRoute>} />
            <Route path="/child/rewards" element={<ProtectedRoute role="child"><ChildRewards /></ProtectedRoute>} />
            <Route path="/child/grades" element={<ProtectedRoute role="child"><ChildGrades /></ProtectedRoute>} />
            <Route path="/child/history" element={<ProtectedRoute role="child"><ChildHistory /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
