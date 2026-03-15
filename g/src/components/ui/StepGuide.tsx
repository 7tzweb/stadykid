import { Card } from '@/components/ui/Card'

interface StepGuideItem {
  title: string
  description: string
}

interface StepGuideProps {
  title: string
  items: StepGuideItem[]
  accent?: string
  className?: string
}

export function StepGuide({
  title,
  items,
  accent = '#f26a4b',
  className = '',
}: StepGuideProps) {
  return (
    <Card className={`space-y-4 ${className}`.trim()}>
      <div className="space-y-1">
        <p className="text-sm font-semibold tracking-[0.18em] text-slate-500">איך מתקדמים?</p>
        <h2 className="font-display text-2xl text-slate-900">{title}</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item, index) => (
          <div
            className="rounded-[24px] border border-white/70 bg-[#f8fafc] px-4 py-4"
            key={`${item.title}-${index}`}
          >
            <div
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: accent }}
            >
              {index + 1}
            </div>
            <p className="mt-3 text-lg font-bold text-slate-900">{item.title}</p>
            <p className="mt-1 text-sm text-slate-600">{item.description}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
