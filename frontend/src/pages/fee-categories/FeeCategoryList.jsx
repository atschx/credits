import { useState } from 'react'
import api from '../../api/client'
import useApi from '../../hooks/useApi'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import ConfirmDialog from '../../components/ConfirmDialog'

const emptyForm = { code: '', name: '', isRevenue: true, isRefundable: false, glAccountCode: '' }

export default function FeeCategoryList() {
  const { data, loading, error, refetch } = useApi(() => api.get('/fee-categories'))
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: val }))
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (row) => {
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
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/fee-categories/${deleteTarget.id}`)
      setDeleteTarget(null)
      refetch()
    } catch (e) {
      alert(e.message)
      setDeleteTarget(null)
    }
  }

  const columns = [
    { key: 'code', header: '编码 Code' },
    { key: 'name', header: '名称 Name' },
    { key: 'isRevenue', header: '收入类 Revenue', render: (v) => (v ? '是' : '否') },
    { key: 'isRefundable', header: '可退 Refundable', render: (v) => (v ? '是' : '否') },
    { key: 'glAccountCode', header: '科目编号 GL Account' },
    {
      key: '_actions',
      header: '操作',
      render: (_, row) => (
        <div className="flex space-x-2">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row) }} className="text-blue-600 hover:underline text-xs">
            编辑
          </button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row) }} className="text-red-600 hover:underline text-xs">
            删除
          </button>
        </div>
      ),
    },
  ]

  if (error) return <div className="text-red-500">错误: {error}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">费用类目</h1>
          <p className="text-sm text-gray-400">Fee Categories</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
          新建
        </button>
      </div>

      <DataTable columns={columns} data={data || []} page={1} size={100} total={data?.length || 0} onPageChange={() => {}} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '编辑费用类目' : '新建费用类目'}>
        <FormField label="编码 Code" value={form.code} onChange={set('code')} disabled={!!editing} />
        <FormField label="名称 Name" value={form.name} onChange={set('name')} />
        <div className="mb-4 flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={form.isRevenue} onChange={set('isRevenue')} />
            <span className="text-sm text-gray-700">收入类 Revenue</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={form.isRefundable} onChange={set('isRefundable')} />
            <span className="text-sm text-gray-700">可退款 Refundable</span>
          </label>
        </div>
        <FormField label="科目编号 GL Account Code" value={form.glAccountCode} onChange={set('glAccountCode')} />
        <div className="flex justify-end space-x-3 mt-4">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
            取消
          </button>
          <button onClick={save} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="删除费用类目"
        message={`确定要删除"${deleteTarget?.name}"吗？此操作不可撤销。`}
      />
    </div>
  )
}
