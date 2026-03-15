import { X } from 'lucide-react'
import type { ReactNode } from 'react'

import { Card } from '@/components/ui/Card'

interface ModalProps {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}

export function Modal({ open, title, children, onClose }: ModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-4 sm:items-center">
      <Card className="relative w-full max-w-xl bg-[#fffaf5] p-6">
        <button
          aria-label="סגירת חלון"
          className="absolute left-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm"
          onClick={onClose}
          type="button"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="space-y-4">
          <h3 className="pr-12 font-display text-2xl text-slate-900">{title}</h3>
          {children}
        </div>
      </Card>
    </div>
  )
}
