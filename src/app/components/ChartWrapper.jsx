'use client'

import dynamic from 'next/dynamic'

const YushoChart = dynamic(() => import('./YushoChart'), { ssr: false })

export default function ChartWrapper({ rikishi }) {
  return <YushoChart rikishi={rikishi} />
}
