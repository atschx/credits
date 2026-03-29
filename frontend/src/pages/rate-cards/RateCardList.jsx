import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import useApi from '../../hooks/useApi'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import StatusBadge from '../../components/StatusBadge'

const emptyForm = { name: '', currency: 'USD', effectiveFrom: '', effectiveTo: '' }

const statusLabels = { draft: '草稿', active: '生效中', archived: '已归档' }

export default function RateCardList() {
  const [statusFilter, setStatusFilter] = useState('')
  const { data, loading, error, refetch } = useApi(
    () => api.get('/rate-cards', { params: statusFilter ? { status: statusFilter } : {} }),
    [statusFilter]
  )
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const openCreate = () => {
    const today = new Date().toISOString().split('T')[0]
    setForm({ ...emptyForm, effectiveFrom: today })
    setModalOpen(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        effectiveFrom: form.effectiveFrom ? form.effectiveFrom + 'T00:00:00' : null,
        effectiveTo: form.effectiveTo ? form.effectiveTo + 'T23:59:59' : null,
        items: [],
      }
      await api.post('/rate-cards', payload)
      setModalOpen(false)
      setForm(emptyForm)
      refetch()
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const cards = data || []

  if (error) return <div className="text-red-500">错误: {error}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">费率卡</h1>
          <p className="text-sm text-gray-400">Rate Cards</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">全部状态</option>
            <option value="draft">草稿 Draft</option>
            <option value="active">生效中 Active</option>
            <option value="archived">已归档 Archived</option>
          </select>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            新建
          </button>
        </div>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((rc) => (
          <div
            key={rc.id}
            onClick={() => navigate(`/rate-cards/${rc.id}`)}
            className={`bg-white rounded-lg shadow border-l-4 p-5 cursor-pointer hover:shadow-md transition-shadow ${
              rc.status === 'active' ? 'border-l-green-500' : rc.status === 'draft' ? 'border-l-yellow-400' : 'border-l-gray-300'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900">{rc.name}</h3>
              <StatusBadge status={rc.status} />
            </div>
            <div className="space-y-1.5 text-sm text-gray-500">
              <div className="flex justify-between">
                <span>币种 Currency</span>
                <span className="font-medium text-gray-700">{rc.currency}</span>
              </div>
              <div className="flex justify-between">
                <span>生效日期</span>
                <span className="text-gray-700">{rc.effectiveFrom ? new Date(rc.effectiveFrom).toLocaleDateString() : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span>失效日期</span>
                <span className="text-gray-700">{rc.effectiveTo ? new Date(rc.effectiveTo).toLocaleDateString() : '永久有效'}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
              <span>{statusLabels[rc.status] || rc.status}</span>
              <span className="text-blue-500 hover:text-blue-700">查看详情 →</span>
            </div>
          </div>
        ))}
      </div>

      {cards.length === 0 && !loading && (
        <div className="text-center text-gray-400 py-12 bg-white rounded-lg shadow">
          暂无费率卡 No rate cards
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="新建费率卡 Create Rate Card">
        <FormField label="名称 Name" value={form.name} onChange={set('name')} placeholder="如 Standard Plan 2025" />
        <FormField
          label="币种 Currency"
          type="select"
          value={form.currency}
          onChange={set('currency')}
          options={[
            { value: 'USD', label: 'USD — 美元' },
            { value: 'CNY', label: 'CNY — 人民币' },
            { value: 'EUR', label: 'EUR — 欧元' },
          ]}
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="生效日期 Effective From" type="date" value={form.effectiveFrom} onChange={set('effectiveFrom')} />
          <FormField label="失效日期 Effective To（可选）" type="date" value={form.effectiveTo} onChange={set('effectiveTo')} />
        </div>
        <p className="text-xs text-gray-400 -mt-2 mb-4">留空失效日期表示永久有效。费率卡创建后为草稿状态，添加费率项目后可激活。</p>
        <div className="flex justify-end space-x-3 mt-4">
          <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
            取消
          </button>
          <button onClick={save} disabled={saving || !form.name} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
            {saving ? '保存中...' : '创建'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
