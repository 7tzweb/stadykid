import clsx from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'md' | 'lg'
}

const variantClasses = {
  primary:
    'bg-[#f26a4b] text-white shadow-[0_14px_32px_rgba(242,106,75,0.28)] hover:brightness-105',
  secondary:
    'bg-white/88 text-slate-800 shadow-[0_14px_30px_rgba(15,23,42,0.08)] hover:bg-white',
  ghost: 'bg-transparent text-slate-700 hover:bg-white/40',
  danger:
    'bg-[#ef4444] text-white shadow-[0_14px_32px_rgba(239,68,68,0.22)] hover:brightness-105',
}

const sizeClasses = {
  md: 'min-h-12 px-5 py-3 text-sm',
  lg: 'min-h-14 px-6 py-4 text-base',
}

export function Button({
  children,
  className,
  type = 'button',
  variant = 'primary',
  size = 'lg',
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}
