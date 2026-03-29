const colors = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700',
  closed: 'bg-gray-100 text-gray-600',
}

export default function StatusBadge({ status }) {
  const cls = colors[status] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  )
}
