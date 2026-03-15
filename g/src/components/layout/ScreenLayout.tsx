import clsx from 'clsx'
import type { ReactNode } from 'react'

const toneClasses = {
  sunrise: 'from-[#fff5d2] via-[#ffe8ca] to-[#ffd4c2]',
  mint: 'from-[#edfdf4] via-[#dbfff3] to-[#cdf1f4]',
  sky: 'from-[#eef4ff] via-[#dfe7ff] to-[#d5f2ff]',
  lilac: 'from-[#f3edff] via-[#efe4ff] to-[#ffe9f6]',
  sand: 'from-[#fff7ec] via-[#fff2d9] to-[#ffe4c4]',
}

interface ScreenLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  eyebrow?: string
  actions?: ReactNode
  tone?: keyof typeof toneClasses
  contentClassName?: string
}

export function ScreenLayout({
  children,
  title,
  subtitle,
  eyebrow,
  actions,
  tone = 'sunrise',
  contentClassName,
}: ScreenLayoutProps) {
  return (
    <div className={clsx('relative min-h-screen overflow-hidden bg-gradient-to-br', toneClasses[tone])}>
      <div className="pointer-events-none absolute left-6 top-6 h-28 w-28 rounded-full bg-white/45 blur-2xl" />
      <div className="pointer-events-none absolute bottom-10 right-10 h-40 w-40 rounded-full bg-[#f26a4b]/15 blur-3xl" />
      <div className="pointer-events-none absolute right-1/3 top-24 h-16 w-16 rounded-full bg-[#14b8a6]/20 blur-2xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        {(title || subtitle || actions) && (
          <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              {eyebrow && (
                <p className="text-sm font-semibold tracking-[0.18em] text-slate-500">
                  {eyebrow}
                </p>
              )}
              {title && <h1 className="font-display text-4xl text-slate-900 sm:text-5xl">{title}</h1>}
              {subtitle && <p className="max-w-3xl text-base text-slate-600 sm:text-lg">{subtitle}</p>}
            </div>
            {actions}
          </header>
        )}
        <div className={clsx('flex-1', contentClassName)}>{children}</div>
      </div>
    </div>
  )
}
