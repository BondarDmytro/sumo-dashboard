'use client'
/* rikishi_link_v1: klikabelne imya rikishi -> /rikishi?id= */
import Link from 'next/link'

export default function RikishiLink({ id, children, style }) {
  if (!id) return <>{children}</>
  return (
    <Link href={`/rikishi?id=${id}`} style={{color:'inherit',textDecoration:'none',borderBottom:'1px dotted var(--light)',...style}}>
      {children}
    </Link>
  )
}
