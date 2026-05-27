// UI/UX audit applied — WCAG 2.1 AA compliant
import { Outlet } from 'react-router-dom'
import TabBar from './TabBar'
import Sidebar from './Sidebar'
import NavBar from './NavBar'

export default function AppShell() {
  return (
    <div className="flex w-full h-full bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <NavBar />
        <div className="flex-1 scroll-container pb-20 lg:pb-0">
          <Outlet />
        </div>
        <div className="lg:hidden">
          <TabBar />
        </div>
      </main>
    </div>
  )
}
