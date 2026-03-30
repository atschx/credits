import { useState } from 'react'
import api from '../../api/client'
import useApi from '../../hooks/useApi'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import ConfirmDialog from '../../components/ConfirmDialog'
import { FeeCategory } from '../../types'

interface FeeCategoryForm {
  code: string
  name: string
  isRevenue: boolean
  isRefundable: boolean
  glAccountCode: string
}

interface GlPrefix {
  prefix: string
  label: string
}

const emptyForm: FeeCategoryForm = { code: '', name: '', isRevenue: true, isRefundable: false, glAccountCode: '' }

const glPrefixes: GlPrefix[] = [
  { prefix: '4010', label: '主营业务收入' },
  { prefix: '4020', label: '其他业务收入' },
  { prefix: '6010', label: '营业成本' },
  { prefix: '6601', label: '销售费用' },
]

export default function FeeCategoryList() {
  const { data, loading, error, refetch } = useApi(() => api.get('/fee-categories'))
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FeeCategory | null>(null)
  const [form, setForm] = useState<FeeCategoryForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<FeeCategory | null>(null)

  const set = (field: keyof FeeCategoryForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement
    const val = target.type === 'checkbox' ? target.checked : target.value
    setForm((f) => ({ ...f, [field]: val }))
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (row: FeeCategory) => {
    setEditing(row)
    setForm({
      code: row.code,
      name: row.name,
      isRevenue: row.isRevenue,
      isRefundable: row.isRefundable,
      glAccountCode: row.glAccountCode || '',
    })
    setModalOpen(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/fee-categories/${editing.id}`, form)
      } else {
        await api.post('/fee-categories', form)
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
      await api.delete(`/fee-categories/${deleteTarget!.id}`)
      setDeleteTarget(null)
      refetch()
    } catch (e: unknown) {
      alert((e as Error).message)
      setDeleteTarget(null)
    }
  }

  const categories: FeeCategory[] = data || []

  if (error) return <div className="text-red-500">错误: {error}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">费用类目</h1>
          <p className="text-sm text-gray-400">Fee Categories — 费率卡附加费用的分类与会计科目映射</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
          新建类目 Create
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-40 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center text-gray-400 py-12 bg-white rounded-lg shadow">
          <p className="mb-2">暂无费用类目</p>
          <button onClick={openCreate} className="text-sm text-blue-600 hover:underline">+ 创建第一个费用类目</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat) => {
            const glPrefix = glPrefixes.find((p) => cat.glAccountCode?.startsWith(p.prefix))
            return (
              <div key={cat.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-5">
                  {/* Top: name + badges */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{cat.name}</h3>
                      <span className="text-xs font-mono text-gray-400">{cat.code}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        cat.isRevenue ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {cat.isRevenue ? '收入类' : '非收入'}
                      </span>
                      {cat.isRefundable && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700">
                          可退款
                        </span>
                      )}
                    </div>
                  </div>

                  {/* GL Account */}
                  <div className="bg-gray-50 rounded-md px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">GL Account</div>
                        <div className="text-sm font-mono font-semibold text-gray-800">{cat.glAccountCode || '—'}</div>
                      </div>
                      {glPrefix && (
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">{glPrefix.label}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 px-5 py-2.5 flex items-center justify-end gap-3">
                  <button onClick={() => openEdit(cat)} className="text-xs text-blue-600 hover:text-blue-800">编辑 Edit</button>
                  <button onClick={() => setDeleteTarget(cat)} className="text-xs text-red-500 hover:text-red-700">删除 Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '编辑费用类目 Edit Fee Category' : '新建费用类目 Create Fee Category'}>
        <FormField label="编码 Code" value={form.code} onChange={set('code')} disabled={!!editing} placeholder="如 platform_fee, processing_fee" />
        <p className="text-xs text-gray-400 -mt-2 mb-4">编码创建后不可修改，用于费率卡项目关联</p>

        <FormField label="名称 Name" value={form.name} onChange={set('name')} placeholder="如 Platform Fee, Processing Fee" />

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            form.isRevenue ? 'border-green-300 bg-green-50' : 'border-gray-200'
          }`} onClick={() => setForm((f) => ({ ...f, isRevenue: !f.isRevenue }))}>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.isRevenue} onChange={set('isRevenue')} className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
            </label>
            <div>
              <div className="text-sm font-medium text-gray-700">收入类</div>
              <div className="text-xs text-gray-400">Revenue</div>
            </div>
          </div>
          <div className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            form.isRefundable ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
          }`} onClick={() => setForm((f) => ({ ...f, isRefundable: !f.isRefundable }))}>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.isRefundable} onChange={set('isRefundable')} className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
            <div>
              <div className="text-sm font-medium text-gray-700">可退款</div>
              <div className="text-xs text-gray-400">Refundable</div>
            </div>
          </div>
        </div>

        <FormField label="科目编号 GL Account Code" value={form.glAccountCode} onChange={set('glAccountCode')} placeholder="如 4010-001" />
        {form.glAccountCode && (
          <div className="text-xs text-gray-400 -mt-2 mb-4">
            {glPrefixes.find((p) => form.glAccountCode.startsWith(p.prefix))
              ? `科目分类：${glPrefixes.find((p) => form.glAccountCode.startsWith(p.prefix))!.label}`
              : '输入总账科目编号，用于财务对账'}
          </div>
        )}

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
        title="删除费用类目 Delete Fee Category"
        message={`确定要删除"${deleteTarget?.name}"吗？关联的费率卡项目将失去类目关联。此操作不可撤销。`}
      />
    </div>
  )
}
