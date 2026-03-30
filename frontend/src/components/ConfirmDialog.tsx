import Modal from './Modal'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmLabel?: string
}

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = '删除 Delete' }: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || '确认操作'}>
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end space-x-3">
        <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">取消 Cancel</button>
        <button onClick={onConfirm} className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">{confirmLabel}</button>
      </div>
    </Modal>
  )
}
