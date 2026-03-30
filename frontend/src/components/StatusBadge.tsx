import type { EntityStatus } from '../types'

const colors: Record<EntityStatus, string> = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700',
  closed: 'bg-gray-100 text-gray-600',
}

const labels: Record<EntityStatus, string> = {
  active: '正常 Active',
  draft: '草稿 Draft',
  archived: '已归档 Archived',
  suspended: '已停用 Suspended',
  closed: '已关闭 Closed',
}

interface StatusBadgeProps {
  status: EntityStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cls = colors[status] || 'bg-gray-100 text-gray-600'
  const label = labels[status] || status
  return (<span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>)
}
