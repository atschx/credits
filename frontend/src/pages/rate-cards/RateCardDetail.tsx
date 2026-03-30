import { useState, ChangeEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/client'
import useApi from '../../hooks/useApi'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import StatusBadge from '../../components/StatusBadge'
import ConfirmDialog from '../../components/ConfirmDialog'
import type { RateCard, RateCardItem, FeeCategory, SelectOption } from '../../types'

interface ItemForm {
  actionCode: string
  actionName: string
  unitOfMeasure: string
  baseCreditCost: number
  feeCreditCost: number
  feeCategoryId: string
}

const emptyItemForm: ItemForm = { actionCode: '', actionName: '', unitOfMeasure: 'request', baseCreditCost: 0, feeCreditCost: 0, feeCategoryId: '' }

const unitLabels: Record<string, string> = {
  request: '次/request',
  '1k_tokens': '千token/1k_tokens',
  gb_month: 'GB·月/gb_month',
}

const unitOptions: SelectOption[] = [
  { value: 'request', label: '次 request' },
  { value: '1k_tokens', label: '千token 1k_tokens' },
  { value: 'gb_month', label: 'GB·月 gb_month' },
]

export default function RateCardDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: card, loading, error, refetch } = useApi<RateCard>(() => api.get(`/rate-cards/${id}`), [id])
  const { data: items, refetch: refetchItems } = useApi<RateCardItem[]>(() => api.get(`/rate-cards/${id}/items`), [id])
  const { data: feeCategories } = useApi<FeeCategory[]>(() => api.get('/fee-categories'))

  const [itemModal, setItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<RateCardItem | null>(null)
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItemForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<RateCardItem | null>(null)
  const [statusConfirm, setStatusConfirm] = useState<string | null>(null)

  const setField = (field: keyof ItemForm) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setItemForm((f) => ({ ...f, [field]: e.target.value }))

  const openCreateItem = () => {
    setEditingItem(null)
    setItemForm(emptyItemForm)
    setItemModal(true)
  }

  const openEditItem = (row: RateCardItem) => {
    setEditingItem(row)
    setItemForm({
      actionCode: row.actionCode,
      actionName: row.actionName,
      unitOfMeasure: row.unitOfMeasure,
      baseCreditCost: row.baseCreditCost,
      feeCreditCost: row.feeCreditCost,
      feeCategoryId: row.feeCategoryId || '',
    })
    setItemModal(true)
  }

  const saveItem = async () => {
    setSaving(true)
    try {
      const payload = {
        ...itemForm,
        baseCreditCost: Number(itemForm.baseCreditCost),
        feeCreditCost: Number(itemForm.feeCreditCost),
        feeCategoryId: itemForm.feeCategoryId || null,
      }
      if (editingItem) {
        await api.put(`/rate-cards/${id}/items/${editingItem.id}`, payload)
      } else {
        await api.post(`/rate-cards/${id}/items`, payload)
      }
      setItemModal(false)
      refetchItems()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async () => {
    try {
      await api.delete(`/rate-cards/${id}/items/${deleteTarget!.id}`)
      setDeleteTarget(null)
      refetchItems()
    } catch (e) {
      alert((e as Error).message)
      setDeleteTarget(null)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.put(`/rate-cards/${id}/status`, { status: newStatus })
      refetch()
      setStatusConfirm(null)
    } catch (e) {
      alert((e as Error).message)
      setStatusConfirm(null)
    }
  }

  if (loading) return <div className="text-gray-400">加载中...</div>
  if (error) return <div className="text-red-500">错误: {error}</div>
  if (!card) return null

  const allItems: RateCardItem[] = items || []
  const feeCatMap: Record<string, FeeCategory> = Object.fromEntries((feeCategories || []).map((fc) => [fc.id, fc]))
  const feeCatOptions: SelectOption[] = (feeCategories || []).map((fc) => ({ value: fc.id, label: `${fc.code} — ${fc.name}` }))
  const isEditable = card.status === 'draft'

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-3">
        <span className="cursor-pointer hover:text-gray-600" onClick={() => navigate('/rate-cards')}>费率卡</span>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{card.name}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{card.name}</h1>
                <StatusBadge status={card.status} />
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>币种 <span className="font-medium text-gray-700">{card.currency}</span></span>
                <span>生效 <span className="text-gray-700">{new Date(card.effectiveFrom).toLocaleDateString()}</span></span>
                <span>失效 <span className="text-gray-700">{card.effectiveTo ? new Date(card.effectiveTo).toLocaleDateString() : '永久有效'}</span></span>
              </div>
            </div>
            <div className="flex space-x-2">
              {card.status === 'draft' && (
                <button
                  onClick={() => setStatusConfirm('active')}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  激活 Activate
                </button>
              )}
              {card.status === 'active' && (
                <button
                  onClick={() => setStatusConfirm('archived')}
                  className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  归档 Archive
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-gray-100 px-5 py-3 flex items-center gap-8 text-sm">
          <div>
            <span className="text-gray-400">费率项目</span>
            <span className="ml-2 font-semibold text-gray-900">{allItems.length}</span>
            <span className="text-gray-400 ml-1">项</span>
          </div>
          {allItems.length > 0 && (
            <>
              <div>
                <span className="text-gray-400">单价范围</span>
                <span className="ml-2 font-mono font-medium text-gray-900">
                  {Math.min(...allItems.map((i) => i.baseCreditCost + i.feeCreditCost))}
                  {' ~ '}
                  {Math.max(...allItems.map((i) => i.baseCreditCost + i.feeCreditCost))}
                </span>
                <span className="text-gray-400 ml-1">credits</span>
              </div>
              <div>
                <span className="text-gray-400">含附加费</span>
                <span className="ml-2 font-semibold text-gray-900">{allItems.filter((i) => i.feeCreditCost > 0).length}</span>
                <span className="text-gray-400 ml-1">项</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Items section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">费率项目 <span className="text-sm font-normal text-gray-400">Rate Card Items</span></h2>
        {isEditable && (
          <button onClick={openCreateItem} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
            添加项目 Add
          </button>
        )}
      </div>

      {allItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow border border-dashed border-gray-200 p-8 text-center text-gray-400">
          <p className="mb-2">暂无费率项目</p>
          {isEditable && (
            <button onClick={openCreateItem} className="text-sm text-blue-600 hover:underline">+ 添加第一个费率项目</button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作编码 Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作名称 Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">计量单位 Unit</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">基础费用 Base</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">附加费用 Fee</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">合计 Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">费用类目 Category</th>
                {isEditable && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {allItems.map((item) => {
                const total = item.baseCreditCost + item.feeCreditCost
                const cat = item.feeCategoryId ? feeCatMap[item.feeCategoryId] : null
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-700">{item.actionCode}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.actionName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{unitLabels[item.unitOfMeasure] || item.unitOfMeasure}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-gray-700">{item.baseCreditCost}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-gray-500">{item.feeCreditCost > 0 ? item.feeCreditCost : '-'}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono font-semibold text-gray-900">{total}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {cat ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{cat.code}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    {isEditable && (
                      <td className="px-4 py-3 text-sm text-right">
                        <button onClick={() => openEditItem(item)} className="text-blue-600 hover:underline text-xs mr-3">编辑 Edit</button>
                        <button onClick={() => setDeleteTarget(item)} className="text-red-500 hover:underline text-xs">删除 Delete</button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-4 py-2 text-xs text-gray-400 text-right">共 {allItems.length} 项</td>
                <td className="px-4 py-2 text-xs text-right font-mono text-gray-400">
                  {allItems.reduce((s, i) => s + i.baseCreditCost, 0)}
                </td>
                <td className="px-4 py-2 text-xs text-right font-mono text-gray-400">
                  {allItems.reduce((s, i) => s + i.feeCreditCost, 0)}
                </td>
                <td className="px-4 py-2 text-xs text-right font-mono font-semibold text-gray-500">
                  {allItems.reduce((s, i) => s + i.baseCreditCost + i.feeCreditCost, 0)}
                </td>
                <td colSpan={isEditable ? 2 : 1} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Item form modal */}
      <Modal isOpen={itemModal} onClose={() => setItemModal(false)} title={editingItem ? '编辑费率项目 Edit Item' : '添加费率项目 Add Item'}>
        <FormField label="操作编码 Action Code" value={itemForm.actionCode} onChange={setField('actionCode')} disabled={!!editingItem} placeholder="如 api_call, completion" />
        <FormField label="操作名称 Action Name" value={itemForm.actionName} onChange={setField('actionName')} placeholder="如 API Call, Chat Completion" />
        <FormField
          label="计量单位 Unit of Measure"
          type="select"
          value={itemForm.unitOfMeasure}
          onChange={setField('unitOfMeasure')}
          options={unitOptions}
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="基础费用 Base Cost (credits)" type="number" value={itemForm.baseCreditCost} onChange={setField('baseCreditCost')} />
          <FormField label="附加费用 Fee Cost (credits)" type="number" value={itemForm.feeCreditCost} onChange={setField('feeCreditCost')} />
        </div>
        {(Number(itemForm.baseCreditCost) > 0 || Number(itemForm.feeCreditCost) > 0) && (
          <div className="mb-4 px-3 py-2 bg-blue-50 rounded-md text-xs text-blue-700">
            合计单价：<span className="font-semibold">{Number(itemForm.baseCreditCost) + Number(itemForm.feeCreditCost)}</span> credits / {unitLabels[itemForm.unitOfMeasure] || itemForm.unitOfMeasure}
          </div>
        )}
        <FormField label="费用类目 Fee Category（可选）" type="select" value={itemForm.feeCategoryId} onChange={setField('feeCategoryId')} options={feeCatOptions} />
        <div className="flex justify-end space-x-3 mt-4">
          <button onClick={() => setItemModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
            取消 Cancel
          </button>
          <button
            onClick={saveItem}
            disabled={saving || !itemForm.actionCode || !itemForm.actionName}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '提交中... Saving' : '保存 Save'}
          </button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteItem}
        title="删除费率项目 Delete Item"
        message={`确定要删除费率项目"${deleteTarget?.actionName}"吗？此操作不可撤销。`}
      />

      {/* Status change confirm */}
      <ConfirmDialog
        isOpen={!!statusConfirm}
        onClose={() => setStatusConfirm(null)}
        onConfirm={() => handleStatusChange(statusConfirm!)}
        title={statusConfirm === 'active' ? '激活费率卡 Activate' : '归档费率卡 Archive'}
        message={statusConfirm === 'active'
          ? `确定要激活"${card.name}"吗？激活后费率项目将不可修改。`
          : `确定要归档"${card.name}"吗？归档后该费率卡将不再可用。`}
        confirmLabel={statusConfirm === 'active' ? '确认激活' : '确认归档'}
      />
    </div>
  )
}
