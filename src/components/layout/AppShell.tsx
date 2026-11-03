import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import TabBar from './TabBar'
import Sidebar from './Sidebar'
import NavBar from './NavBar'

// Screens that bring their own top bar (full-bleed player, step flows).
const OWN_HEADER = [/^\/film\//, /^\/upload/, /^\/reveal/, /^\/notifications/, /^\/vote/, /^\/profile\/me\/edit/]

export default function AppShell() {
  const { pathname } = useLocation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const ownHeader = OWN_HEADER.some((r) => r.test(pathname))

  // Each screen starts at the top, like a new reel.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="flex w-full h-full bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden relative min-w-0">
        {!ownHeader && <NavBar />}
        <div ref={scrollRef} className="flex-1 scroll-container pb-24 lg:pb-10">
          <Outlet />
        </div>
        <div className="lg:hidden">
          <TabBar />
        </div>
      </main>
    </div>
  )
}
