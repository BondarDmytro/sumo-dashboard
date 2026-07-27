'use client'
/* basho_filter_v2_fix: рендерить дітей тільки коли обрано поточний башьо */
import { useBashoFilter, CURRENT_BASHO } from './BashoFilterContext'

export default function CurrentOnly({ children }) {
  const { selBasho } = useBashoFilter()
  if (selBasho !== CURRENT_BASHO) return null
  return <>{children}</>
}
