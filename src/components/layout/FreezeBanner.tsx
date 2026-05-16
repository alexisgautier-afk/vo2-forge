'use client'

import { isProductionFrozen } from '@/lib/constants'

export function FreezeBanner() {
  if (!isProductionFrozen()) return null

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-vo2-gold-bg border-b border-vo2-gold-border text-vo2-gold text-xs font-medium">
      <span>❄</span>
      <span>Production gelée — déploiements désactivés jusqu'en janvier</span>
    </div>
  )
}
