'use client'

import dynamic from 'next/dynamic'

const YushoChart = dynamic(() => import('./YushoChart'), { ssr: false })

export default function ChartWrapper({ rikishi, highlightDay }) {  /* day_switch_v1 */
  return <YushoChart rikishi={rikishi} highlightDay={highlightDay} />
}