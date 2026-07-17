import { type ReactNode, useState, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

interface MobileBottomSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Height of the sheet as a percentage of viewport height (default 60). */
  maxHeight?: number
}

export function MobileBottomSheet({
  open,
  onClose,
  title,
  children,
  maxHeight = 60,
}: MobileBottomSheetProps) {
  const [dragY, setDragY] = useState(0)
  const startYRef = useRef(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  const handleClose = () => {
    setDragY(0)
    onClose()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - startYRef.current
    if (delta > 0) {
      setDragY(delta)
    }
  }

  const handleTouchEnd = () => {
    if (dragY > 100) {
      handleClose()
    } else {
      setDragY(0)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-border bg-paper shadow-xl',
          'transition-transform duration-300 ease-out'
        )}
        style={{
          maxHeight: `${maxHeight}vh`,
          transform: `translateY(${dragY}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex items-center justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-paper-tertiary" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-2">
          <span className="text-sm font-medium text-text-primary">{title}</span>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 text-text-tertiary hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto px-4 pb-6"
          style={{ maxHeight: `calc(${maxHeight}vh - 60px)` }}
        >
          {children}
        </div>
      </div>
    </>
  )
}
