import { useState } from 'react'
import api from '../../api/client'
import useApi from '../../hooks/useApi'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import ConfirmDialog from '../../components/ConfirmDialog'
import { GrantType } from '../../types'

interface GrantTypeForm {
  name: string
  code: string
  isRevenueBearing: boolean
  accountingTreatment: string
  defaultExpiryDays: number
}

interface CodePreset {
  code: string
  name: string
  revenue: boolean
  expiry: number
  accounting: string
}

interface TypeColors {
  border: string
  bg: string
  text: string
  badge: string
  icon: string
}

interface TypeCardProps {
  gt: GrantType
  onEdit: (gt: GrantType) => void
  onDelete: (gt: GrantType) => void
}

const emptyForm: GrantTypeForm = { name: '', code: '', isRevenueBearing: true, accountingTreatment: '', defaultExpiryDays: 365 }

const codePresets: CodePreset[] = [
  { code: 'purchased', name: 'Purchased Credits', revenue: true, expiry: 365, accounting: 'ASC 606: Recognize revenue upon consumption based on cost_basis_per_unit' },
  { code: 'promotional', name: 'Promotional Credits', revenue: false, expiry: 90, accounting: 'No revenue recognition — marketing expense at grant time' },
  { code: 'bonus', name: 'Bonus Credits', revenue: false, expiry: 180, accounting: 'No revenue recognition — customer incentive' },
]

const typeColors: Record<string, TypeColors> = {
  purchased: { border: 'border-l-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', icon: '💰' },
  promotional: { border: 'border-l-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', icon: '🎯' },
  bonus: { border: 'border-l-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700', icon: '🎁' },
}
const defaultColors: TypeColors = { border: 'border-l-gray-400', bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-700', icon: '📋' }

export default function GrantTypeList() {
  const { data, loading, error, refetch } = useApi(() => api.get('/grant-types'))
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<GrantType | null>(null)
  const [form, setForm] = useState<GrantTypeForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<GrantType | null>(null)

  const set = (field: keyof GrantTypeForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement
    const val = target.type === 'checkbox' ? target.checked : target.value
    setForm((f) => ({ ...f, [field]: val }))
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (row: GrantType) => {
    setEditing(row)
    setForm({
      name: row.name,
      code: row.code,
      isRevenueBearing: row.isRevenueBearing,
      accountingTreatment: row.accountingTreatment || '',
      defaultExpiryDays: row.defaultExpiryDays,
    })
    setModalOpen(true)
  }

  const applyPreset = (preset: CodePreset) => {
    setForm((f) => ({
      ...f,
      code: preset.code,
      name: preset.name,
      isRevenueBearing: preset.revenue,
      defaultExpiryDays: preset.expiry,
      accountingTreatment: preset.accounting,
    }))
  }

  const save = async () => {
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/grant-types/${editing.id}`, form)
      } else {
        await api.post('/grant-types', form)
      }
      setModalOpen(false)
      refetch()
    } catch (e: unknown) {
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/grant-types/${deleteTarget!.id}`)
      setDeleteTarget(null)
      refetch()
    } catch (e: unknown) {
      alert((e as Error).message)
      setDeleteTarget(null)
    }
  }

  const types: GrantType[] = data || []
  const revenueTypes = types.filter((t) => t.isRevenueBearing)
  const nonRevenueTypes = types.filter((t) => !t.isRevenueBearing)

  if (error) return <div className="text-red-500">错误: {error}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">授权类型</h1>
          <p className="text-sm text-gray-400">Grant Types — 定义 Credits 授权的收入确认规则与有效期</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
          新建类型 Create
        </button>
      </div>

      {/* Summary stats */}
      {!loading && types.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xs text-gray-400 mb-1">类型总数 Total Types</div>
            <div className="text-2xl font-bold text-gray-900">{types.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xs text-gray-400 mb-1">产生收入 Revenue Bearing</div>
            <div className="text-2xl font-bold text-blue-600">{revenueTypes.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xs text-gray-400 mb-1">非收入类 Non-Revenue</div>
            <div className="text-2xl font-bold text-emerald-600">{nonRevenueTypes.length}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
          ))}
        </div>
      ) : types.length === 0 ? (
        <div className="text-center text-gray-400 py-12 bg-white rounded-lg shadow">
          <p className="mb-2">暂无授权类型</p>
          <button onClick={openCreate} className="text-sm text-blue-600 hover:underline">+ 创建第一个授权类型</button>
        </div>
      ) : (
        <>
          {/* Revenue bearing section */}
          {revenueTypes.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">产生收入 Revenue Bearing</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {revenueTypes.map((gt) => <TypeCard key={gt.id} gt={gt} onEdit={openEdit} onDelete={setDeleteTarget} />)}
              </div>
            </div>
          )}

          {/* Non-revenue section */}
          {nonRevenueTypes.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">非收入类 Non-Revenue</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nonRevenueTypes.map((gt) => <TypeCard key={gt.id} gt={gt} onEdit={openEdit} onDelete={setDeleteTarget} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create/Edit modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '编辑授权类型 Edit Grant Type' : '新建授权类型 Create Grant Type'}>
        {/* Presets */}
        {!editing && (
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-2">快速模板 Quick Presets</div>
            <div className="flex gap-2">
              {codePresets.map((p) => (
                <button
                  key={p.code}
                  onClick={() => applyPreset(p)}
                  className={`flex-1 px-3 py-2 text-xs rounded-md border transition-colors ${
                    form.code === p.code ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <FormField label="编码 Code" value={form.code} onChange={set('code')} disabled={!!editing} placeholder="如 purchased, promotional, bonus" />
        <p className="text-xs text-gray-400 -mt-2 mb-4">编码创建后不可修改，用于系统内部标识</p>

        <FormField label="名称 Name" value={form.name} onChange={set('name')} placeholder="如 Purchased Credits" />

        <div className="mb-4">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.isRevenueBearing} onChange={set('isRevenueBearing')} className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <div>
              <div className="text-sm font-medium text-gray-700">产生收入 Revenue Bearing</div>
              <div className="text-xs text-gray-400">
                {form.isRevenueBearing
                  ? 'ASC 606: 消耗时确认收入，授权时记录递延收入'
                  : '不产生收入确认，授权时直接计为营销费用或激励'}
              </div>
            </div>
          </div>
        </div>

        <FormField label="默认有效天数 Default Expiry Days" type="number" value={form.defaultExpiryDays} onChange={set('defaultExpiryDays')} />
        <p className="text-xs text-gray-400 -mt-2 mb-4">
          授权时的默认有效期。{form.defaultExpiryDays > 0 ? `约 ${Math.round(form.defaultExpiryDays / 30)} 个月` : ''}
        </p>

        <FormField label="会计处理方式 Accounting Treatment" type="textarea" value={form.accountingTreatment} onChange={set('accountingTreatment')} placeholder="描述该类型的收入确认规则与会计处理方式" />

        <div className="flex justify-end space-x-3 mt-4">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
            取消 Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || !form.code || !form.name}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '提交中... Saving' : editing ? '保存 Save' : '创建 Create'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="删除授权类型 Delete Grant Type"
        message={
          deleteTarget?.grantCount != null && deleteTarget.grantCount > 0
            ? `"${deleteTarget?.name}" 已有 ${deleteTarget?.grantCount} 条授权记录，删除后相关数据可能受影响。确定要删除吗？`
            : `确定要删除"${deleteTarget?.name}"吗？此操作不可撤销。`
        }
      />
    </div>
  )
}

function TypeCard({ gt, onEdit, onDelete }: TypeCardProps) {
  const colors = typeColors[gt.code] || defaultColors

  return (
    <div className={`bg-white rounded-lg shadow border-l-4 ${colors.border} hover:shadow-md transition-shadow`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{colors.icon}</span>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{gt.name}</h3>
              <span className="text-xs font-mono text-gray-400">{gt.code}</span>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors.badge}`}>
            {gt.isRevenueBearing ? '收入' : '非收入'}
          </span>
        </div>

        {/* Accounting treatment */}
        {gt.accountingTreatment && (
          <div className={`${colors.bg} rounded-md px-3 py-2 mb-3`}>
            <div className="text-xs text-gray-500 mb-0.5">会计处理 Accounting</div>
            <div className={`text-xs ${colors.text} leading-relaxed`}>{gt.accountingTreatment}</div>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-gray-400">有效期</span>
            <span className="ml-1.5 font-medium text-gray-700">{gt.defaultExpiryDays}天</span>
            <span className="text-gray-300 ml-0.5">({Math.round(gt.defaultExpiryDays / 30)}月)</span>
          </div>
          {gt.grantCount != null && gt.grantCount > 0 && (
            <div>
              <span className="text-gray-400">授权</span>
              <span className="ml-1.5 font-medium text-gray-700">{gt.grantCount}</span>
              <span className="text-gray-300 ml-0.5">({gt.activeGrantCount || 0}活跃)</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="border-t border-gray-100 px-5 py-2.5 flex items-center justify-between">
        <div className="text-xs text-gray-300">
          {gt.isRevenueBearing ? 'ASC 606 适用' : '无需收入确认'}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => onEdit(gt)} className="text-xs text-blue-600 hover:text-blue-800">编辑 Edit</button>
          <button onClick={() => onDelete(gt)} className="text-xs text-red-500 hover:text-red-700">删除 Delete</button>
        </div>
      </div>
    </div>
  )
}
