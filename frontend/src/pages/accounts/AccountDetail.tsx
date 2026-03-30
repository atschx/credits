import { useState, type ChangeEvent, type ReactNode } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/client'
import useApi from '../../hooks/useApi'
import type {
  Account,
  CreditBalance,
  CreditGrant,
  CreditTransaction,
  GrantType,
  RateCard,
  PageResult,
  TransactionType,
} from '../../types'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import StatusBadge from '../../components/StatusBadge'
import ConfirmDialog from '../../components/ConfirmDialog'

// ============================================================================
// Helpers
// ============================================================================

const USD = (v: number | string): string => {
  const n = Number(v)
  const abs = Math.abs(n)
  const formatted = abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return n < 0 ? `-$${formatted}` : `$${formatted}`
}

// ============================================================================
// BalanceBar
// ============================================================================

interface BalanceBarProps {
  purchased: number
  promotional: number
  bonus: number
  total: number
}

interface BalanceSegment {
  value: number
  color: string
  hoverColor: string
  label: string
}

function BalanceBar({ purchased, promotional, bonus, total }: BalanceBarProps) {
  if (!total) return null
  const segments: BalanceSegment[] = [
    { value: purchased, color: 'bg-blue-500', hoverColor: 'hover:bg-blue-600', label: '购买 Purchased' },
    { value: promotional, color: 'bg-emerald-500', hoverColor: 'hover:bg-emerald-600', label: '推广 Promotional' },
    { value: bonus, color: 'bg-violet-500', hoverColor: 'hover:bg-violet-600', label: '奖励 Bonus' },
  ]
  const active = segments.filter(s => s.value > 0)
  return (
    <div className="flex h-3 rounded-full bg-gray-100 relative">
      {active.map((s, i) => (
        <div
          key={s.label}
          className={`${s.color} ${s.hoverColor} transition-all cursor-default relative group h-full ${i === 0 ? 'rounded-l-full' : ''} ${i === active.length - 1 ? 'rounded-r-full' : ''}`}
          style={{ width: `${(s.value / total) * 100}%` }}
        >
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            <div className="font-medium">{s.label}</div>
            <div>{USD(s.value)}（{((s.value / total) * 100).toFixed(1)}%）</div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// GrantCard
// ============================================================================

interface GrantCardProps {
  grant: CreditGrant
  grantTypes: GrantType[] | null
}

interface GrantColorSet {
  bar: string
  barWarn: string
}

const grantTypeColors: Record<string, GrantColorSet> = {
  purchased: { bar: 'bg-blue-500', barWarn: 'bg-amber-500' },
  promotional: { bar: 'bg-emerald-500', barWarn: 'bg-amber-500' },
  bonus: { bar: 'bg-violet-500', barWarn: 'bg-amber-500' },
}

function GrantCard({ grant, grantTypes }: GrantCardProps) {
  const remainPct = grant.originalAmount > 0 ? (grant.remainingAmount / grant.originalAmount) * 100 : 0
  const usedPct = 100 - remainPct
  const isExpired = grant.expiresAt != null && new Date(grant.expiresAt) < new Date()
  const isDepleted = grant.remainingAmount === 0
  const isLow = !isDepleted && !isExpired && usedPct >= 80

  const gtCode = (grantTypes || []).find((t) => t.id === grant.grantTypeId)?.code || 'purchased'
  const colors = grantTypeColors[gtCode] || grantTypeColors.purchased

  let borderCls = 'border-gray-200 bg-white'
  if (isExpired || isDepleted) borderCls = 'border-gray-200 bg-gray-50 opacity-60'
  else if (isLow) borderCls = 'border-amber-200 bg-amber-50'

  return (
    <div className={`border rounded-lg p-4 ${borderCls}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{grant.sourceReference || grant.id.slice(0, 8)}</span>
          {isExpired && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-medium">已过期</span>}
          {isDepleted && !isExpired && <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded font-medium">已耗尽</span>}
          {isLow && <span className="text-[10px] px-1.5 py-0.5 bg-amber-200 text-amber-700 rounded font-medium">余额低</span>}
        </div>
        <span className="text-[11px] text-gray-400 font-mono">
          {grant.costBasisPerUnit > 0 ? `${USD(grant.costBasisPerUnit)}/cr` : '免费 Free'}
        </span>
      </div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xl font-bold text-gray-900">{USD(grant.remainingAmount)}</span>
        <span className="text-xs text-gray-400">共 {USD(grant.originalAmount)}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full ${isExpired || isDepleted ? 'bg-gray-300' : isLow ? colors.barWarn : colors.bar}`}
          style={{ width: `${Math.min(remainPct, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-gray-400">
        <span>授予 {new Date(grant.createdAt).toLocaleDateString()}</span>
        <span className={isExpired ? 'text-red-400' : ''}>
          {grant.expiresAt ? (isExpired ? '已过期 ' : '到期 ') + new Date(grant.expiresAt).toLocaleDateString() : '永不过期'}
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// Constants
// ============================================================================

const txTypeLabels: Record<TransactionType, string> = {
  purchase: '购买',
  promotional: '推广赠送',
  bonus: '奖励赠送',
  consumption: '消耗',
  refund: '退款',
  expiration: '过期',
  adjustment: '调整',
}

const txTypeColors: Record<TransactionType, string> = {
  purchase: 'bg-blue-50 text-blue-700',
  promotional: 'bg-emerald-50 text-emerald-700',
  bonus: 'bg-violet-50 text-violet-700',
  consumption: 'bg-orange-50 text-orange-700',
  refund: 'bg-green-50 text-green-700',
  expiration: 'bg-gray-100 text-gray-600',
  adjustment: 'bg-purple-50 text-purple-700',
}

interface GrantForm {
  grantTypeCode: string
  amount: string
  costBasisPerUnit: string
  currency: string
  sourceReference: string
  expiryDays: string
}

const emptyGrantForm: GrantForm = { grantTypeCode: '', amount: '', costBasisPerUnit: '', currency: 'USD', sourceReference: '', expiryDays: '' }
const LARGE_AMOUNT_THRESHOLD = 50000

type GrantStep = 'form' | 'confirm'
type BlockConfirmAction = 'suspend' | null

// ============================================================================
// AccountDetail
// ============================================================================

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: account, loading, error, refetch: refetchAccount } = useApi<Account>(() => api.get(`/accounts/${id}`), [id])
  const { data: balance, refetch: refetchBalance } = useApi<CreditBalance>(() => api.get(`/accounts/${id}/balance`), [id])
  const { data: grants, refetch: refetchGrants } = useApi<CreditGrant[]>(() => api.get('/credits/grants', { params: { accountId: id } }), [id])
  const { data: grantTypes } = useApi<GrantType[]>(() => api.get('/grant-types'))
  const { data: rateCards } = useApi<RateCard[]>(() => api.get('/rate-cards'))

  // Grant modal
  const [grantModal, setGrantModal] = useState(false)
  const [grantForm, setGrantForm] = useState<GrantForm>(emptyGrantForm)
  const [grantStep, setGrantStep] = useState<GrantStep>('form')
  const [saving, setSaving] = useState(false)
  const setField = (field: keyof GrantForm) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const val = e.target.value
    if (field === 'grantTypeCode') {
      const gt = (grantTypes || []).find(t => t.code === val)
      setGrantForm((f) => ({
        ...f,
        grantTypeCode: val,
        expiryDays: gt ? String(gt.defaultExpiryDays) : '',
        costBasisPerUnit: gt ? (gt.isRevenueBearing ? '1.00' : '0') : '',
      }))
    } else {
      setGrantForm((f) => ({ ...f, [field]: val }))
    }
  }

  const closeGrantModal = () => {
    setGrantModal(false)
    setGrantStep('form')
    setGrantForm(emptyGrantForm)
  }

  const selectedGrantType = (grantTypes || []).find(t => t.code === grantForm.grantTypeCode)
  const isPurchased = grantForm.grantTypeCode === 'purchased'
  const grantAmount = Number(grantForm.amount) || 0
  const isLargeAmount = grantAmount >= LARGE_AMOUNT_THRESHOLD
  const duplicateRef = grantForm.sourceReference && (grants || []).some(g => g.sourceReference === grantForm.sourceReference)
  const canProceedToConfirm = grantForm.grantTypeCode && grantAmount > 0 && (!isPurchased || grantForm.sourceReference)

  // Block confirm
  const [blockConfirm, setBlockConfirm] = useState<BlockConfirmAction>(null)

  const submitGrant = async () => {
    setSaving(true)
    try {
      await api.post('/credits/grant', {
        accountId: id,
        grantTypeCode: grantForm.grantTypeCode,
        amount: Number(grantForm.amount),
        costBasisPerUnit: grantForm.costBasisPerUnit ? Number(grantForm.costBasisPerUnit) : null,
        currency: grantForm.currency,
        sourceReference: grantForm.sourceReference || null,
        expiryDays: grantForm.expiryDays ? Number(grantForm.expiryDays) : null,
      })
      setGrantModal(false)
      setGrantStep('form')
      setGrantForm(emptyGrantForm)
      refetchBalance()
      refetchGrants()
      refetchTx()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const changeAccountStatus = async (newStatus: Account['status']) => {
    try {
      await api.put(`/accounts/${id}`, { status: newStatus })
      refetchAccount()
      setBlockConfirm(null)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  // Transactions
  const [txPage, setTxPage] = useState(1)
  const txSize = 10
  const { data: txData, refetch: refetchTx } = useApi<PageResult<CreditTransaction>>(
    () => api.get('/credits/transactions', { params: { accountId: id, page: txPage, size: txSize } }),
    [id, txPage]
  )

  const grantMap: Record<string, CreditGrant> = Object.fromEntries((grants || []).map(g => [g.id, g]))

  const txColumns = [
    {
      key: 'type',
      header: '类型 Type',
      render: (v: TransactionType): ReactNode => (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${txTypeColors[v] || 'bg-gray-100 text-gray-600'}`}>
          {txTypeLabels[v] || v}
        </span>
      ),
    },
    {
      key: 'grantId',
      header: '关联授权 Grant',
      render: (v: string | null): ReactNode => {
        if (!v) return <span className="text-gray-300">-</span>
        const g = grantMap[v]
        return (
          <span className="text-xs font-mono text-gray-600" title={v}>
            {g ? g.sourceReference || v.slice(0, 8) : v.slice(0, 8)}
          </span>
        )
      },
    },
    {
      key: 'amount',
      header: '额度变动 Credits',
      render: (v: number): ReactNode => {
        const n = Number(v)
        return (
          <span className={`font-mono font-medium ${n >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {n > 0 ? '+' : ''}{USD(n)}
          </span>
        )
      },
    },
    {
      key: 'revenueImpact',
      header: '收入影响 Revenue',
      render: (v: number, row: CreditTransaction): ReactNode => {
        const n = Number(v)
        if (n === 0) return <span className="font-mono text-gray-300">-</span>
        return (
          <span className={`font-mono ${row.type === 'refund' ? 'text-red-500' : 'text-green-600'}`}>
            {USD(n)}
          </span>
        )
      },
    },
    { key: 'description', header: '说明 Description' },
    {
      key: 'createdAt',
      header: '时间 Date',
      render: (v: string): ReactNode => v ? (
        <span className="text-gray-400 whitespace-nowrap">{new Date(v).toLocaleDateString()} {new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      ) : '-',
    },
  ]

  if (loading) return <div className="text-gray-400 p-10 text-center">加载中...</div>
  if (error) return <div className="text-red-500 p-10">错误: {error}</div>
  if (!account) return null

  const txRecords = txData?.records || []
  const txTotal = txData?.total || 0

  // Compute financial summary from grants
  const allGrants = grants || []
  const totalGranted = allGrants.reduce((s, g) => s + g.originalAmount, 0)
  const totalRemaining = allGrants.reduce((s, g) => s + g.remainingAmount, 0)
  const totalConsumed = totalGranted - totalRemaining
  const activeRemaining = allGrants
    .filter(g => !g.expiresAt || new Date(g.expiresAt) >= new Date())
    .reduce((s, g) => s + g.remainingAmount, 0)
  const deferredRevenue = allGrants.reduce((s, g) => s + g.remainingAmount * g.costBasisPerUnit, 0)
  const recognizedRevenue = allGrants.reduce((s, g) => s + (g.originalAmount - g.remainingAmount) * g.costBasisPerUnit, 0)

  const activeGrants = allGrants.filter(g => g.remainingAmount > 0 && (!g.expiresAt || new Date(g.expiresAt) >= new Date()))
  const inactiveGrants = allGrants.filter(g => g.remainingAmount === 0 || (g.expiresAt && new Date(g.expiresAt) < new Date()))

  // Rate card info
  const rateCard = (rateCards || []).find(rc => rc.id === account.rateCardId)

  // Last recharge (most recent grant)
  const lastRechargeGrant = allGrants.length > 0
    ? allGrants.reduce<CreditGrant | null>((latest, g) => (!latest || new Date(g.createdAt) > new Date(latest.createdAt)) ? g : latest, null)
    : null

  const isActive = account.status === 'active'
  const isSuspended = account.status === 'suspended'

  return (
    <div className="max-w-7xl">
      {/* Breadcrumb */}
      <div className="mb-4 text-sm text-gray-400">
        <Link to="/accounts" className="hover:text-gray-600">客户账户</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{account.name}</span>
      </div>

      {/* Suspended banner */}
      {isSuspended && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <span className="font-medium">账户已停用</span>
            <span className="text-red-500">— 额度消耗已被冻结 Credit consumption blocked</span>
          </div>
          <button onClick={() => changeAccountStatus('active')} className="text-sm px-3 py-1 bg-white border border-red-300 text-red-700 rounded hover:bg-red-50">
            重新激活 Reactivate
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{account.name}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                <StatusBadge status={account.status} />
                <span>{account.billingEmail}</span>
                <span className="text-gray-300">|</span>
                <span>注册于 {new Date(account.createdAt).toLocaleDateString()}</span>
                {lastRechargeGrant && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span>最近充值 {new Date(lastRechargeGrant.createdAt).toLocaleDateString()}</span>
                  </>
                )}
                {rateCard && (
                  <>
                    <span className="text-gray-300">|</span>
                    <Link to={`/rate-cards/${rateCard.id}`} className="text-blue-600 hover:underline">{rateCard.name}</Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isActive && (
                <button
                  onClick={() => setBlockConfirm('suspend')}
                  className="px-3 py-2 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                >
                  停用账户 Suspend
                </button>
              )}
              <button
                onClick={() => { setGrantForm(emptyGrantForm); setGrantModal(true) }}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                授予额度 Grant
              </button>
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        {balance && (
          <div className="p-6">
            {/* Balance hero + composition breakdown */}
            <div className="flex items-start gap-6">
              {/* Left: Balance hero */}
              <div className="shrink-0">
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">账户余额 Balance</div>
                <div className="text-4xl font-bold text-gray-900 mt-1">{USD(balance.totalBalance)}</div>
              </div>
              {/* Right: composition */}
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-gray-300 text-lg">=</span>
                  <div className="flex items-center gap-4">
                    {[
                      { label: '购买 Purchased', value: balance.purchasedBalance, color: 'bg-blue-500', text: 'text-blue-700' },
                      { label: '推广 Promotional', value: balance.promotionalBalance, color: 'bg-emerald-500', text: 'text-emerald-700' },
                      { label: '奖励 Bonus', value: balance.bonusBalance, color: 'bg-violet-500', text: 'text-violet-700' },
                    ].map((s, i) => (
                      <div
                        key={s.label}
                        className="flex items-center gap-1.5 cursor-default relative group/item"
                        title={`${s.label}: ${USD(s.value)}（占比 ${balance.totalBalance > 0 ? ((s.value / balance.totalBalance) * 100).toFixed(1) : 0}%）`}
                      >
                        {i > 0 && <span className="text-gray-300 mr-1.5">+</span>}
                        <span className={`inline-block w-2.5 h-2.5 rounded-sm ${s.color}`} />
                        <div>
                          <span className={`text-lg font-semibold ${s.text}`}>{USD(s.value)}</span>
                          <span className="text-xs text-gray-400 ml-1.5">{s.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <BalanceBar
                  purchased={balance.purchasedBalance || 0}
                  promotional={balance.promotionalBalance || 0}
                  bonus={balance.bonusBalance || 0}
                  total={balance.totalBalance || 0}
                />
              </div>
            </div>
            {/* Ledger summary */}
            <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-4 gap-6 text-sm">
              <div>
                <div className="text-xs text-gray-400">累计授予 Total Granted</div>
                <div className="font-semibold text-gray-700 mt-0.5">{USD(totalGranted)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">累计消耗 Total Consumed</div>
                <div className="font-semibold text-gray-700 mt-0.5">{USD(totalConsumed)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">已确认收入 Recognized</div>
                <div className="font-semibold text-green-600 mt-0.5">{USD(recognizedRevenue)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">递延收入 Deferred</div>
                <div className="font-semibold text-amber-600 mt-0.5">{USD(deferredRevenue)}</div>
              </div>
            </div>
            {/* Reconciliation check */}
            {activeRemaining !== balance.totalBalance && (
              <div className="mt-3 text-xs text-red-500 bg-red-50 rounded px-3 py-1.5">
                对账异常：有效授权剩余 ({USD(activeRemaining)}) 与余额快照 ({USD(balance.totalBalance)}) 不一致
              </div>
            )}
          </div>
        )}
      </div>

      {/* Credit Grants */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">额度授权 <span className="text-sm font-normal text-gray-400">Credit Grants</span></h2>
          <span className="text-xs text-gray-400">{activeGrants.length} 有效 / {allGrants.length} 总计</span>
        </div>
        {activeGrants.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            {activeGrants.map((g) => <GrantCard key={g.id} grant={g} grantTypes={grantTypes} />)}
          </div>
        )}
        {activeGrants.length === 0 && allGrants.length > 0 && (
          <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3">
            无有效授权 — 所有额度已过期或耗尽，该账户无法消耗额度。
          </div>
        )}
        {inactiveGrants.length > 0 && (
          <details className="text-sm">
            <summary className="text-gray-400 cursor-pointer hover:text-gray-600 mb-2">
              {inactiveGrants.length} 条已耗尽/已过期授权
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {inactiveGrants.map((g) => <GrantCard key={g.id} grant={g} grantTypes={grantTypes} />)}
            </div>
          </details>
        )}
        {allGrants.length === 0 && (
          <div className="text-sm text-gray-400 bg-white rounded-lg border border-dashed border-gray-200 p-6 text-center">
            暂无额度授权
          </div>
        )}
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">交易记录 <span className="text-sm font-normal text-gray-400">Transactions</span></h2>
        <DataTable
          columns={txColumns}
          data={txRecords}
          page={txPage}
          size={txSize}
          total={txTotal}
          onPageChange={setTxPage}
        />
      </div>

      {/* Grant Credits Modal — two-step: form → confirm */}
      <Modal isOpen={grantModal} onClose={closeGrantModal} title={grantStep === 'form' ? '授予额度 Grant Credits' : '确认授予信息 Confirm Grant'}>
        {grantStep === 'form' ? (
          <>
            <FormField
              label="授权类型 Grant Type"
              type="select"
              value={grantForm.grantTypeCode}
              onChange={setField('grantTypeCode')}
              options={(grantTypes || []).map((gt) => ({ value: gt.code, label: `${gt.name} (${gt.code})` }))}
            />
            <FormField label={`额度数量 Amount（1 Credit = 1 USD）${isPurchased ? ' *' : ''}`} type="number" value={grantForm.amount} onChange={setField('amount')} />
            {isLargeAmount && (
              <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700 flex items-center gap-2">
                <span className="text-base">⚠</span> 授予金额较大（≥{LARGE_AMOUNT_THRESHOLD.toLocaleString()}），请仔细核对
              </div>
            )}
            <FormField label="单位成本 Cost Basis Per Unit ($)" type="number" value={grantForm.costBasisPerUnit} onChange={setField('costBasisPerUnit')} placeholder="购买填1.00，免费填0" disabled={!!selectedGrantType} />
            {selectedGrantType && (
              <div className="mb-3 text-[11px] text-gray-400 -mt-2">
                已根据授权类型自动填入，如需修改请谨慎操作
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="币种 Currency" value={grantForm.currency} onChange={setField('currency')} />
              <FormField label="有效天数 Expiry Days" type="number" value={grantForm.expiryDays} onChange={setField('expiryDays')} placeholder="留空使用类型默认值" />
            </div>
            <FormField label={`来源引用 Source Reference${isPurchased ? ' *' : ''}`} value={grantForm.sourceReference} onChange={setField('sourceReference')} placeholder="如 ORD-2025-001, PROMO-SPRING" />
            {isPurchased && !grantForm.sourceReference && (
              <div className="mb-3 text-[11px] text-red-500 -mt-2">购买类型必须填写来源引用（订单号）</div>
            )}
            {duplicateRef && (
              <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700 flex items-center gap-2">
                <span className="text-base">⚠</span> 来源引用 "{grantForm.sourceReference}" 已存在于该账户，请确认是否重复
              </div>
            )}
            <div className="flex justify-end space-x-3 mt-4">
              <button onClick={closeGrantModal} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                取消 Cancel
              </button>
              <button
                onClick={() => setGrantStep('confirm')}
                disabled={!canProceedToConfirm}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                下一步 Review
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">目标账户</span>
                <span className="font-medium text-gray-900">{account?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">授权类型</span>
                <span className="font-medium text-gray-900">{selectedGrantType?.name || grantForm.grantTypeCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">额度数量</span>
                <span className={`font-bold ${isLargeAmount ? 'text-amber-600 text-base' : 'text-gray-900'}`}>{USD(grantAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">单位成本</span>
                <span className="font-medium text-gray-900">{grantForm.costBasisPerUnit || '0'} USD/cr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">有效天数</span>
                <span className="font-medium text-gray-900">{grantForm.expiryDays || (selectedGrantType ? selectedGrantType.defaultExpiryDays : '-')} 天</span>
              </div>
              {grantForm.sourceReference && (
                <div className="flex justify-between">
                  <span className="text-gray-500">来源引用</span>
                  <span className="font-medium text-gray-900 font-mono text-xs">{grantForm.sourceReference}</span>
                </div>
              )}
              {isPurchased && grantAmount > 0 && (
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-500">对应收入</span>
                  <span className="font-bold text-green-700">{USD(grantAmount * Number(grantForm.costBasisPerUnit || 0))}</span>
                </div>
              )}
            </div>
            {isLargeAmount && (
              <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700 flex items-center gap-2">
                <span className="text-base">⚠</span> 大额授予（{USD(grantAmount)}），请再次确认金额无误
              </div>
            )}
            {duplicateRef && (
              <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700 flex items-center gap-2">
                <span className="text-base">⚠</span> 来源引用 "{grantForm.sourceReference}" 已存在，可能重复授予
              </div>
            )}
            <div className="flex justify-end space-x-3 mt-4">
              <button onClick={() => setGrantStep('form')} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                返回修改 Back
              </button>
              <button
                onClick={submitGrant}
                disabled={saving}
                className={`px-4 py-2 text-sm text-white rounded-md disabled:opacity-50 ${isLargeAmount ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {saving ? '提交中... Submitting' : '确认提交 Confirm'}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Suspend Confirm */}
      <ConfirmDialog
        isOpen={blockConfirm === 'suspend'}
        onClose={() => setBlockConfirm(null)}
        onConfirm={() => changeAccountStatus('suspended')}
        title="停用账户 Suspend Account"
        message={`确定要停用"${account.name}"吗？停用后该账户将无法消耗额度，但余额将被保留，可随时重新激活。`}
        confirmLabel="确认停用 Confirm"
      />
    </div>
  )
}
