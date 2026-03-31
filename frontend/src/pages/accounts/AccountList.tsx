import { useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import useApi from '../../hooks/useApi'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import StatusBadge from '../../components/StatusBadge'
import type { Account, RateCard, PageResult, SelectOption } from '../../types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AccountFilters {
  status: string
  keyword: string
  createdFrom: string
  createdTo: string
  lastConsumptionFrom: string
  lastConsumptionTo: string
  lastRechargeFrom: string
  lastRechargeTo: string
}

interface AccountFormState {
  name: string
  billingEmail: string
  rateCardId: string
}

type CreateStep = 'form' | 'confirm'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const emptyFilters: AccountFilters = {
  status: '',
  keyword: '',
  createdFrom: '',
  createdTo: '',
  lastConsumptionFrom: '',
  lastConsumptionTo: '',
  lastRechargeFrom: '',
  lastRechargeTo: '',
}

const USD = (v: number | string | undefined): string => {
  const n = Number(v) || 0
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AccountList() {
  const [page, setPage] = useState<number>(1)
  const [size, setSize] = useState<number>(20)
  const [filters, setFilters] = useState<AccountFilters>(emptyFilters)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)
  const [sortBy, setSortBy] = useState<string>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const buildParams = (): Record<string, string | number> => {
    const params: Record<string, string | number> = { page, size }
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params[k] = v
    })
    if (sortBy) {
      params.sortBy = sortBy
      params.sortDir = sortDir
    }
    return params
  }

  const { data, loading, error, refetch } = useApi<PageResult<Account>>(
    () => api.get('/accounts', { params: buildParams() }),
    [page, size, filters, sortBy, sortDir],
  )
  const navigate = useNavigate()

  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [form, setForm] = useState<AccountFormState>({ name: '', billingEmail: '', rateCardId: '' })
  const [createStep, setCreateStep] = useState<CreateStep>('form')
  const [saving, setSaving] = useState<boolean>(false)
  const { data: rateCards } = useApi<RateCard[]>(() => api.get('/rate-cards'))

  const set = (field: keyof AccountFormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))
  const setFilter = (field: keyof AccountFilters) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters((f) => ({ ...f, [field]: e.target.value }))
    setPage(1)
  }

  const resetFilters = (): void => {
    setFilters(emptyFilters)
    setPage(1)
  }

  const handleSort = (key: string): void => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortDir('desc')
    }
    setPage(1)
  }

  const handleSizeChange = (newSize: number): void => {
    setSize(newSize)
    setPage(1)
  }

  const hasActiveFilters = Object.values(filters).some(Boolean)

  const closeCreateModal = (): void => {
    setModalOpen(false)
    setCreateStep('form')
    setForm({ name: '', billingEmail: '', rateCardId: '' })
  }

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.billingEmail)
  const canProceed = form.name.trim().length >= 2 && isEmailValid
  const selectedRateCard = (rateCards || []).find((rc) => rc.id === form.rateCardId)

  const save = async (): Promise<void> => {
    setSaving(true)
    try {
      const created = await api.post<Account>('/accounts', {
        ...form,
        rateCardId: form.rateCardId || null,
      })
      closeCreateModal()
      refetch()
      if (created?.id) navigate(`/accounts/${created.id}`)
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const rcOptions: SelectOption[] = (rateCards || []).map((rc) => ({ value: rc.id, label: rc.name }))

  const statusDot: Record<string, string> = {
    active: 'bg-green-500',
    suspended: 'bg-red-500',
    closed: 'bg-gray-400',
  }

  const SortHeader = ({ label, field }: { label: string; field: string }) => (
    <span
      className="cursor-pointer select-none hover:text-gray-700 inline-flex items-center gap-1"
      onClick={() => handleSort(field)}
    >
      {label}
      <span className="inline-flex flex-col -mb-0.5">
        <svg className={`w-3 h-3 -mb-1 ${sortBy === field && sortDir === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} viewBox="0 0 10 6" fill="currentColor"><path d="M5 0l5 6H0z" /></svg>
        <svg className={`w-3 h-3 ${sortBy === field && sortDir === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0h10z" /></svg>
      </span>
    </span>
  )

  if (error) return <div className="text-red-500">错误: {error}</div>

  const records: Account[] = data?.records || (data as unknown as Account[]) || []
  const total: number = data?.total ?? records.length

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
          新建账户 Create
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
            <option value="">全部状态 All</option>
            <option value="active">正常 Active</option>
            <option value="suspended">已停用 Suspended</option>
            <option value="closed">已关闭 Closed</option>
          </select>
          {/* Toggle advanced */}
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {showAdvanced ? '收起筛选 Less' : '更多筛选 More'}
          </button>
          {/* Reset */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm text-red-500 hover:text-red-700"
            >
              重置 Reset
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

      {/* Account list */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase">
          <div className="col-span-5"><SortHeader label="客户 Account" field="name" /></div>
          <div className="col-span-4 text-right"><SortHeader label="余额 Balance" field="totalBalance" /></div>
          <div className="col-span-3 text-right">创建时间 Created</div>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="p-5 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-9 h-9 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-40 mb-1" />
                  <div className="h-3 bg-gray-100 rounded w-48" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400 text-sm">
            {hasActiveFilters ? '未找到匹配的客户 No matching accounts' : '暂无客户账户 No accounts'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {records.map((acc) => {
              const bal = Number(acc.totalBalance) || 0
              return (
                <div
                  key={acc.id}
                  onClick={() => navigate(`/accounts/${acc.id}`)}
                  className={`grid grid-cols-12 gap-2 px-5 py-3.5 items-center cursor-pointer hover:bg-gray-50 transition-colors ${acc.status === 'suspended' || acc.status === 'closed' ? 'opacity-50' : ''}`}
                >
                  {/* Account info + status */}
                  <div className="col-span-5 flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                        acc.status === 'active' ? 'bg-blue-500' : acc.status === 'suspended' ? 'bg-red-400' : 'bg-gray-400'
                      }`}>
                        {acc.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${statusDot[acc.status] || 'bg-gray-400'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{acc.name}</div>
                      <div className="text-xs text-gray-400 truncate">{acc.billingEmail}</div>
                    </div>
                  </div>
                  {/* Balance */}
                  <div className="col-span-4 text-right">
                    <span className={`text-sm font-mono font-semibold ${bal > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                      ${USD(bal)}
                    </span>
                  </div>
                  {/* Created */}
                  <div className="col-span-3 text-right text-sm text-gray-400">
                    {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : '-'}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-3">
              <span>
                第 {(page - 1) * size + 1}-{Math.min(page * size, total)} 条，共 {total} 条
              </span>
              <select
                value={size}
                onChange={(e) => handleSizeChange(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-xs"
              >
                <option value={20}>20条/页</option>
                <option value={50}>50条/页</option>
                <option value={100}>100条/页</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
              >
                上一页 Prev
              </button>
              <span>{page} / {Math.max(1, Math.ceil(total / size))}</span>
              <button
                disabled={page >= Math.ceil(total / size)}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
              >
                下一页 Next
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={closeCreateModal} title="新建客户账户 Create Account" wide>
        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`flex items-center gap-2 ${createStep === 'form' ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${createStep === 'form' ? 'bg-blue-600 text-white' : 'bg-green-100 text-green-600'}`}>
              {createStep === 'form' ? '1' : '✓'}
            </span>
            <span className="text-sm font-medium">填写信息 Info</span>
          </div>
          <div className="flex-1 h-px bg-gray-200" />
          <div className={`flex items-center gap-2 ${createStep === 'confirm' ? 'text-blue-600' : 'text-gray-300'}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${createStep === 'confirm' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>2</span>
            <span className="text-sm font-medium">确认开户 Confirm</span>
          </div>
        </div>

        {createStep === 'form' ? (
          <>
            {/* Hero hint */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-5">
              <div className="text-sm font-medium text-blue-800">开设新客户账户</div>
              <div className="text-xs text-blue-600 mt-0.5">开户后将为客户创建独立的额度账户，支持授权、消耗和收入确认</div>
            </div>

            <FormField label="客户名称 Name" value={form.name} onChange={set('name')} placeholder="输入客户公司全称，如 Acme Corp" />
            {form.name.trim().length > 0 && form.name.trim().length < 2 && (
              <p className="text-xs text-amber-600 -mt-2 mb-4">客户名称至少 2 个字符</p>
            )}

            <FormField label="账单邮箱 Billing Email" type="email" value={form.billingEmail} onChange={set('billingEmail')} placeholder="billing@example.com" />
            {form.billingEmail && !isEmailValid && (
              <p className="text-xs text-red-500 -mt-2 mb-4">请输入有效的邮箱地址</p>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">费率方案 Rate Card</label>
              <div className="grid grid-cols-1 gap-2">
                {(rateCards || []).filter((rc) => rc.status === 'active').map((rc) => (
                  <label
                    key={rc.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      form.rateCardId === rc.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rateCard"
                      checked={form.rateCardId === rc.id}
                      onChange={() => setForm((f) => ({ ...f, rateCardId: rc.id }))}
                      className="accent-blue-600"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{rc.name}</div>
                      <div className="text-xs text-gray-400">
                        {rc.currency} · 生效 {new Date(rc.effectiveFrom).toLocaleDateString()} · {rc.effectiveTo ? `至 ${new Date(rc.effectiveTo).toLocaleDateString()}` : '永久有效'}
                      </div>
                    </div>
                    <StatusBadge status={rc.status} />
                  </label>
                ))}
                <label
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    form.rateCardId === '' ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="rateCard"
                    checked={form.rateCardId === ''}
                    onChange={() => setForm((f) => ({ ...f, rateCardId: '' }))}
                    className="accent-gray-600"
                  />
                  <div>
                    <div className="text-sm text-gray-500">暂不关联费率卡 No rate card</div>
                    <div className="text-xs text-gray-400">稍后可在账户详情中关联</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={closeCreateModal} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                取消 Cancel
              </button>
              <button
                onClick={() => setCreateStep('confirm')}
                disabled={!canProceed}
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                下一步 Next
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Confirm summary */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 mb-5 text-white">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">新客户 New Account</div>
              <div className="text-2xl font-bold mb-4">{form.name}</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400 text-xs mb-0.5">账单邮箱 Email</div>
                  <div className="font-medium">{form.billingEmail}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-0.5">费率方案 Rate Card</div>
                  <div className="font-medium">{selectedRateCard?.name || '未关联'}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-0.5">初始状态 Status</div>
                  <div className="font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400" />正常 Active
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-0.5">初始余额 Balance</div>
                  <div className="font-medium">$0.00</div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5 text-xs text-amber-700">
              <span className="font-medium">开户确认 —</span> 提交后将立即创建客户账户，账户初始余额为 0，需通过「授予额度」为客户充值后才可消耗。
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button onClick={() => setCreateStep('form')} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                返回修改 Back
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-6 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {saving ? '开户中... Creating' : '确认开户 Create Account'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
