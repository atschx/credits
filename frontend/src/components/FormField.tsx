import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import type { SelectOption } from '../types'

type FieldType = 'text' | 'select' | 'textarea' | 'number' | 'email' | 'date' | 'password'

type BaseProps = {
  label?: string
  error?: string
  type?: FieldType
  options?: SelectOption[]
}

type InputFieldProps = BaseProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>
type SelectFieldProps = BaseProps & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'type'>
type TextareaFieldProps = BaseProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'type'>

type FormFieldProps = InputFieldProps | SelectFieldProps | TextareaFieldProps

export default function FormField({ label, error, type = 'text', options, ...props }: FormFieldProps) {
  const base = 'w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const disabledCls = props.disabled ? ' bg-gray-50 text-gray-500 cursor-not-allowed' : ''
  const cls = (error ? `${base} border-red-400` : `${base} border-gray-300`) + disabledCls
  let input
  if (type === 'select') {
    const selectProps = props as Omit<SelectHTMLAttributes<HTMLSelectElement>, 'type'>
    input = (
      <select className={cls} {...selectProps}>
        <option value="">-- 请选择 Select --</option>
        {options?.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    )
  } else if (type === 'textarea') {
    const textareaProps = props as Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'type'>
    input = <textarea className={cls} rows={3} {...textareaProps} />
  } else {
    const inputProps = props as Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>
    input = <input type={type} className={cls} {...inputProps} />
  }
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      {input}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
