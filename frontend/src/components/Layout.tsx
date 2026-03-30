import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout(): React.ReactElement {
  const [collapsed, setCollapsed] = useState<boolean>(false)

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
          <div />
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M14.5 9a3.5 3.5 0 0 0-5 0M9.5 15a3.5 3.5 0 0 0 5 0" />
              <line x1="12" y1="9" x2="12" y2="15" />
            </svg>
            <span className="text-sm font-bold text-gray-700 tracking-tight">Credits</span>
            <span className="text-[10px] text-gray-400">System</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
