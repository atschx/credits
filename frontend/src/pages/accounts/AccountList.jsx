import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import useApi from '../../hooks/useApi'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import StatusBadge from '../../components/StatusBadge'

const emptyFilters = {
  status: '',
  keyword: '',
  createdFrom: '',
  createdTo: '',
  lastConsumptionFrom: '',
  lastConsumptionTo: '',
  lastRechargeFrom: '',
  lastRechargeTo: '',
}

const USD = (v) => {
  const n = Number(v) || 0
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function AccountList() {
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)
  const [filters, setFilters] = useState(emptyFilters)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [sortBy, setSortBy] = useState('')
  const [sortDir, setSortDir] = useState('desc')

  const buildParams = () => {
    const params = { page, size }
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params[k] = v
    })
    if (sortBy) {
      params.sortBy = sortBy
      params.sortDir = sortDir
    }
    return params
  }

  const { data, loading, error, refetch } = useApi(
    () => api.get('/accounts', { params: buildParams() }),
    [page, size, filters, sortBy, sortDir]
  )
  const navigate = useNavigate()

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', billingEmail: '', rateCardId: '' })
  const [saving, setSaving] = useState(false)
  const { data: rateCards } = useApi(() => api.get('/rate-cards'))

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const setFilter = (field) => (e) => {
    setFilters((f) => ({ ...f, [field]: e.target.value }))
    setPage(1)
  }

  const resetFilters = () => {
    setFilters(emptyFilters)
    setPage(1)
  }

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortDir('desc')
    }
    setPage(1)
  }

  const handleSizeChange = (newSize) => {
    setSize(newSize)
    setPage(1)
  }

  const hasActiveFilters = Object.values(filters).some(Boolean)

  const save = async () => {
    setSaving(true)
    try {
      await api.post('/accounts', {
        ...form,
        rateCardId: form.rateCardId || null,
      })
      setModalOpen(false)
      setForm({ name: '', billingEmail: '', rateCardId: '' })
      refetch()
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'name', header: '客户名称 Name', sortable: true },
    { key: 'billingEmail', header: '账单邮箱 Email' },
    {
      key: 'totalBalance',
      header: '余额 Balance',
      sortable: true,
      render: (v) => (
        <span className={`font-mono font-medium ${v > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
          ${USD(v)}
        </span>
      ),
    },
    { key: 'status', header: '状态 Status', render: (v) => <StatusBadge status={v} /> },
    {
      key: 'createdAt',
      header: '创建时间 Created',
      render: (v) => (v ? new Date(v).toLocaleDateString() : '-'),
    },
  ]

  const rcOptions = (rateCards || []).map((rc) => ({ value: rc.id, label: rc.name }))

  if (error) return <div className="text-red-500">错误: {error}</div>

  const records = data?.records || data || []
  const total = data?.total ?? records.length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">客户账户</h1>
          <p className="text-sm text-gray-400">Accounts</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          新建账户
        </button>
      </div>

      {/* Search filters */}
      <div className="bg-white rounded-lg shadow mb-4 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Keyword: name or email */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={filters.keyword}
              onChange={setFilter('keyword')}
              placeholder="搜索客户名或邮箱 Search name / email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {/* Status */}
          <select
            value={filters.status}
            onChange={setFilter('status')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">全部状态</option>
            <option value="active">正常 Active</option>
            <option value="suspended">已停用 Suspended</option>
            <option value="closed">已关闭 Closed</option>
          </select>
          {/* Toggle advanced */}
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {showAdvanced ? '收起筛选' : '更多筛选'}
          </button>
          {/* Reset */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm text-red-500 hover:text-red-700"
            >
              重置
            </button>
          )}
        </div>

        {/* Advanced filters */}
        {showAdvanced && (
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">注册日期 Registration</label>
              <div className="flex items-center gap-1">
                <input type="date" value={filters.createdFrom} onChange={setFilter('createdFrom')} className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm" />
                <span className="text-gray-300">~</span>
                <input type="date" value={filters.createdTo} onChange={setFilter('createdTo')} className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">最后消费 Last Consumption</label>
              <div className="flex items-center gap-1">
                <input type="date" value={filters.lastConsumptionFrom} onChange={setFilter('lastConsumptionFrom')} className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm" />
                <span className="text-gray-300">~</span>
                <input type="date" value={filters.lastConsumptionTo} onChange={setFilter('lastConsumptionTo')} className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">最后充值 Last Recharge</label>
              <div className="flex items-center gap-1">
                <input type="date" value={filters.lastRechargeFrom} onChange={setFilter('lastRechargeFrom')} className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm" />
                <span className="text-gray-300">~</span>
                <input type="date" value={filters.lastRechargeTo} onChange={setFilter('lastRechargeTo')} className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm" />
              </div>
            </div>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={records}
        page={page}
        size={size}
        total={total}
        onPageChange={setPage}
        onSizeChange={handleSizeChange}
        onRowClick={(row) => navigate(`/accounts/${row.id}`)}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="新建账户 Create Account">
        <FormField label="客户名称 Name" value={form.name} onChange={set('name')} />
        <FormField label="账单邮箱 Billing Email" type="email" value={form.billingEmail} onChange={set('billingEmail')} />
        <FormField label="费率卡 Rate Card" type="select" value={form.rateCardId} onChange={set('rateCardId')} options={rcOptions} />
        <div className="flex justify-end space-x-3 mt-4">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
            取消
          </button>
          <button onClick={save} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
