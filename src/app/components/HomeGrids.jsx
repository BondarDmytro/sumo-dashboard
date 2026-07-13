'use client'
/* basho_filter_v2: гріди головної тільки для поточного басьо */
import CompactGrid from './CompactGrid'
import { useBashoFilter, CURRENT_BASHO } from './BashoFilterContext'

export default function HomeGrids({ others, kyujo, currentDay }) {
  const { selBasho } = useBashoFilter()
  if (selBasho !== CURRENT_BASHO) return null
  return (
    <>
      <CompactGrid items={others} isKyujo={false} currentDay={currentDay} />
      {/* kyujo_dedup_v1: kiudzho-blok teper u TabsWrapper nad spyskom */}
    </>
  )
}
