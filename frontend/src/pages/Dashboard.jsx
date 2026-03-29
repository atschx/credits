import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

export default function Dashboard() {
  const [stats, setStats] = useState({ accounts: 0, rateCards: 0, grantTypes: 0, feeCategories: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/accounts', { params: { page: 1, size: 1 } }).catch(() => ({ total: 0 })),
      api.get('/rate-cards').catch(() => []),
      api.get('/dict/grant-types').catch(() => []),
      api.get('/dict/fee-categories').catch(() => []),
    ]).then(([accountsRes, rateCards, grantTypes, feeCategories]) => {
      setStats({
        accounts: accountsRes?.total ?? accountsRes?.length ?? 0,
        rateCards: rateCards?.length ?? 0,
        grantTypes: grantTypes?.length ?? 0,
        feeCategories: feeCategories?.length ?? 0,
      })
      setLoading(false)
    })
  }, [])

  const cards = [
    { label: '客户账户', sub: 'Accounts', value: stats.accounts, to: '/accounts', color: 'bg-blue-500' },
    { label: '费率卡', sub: 'Rate Cards', value: stats.rateCards, to: '/rate-cards', color: 'bg-purple-500' },
    { label: '授权类型', sub: 'Grant Types', value: stats.grantTypes, to: '/grant-types', color: 'bg-green-500' },
    { label: '费用类目', sub: 'Fee Categories', value: stats.feeCategories, to: '/fee-categories', color: 'bg-orange-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">仪表盘</h1>
      <p className="text-sm text-gray-400 mb-6">Dashboard Overview</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="block">
            <div className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow">
              <div className={`text-3xl font-bold ${loading ? 'text-gray-300' : 'text-gray-900'}`}>
                {loading ? '-' : c.value}
              </div>
              <div className="text-sm text-gray-700 mt-1">{c.label}</div>
              <div className="text-xs text-gray-400">{c.sub}</div>
              <div className={`h-1 ${c.color} rounded mt-3`} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
