import type { ReactNode } from 'react'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'muted'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-blue-vo2-50 text-blue-vo2-700 border border-blue-vo2-100',
  success: 'bg-vo2-green-bg text-vo2-green border border-[#A7F3D0]',
  warning: 'bg-vo2-gold-bg text-vo2-gold border border-vo2-gold-border',
  error: 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]',
  info: 'bg-subtle-bg text-text-secondary border border-border',
  muted: 'bg-surface text-text-muted border border-border',
}

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`badge ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}
