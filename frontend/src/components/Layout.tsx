import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import Logo from './Logo'

const tabClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'nav-tab nav-tab--active' : 'nav-tab')

export function Layout() {
  const { signOut } = useAuth()
  const { pathname } = useLocation()

  // Start each screen at the top instead of keeping the last screen's scroll position.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Logo />
          <nav aria-label="Main" className="nav">
            <NavLink to="/briefing" className={tabClass}>
              Today
            </NavLink>
            <NavLink to="/watchlist" className={tabClass}>
              Watchlist
            </NavLink>
          </nav>
          <div className="spacer" />
          <button type="button" className="btn btn--outline" onClick={() => void signOut()}>
            Log out
          </button>
        </div>
      </header>
      <Outlet />
    </>
  )
}
