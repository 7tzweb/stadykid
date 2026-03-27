import clsx from 'clsx'
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card({ children, className, ...props }, ref) {
  return (
    <div
      className={clsx(
        'rounded-[32px] border border-white/60 bg-white/82 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-sm',
        className,
      )}
      ref={ref}
      {...props}
    >
      {children}
    </div>
  )
})
