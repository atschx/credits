import { useState, type ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  render?: (value: any, row: T) => ReactNode
}

interface DataTableProps<T extends Record<string, any>> {
  columns: Column<T>[]
  data: T[]
  page: number
  size: number
  total: number
  onPageChange: (page: number) => void
  onRowClick?: (row: T) => void
  onSizeChange?: (size: number) => void
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
}

export default function DataTable<T extends Record<string, any>>({
  columns, data, page, size, total, onPageChange, onRowClick, onSizeChange, sortBy, sortDir, onSort
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / size))
  const [jumpPage, setJumpPage] = useState('')

  const handleJump = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const p = parseInt(jumpPage, 10)
      if (p >= 1 && p <= totalPages) {
        onPageChange(p)
        setJumpPage('')
      }
    }
  }

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (!onSort) return null
    const active = sortBy === colKey
    return (
      <span className="inline-flex flex-col ml-1 -mb-0.5 cursor-pointer select-none" onClick={(e) => { e.stopPropagation(); onSort(colKey) }}>
        <svg className={`w-3 h-3 -mb-1 ${active && sortDir === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} viewBox="0 0 10 6" fill="currentColor"><path d="M5 0l5 6H0z" /></svg>
        <svg className={`w-3 h-3 ${active && sortDir === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0h10z" /></svg>
      </span>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.sortable && onSort ? 'cursor-pointer hover:text-gray-700 select-none' : ''}`}
                  onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                >
                  {col.header}
                  {col.sortable && <SortIcon colKey={col.key} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                  暂无数据 No data
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={(row as any).id || i}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {total > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-3">
            <span>
              第 {(page - 1) * size + 1}-{Math.min(page * size, total)} 条，共 {total} 条
            </span>
            {onSizeChange && (
              <select
                value={size}
                onChange={(e) => onSizeChange(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-xs"
              >
                <option value={20}>20条/页</option>
                <option value={50}>50条/页</option>
                <option value={100}>100条/页</option>
              </select>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
            >
              上一页 Prev
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
            >
              下一页 Next
            </button>
            {totalPages > 5 && (
              <input
                type="text"
                value={jumpPage}
                onChange={(e) => setJumpPage(e.target.value)}
                onKeyDown={handleJump}
                placeholder="跳转 Go"
                className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
