export default function FormField({ label, error, type = 'text', options, ...props }) {
  const base = 'w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const disabledCls = props.disabled ? ' bg-gray-50 text-gray-500 cursor-not-allowed' : ''
  const cls = (error ? `${base} border-red-400` : `${base} border-gray-300`) + disabledCls

  let input
  if (type === 'select') {
    input = (
      <select className={cls} {...props}>
        <option value="">-- Select --</option>
        {options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    )
  } else if (type === 'textarea') {
    input = <textarea className={cls} rows={3} {...props} />
  } else {
    input = <input type={type} className={cls} {...props} />
  }

  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      {input}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
