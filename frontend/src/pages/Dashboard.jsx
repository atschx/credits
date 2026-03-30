import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

const USD = (v) => {
  const n = Number(v) || 0
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function MiniBar({ data, color = '#3b82f6' }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
          <div
            className="w-full rounded-t transition-all hover:opacity-80"
            style={{ height: `${Math.max((d.value / max) * 100, 4)}%`, backgroundColor: color }}
          />
          <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
            {d.label}: ${USD(d.value)}
          </div>
        </div>
      ))}
    </div>
  )
}

function TrendChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="text-gray-400 text-sm text-center py-8">暂无收入数据</div>
  }

  const max = Math.max(...data.map((d) => Number(d.recognizedRevenue)), 1)
  const chartH = 140

  return (
    <div>
      <div className="flex items-end gap-2 px-2" style={{ height: chartH }}>
        {data.map((d, i) => {
          const h = Math.max((Number(d.recognizedRevenue) / max) * chartH, 4)
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end group relative" style={{ height: chartH }}>
              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                {d.month}: ${USD(d.recognizedRevenue)}
              </div>
              <div
                className="w-full max-w-[40px] rounded-t bg-blue-500 hover:bg-blue-600 transition-colors"
                style={{ height: h }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-2 px-2 mt-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-gray-400 truncate">
            {d.month.slice(5)}月
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((data) => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const summaryCards = stats ? [
    { label: '总余额', sub: 'Total Balance', value: `$${USD(stats.totalGranted - stats.totalConsumed)}`, color: 'bg-blue-500', textColor: 'text-blue-700' },
    { label: '已确认收入', sub: 'Recognized Revenue', value: `$${USD(stats.recognizedRevenue)}`, color: 'bg-green-500', textColor: 'text-green-700' },
    { label: '递延收入', sub: 'Deferred Revenue', value: `$${USD(stats.deferredRevenue)}`, color: 'bg-amber-500', textColor: 'text-amber-700' },
    { label: '累计消耗', sub: 'Total Consumed', value: `$${USD(stats.totalConsumed)}`, color: 'bg-red-500', textColor: 'text-red-700' },
  ] : []

  const navCards = [
    { label: '客户账户', sub: 'Accounts', value: stats?.totalAccounts ?? '-', active: stats?.activeAccounts, to: '/accounts', color: 'bg-blue-500' },
    { label: '费率卡', sub: 'Rate Cards', to: '/rate-cards', color: 'bg-purple-500' },
    { label: '授权类型', sub: 'Grant Types', to: '/grant-types', color: 'bg-green-500' },
    { label: '费用类目', sub: 'Fee Categories', to: '/fee-categories', color: 'bg-orange-500' },
  ]

  const accountRevenues = stats?.accountRevenue || []
  const monthlyRevenues = stats?.monthlyRevenue || []

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">仪表盘</h1>
      <p className="text-sm text-gray-400 mb-6">Dashboard Overview</p>

      {/* Financial summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-32" />
            </div>
          ))
        ) : (
          summaryCards.map((c) => (
            <div key={c.label} className="bg-white rounded-lg shadow p-5">
              <div className="text-xs text-gray-400 mb-1">{c.label} <span className="text-gray-300">{c.sub}</span></div>
              <div className={`text-2xl font-bold ${c.textColor}`}>{c.value}</div>
              <div className={`h-1 ${c.color} rounded mt-3`} />
            </div>
          ))
        )}
      </div>

      {/* Revenue trend + Per-account breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Monthly revenue trend */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">收入确认趋势 <span className="text-xs font-normal text-gray-400">Revenue Recognition Trend</span></h2>
          <p className="text-xs text-gray-400 mb-4">按月统计已确认收入（消耗触发的收入确认）</p>
          {loading ? (
            <div className="h-40 bg-gray-50 rounded animate-pulse" />
          ) : (
            <TrendChart data={monthlyRevenues} />
          )}
        </div>

        {/* Revenue split: recognized vs deferred */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">收入结构 <span className="text-xs font-normal text-gray-400">Revenue Split</span></h2>
          <p className="text-xs text-gray-400 mb-4">已确认 vs 递延收入</p>
          {loading || !stats ? (
            <div className="h-40 bg-gray-50 rounded animate-pulse" />
          ) : (() => {
            const recognized = Number(stats.recognizedRevenue) || 0
            const deferred = Number(stats.deferredRevenue) || 0
            const total = recognized + deferred || 1
            const recPct = ((recognized / total) * 100).toFixed(1)
            const defPct = ((deferred / total) * 100).toFixed(1)
            return (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-green-500 transition-all" style={{ width: `${recPct}%` }} />
                    <div className="h-full bg-amber-400 transition-all" style={{ width: `${defPct}%` }} />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm text-gray-600">已确认 Recognized</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">${USD(recognized)}</span>
                      <span className="text-xs text-gray-400 ml-1">{recPct}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-400" />
                      <span className="text-sm text-gray-600">递延 Deferred</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">${USD(deferred)}</span>
                      <span className="text-xs text-gray-400 ml-1">{defPct}%</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>总收入 Total</span>
                    <span className="font-semibold text-gray-700">${USD(total)}</span>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Per-account revenue table */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">客户收入排行 <span className="text-xs font-normal text-gray-400">Revenue by Account</span></h2>
          <p className="text-xs text-gray-400 mt-1">按已确认收入排序（消耗产生的收入确认金额）</p>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : accountRevenues.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">暂无消耗数据</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">排名</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">客户 Account</th>
                <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">消耗额度 Consumed</th>
                <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">确认收入 Revenue</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">占比</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accountRevenues.map((ar, i) => {
                const totalRev = Number(stats.recognizedRevenue) || 1
                const pct = ((Number(ar.recognizedRevenue) / totalRev) * 100).toFixed(1)
                return (
                  <tr key={ar.accountId} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-amber-100 text-amber-700' : 'bg-gray-50 text-gray-400'
                      }`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link to={`/accounts/${ar.accountId}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                        {ar.accountName}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-sm text-right font-mono text-gray-700">
                      ${USD(ar.totalConsumed)}
                    </td>
                    <td className="px-5 py-3 text-sm text-right font-mono font-semibold text-green-700">
                      ${USD(ar.recognizedRevenue)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick nav cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {navCards.map((c) => (
          <Link key={c.to} to={c.to} className="block">
            <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <div className="text-sm text-gray-700">{c.label}</div>
              <div className="text-xs text-gray-400">{c.sub}</div>
              <div className={`h-0.5 ${c.color} rounded mt-2`} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
