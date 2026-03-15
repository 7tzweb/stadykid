import clsx from 'clsx'

interface ProgressBarProps {
  label: string
  value: number
  valueLabel?: string
  accent?: string
  className?: string
}

export function ProgressBar({
  label,
  value,
  valueLabel,
  accent = '#f26a4b',
  className,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value))

  return (
    <div className={clsx('space-y-2', className)}>
      <div className="flex items-center justify-between gap-4 text-sm font-semibold text-slate-700">
        <span>{label}</span>
        <span>{valueLabel ?? `${clampedValue}%`}</span>
      </div>
      <div className="h-4 rounded-full bg-slate-200/80 p-1">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${clampedValue}%`,
            background: accent,
            boxShadow: `0 0 18px ${accent}44`,
          }}
        />
      </div>
    </div>
  )
}
