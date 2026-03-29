import { useState } from 'react'
import api from '../../api/client'
import useApi from '../../hooks/useApi'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import ConfirmDialog from '../../components/ConfirmDialog'

const emptyForm = { name: '', code: '', isRevenueBearing: false, accountingTreatment: '', defaultExpiryDays: 365 }

export default function GrantTypeList() {
  const { data, loading, error, refetch } = useApi(() => api.get('/grant-types'))
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
      name: row.name,
      code: row.code,
      isRevenueBearing: row.isRevenueBearing,
      accountingTreatment: row.accountingTreatment || '',
      defaultExpiryDays: row.defaultExpiryDays,
    })
    setModalOpen(true)
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
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/grant-types/${deleteTarget.id}`)
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
    {
      key: 'isRevenueBearing',
      header: '产生收入 Revenue',
      render: (v) => (v ? '是' : '否'),
    },
    { key: 'defaultExpiryDays', header: '有效天数 Expiry' },
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
          <h1 className="text-2xl font-bold text-gray-900">授权类型</h1>
          <p className="text-sm text-gray-400">Grant Types</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
          新建
        </button>
      </div>

      <DataTable columns={columns} data={data || []} page={1} size={100} total={data?.length || 0} onPageChange={() => {}} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? '编辑授权类型' : '新建授权类型'}>
        <FormField label="编码 Code" value={form.code} onChange={set('code')} disabled={!!editing} />
        <FormField label="名称 Name" value={form.name} onChange={set('name')} />
        <div className="mb-4 flex items-center space-x-2">
          <input type="checkbox" id="isRevenueBearing" checked={form.isRevenueBearing} onChange={set('isRevenueBearing')} />
          <label htmlFor="isRevenueBearing" className="text-sm text-gray-700">产生收入 Revenue Bearing</label>
        </div>
        <FormField label="默认有效天数 Default Expiry Days" type="number" value={form.defaultExpiryDays} onChange={set('defaultExpiryDays')} />
        <FormField label="会计处理方式 Accounting Treatment" type="textarea" value={form.accountingTreatment} onChange={set('accountingTreatment')} />
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
        title="删除授权类型"
        message={`确定要删除"${deleteTarget?.name}"吗？此操作不可撤销。`}
      />
    </div>
  )
}
