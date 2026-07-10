import { NavLink, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const parentNav = [
  { to: '/parent/dashboard', label: 'Übersicht' },
  { to: '/parent/tasks', label: 'Aufgaben' },
  { to: '/parent/approvals', label: 'Freigaben' },
  { to: '/parent/rewards', label: 'Belohnungen' },
  { to: '/parent/grades', label: 'Noten' },
  { to: '/parent/settings', label: 'Einstellungen' },
]

const childNav = [
  { to: '/child/dashboard', label: 'Start' },
  { to: '/child/tasks', label: 'Aufgaben' },
  { to: '/child/rewards', label: 'Belohnungen' },
  { to: '/child/grades', label: 'Noten' },
  { to: '/child/history', label: 'Verlauf' },
]

export function Layout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const nav = profile?.role === 'parent' ? parentNav : childNav
  const accent = profile?.role === 'parent' ? 'var(--color-parent)' : 'var(--color-child)'

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="text-xl shrink-0">🪙</span>
            <span className="font-display font-semibold text-base sm:text-lg truncate" style={{ color: accent }}>
              FamilyPoints
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-full font-medium transition ${
                    isActive
                      ? 'bg-[var(--color-paper-dim)] dark:bg-[var(--color-border-dark)]'
                      : 'hover:bg-[var(--color-paper-dim)]/60 dark:hover:bg-[var(--color-border-dark)]/60'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={toggle}
              aria-label="Dark Mode umschalten"
              className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)]"
            >
              {dark ? '☀️' : '🌙'}
            </button>
            <button
              onClick={async () => {
                await signOut()
                navigate('/login')
              }}
              aria-label="Abmelden"
              className="text-sm font-semibold px-3 py-1.5 rounded-full border border-[var(--color-paper-dim)] dark:border-[var(--color-border-dark)] whitespace-nowrap"
            >
              <span className="hidden sm:inline">Abmelden</span>
              <span className="sm:hidden">⎋</span>
            </button>
          </div>
        </div>
        <nav className="md:hidden flex overflow-x-auto gap-1 px-4 pb-2 text-sm">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-full font-medium whitespace-nowrap ${
                  isActive ? 'bg-[var(--color-paper-dim)] dark:bg-[var(--color-border-dark)]' : ''
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
