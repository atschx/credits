import { NavLink } from 'react-router-dom'

interface IconCollapseProps {
  collapsed: boolean
}

interface NavLinkItem {
  to: string
  label: string
  sub: string
  icon: React.FC
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const IconDashboard: React.FC = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
)
const IconAccounts: React.FC = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
const IconGrantType: React.FC = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
)
const IconFeeCategory: React.FC = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
)
const IconRateCard: React.FC = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
  </svg>
)
const IconCollapse: React.FC<IconCollapseProps> = ({ collapsed }) => (
  <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const links: NavLinkItem[] = [
  { to: '/', label: '仪表盘', sub: 'Dashboard', icon: IconDashboard },
  { to: '/accounts', label: '客户账户', sub: 'Accounts', icon: IconAccounts },
  { to: '/grant-types', label: '授权类型', sub: 'Grant Types', icon: IconGrantType },
  { to: '/fee-categories', label: '费用类目', sub: 'Fee Categories', icon: IconFeeCategory },
  { to: '/rate-cards', label: '费率卡', sub: 'Rate Cards', icon: IconRateCard },
]

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside className={`${collapsed ? 'w-16' : 'w-56'} bg-gray-900 text-gray-300 flex flex-col shrink-0 transition-all duration-200`}>
      {/* Header */}
      <div className={`px-4 py-4 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div>
            <div className="text-base font-semibold text-white tracking-tight">Credits</div>
            <div className="text-[10px] text-gray-500">管理后台</div>
          </div>
        )}
        {collapsed && (
          <span className="text-lg font-bold text-white">C</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-1">
        {links.map(({ to, label, sub, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={collapsed ? `${label} ${sub}` : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white font-medium'
                  : 'hover:bg-gray-800 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <Icon />
            {!collapsed && (
              <span className="flex flex-col leading-tight">
                <span>{label}</span>
                <span className="text-[10px] text-gray-500">{sub}</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="px-3 py-3 flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 transition-colors border-t border-gray-800"
        title={collapsed ? '展开菜单 Expand' : '收起菜单 Collapse'}
      >
        <IconCollapse collapsed={collapsed} />
      </button>
    </aside>
  )
}
