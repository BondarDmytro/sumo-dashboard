'use client'
/* heya_links_v1: klikabelna nazva stayni -> /{lang}/heya/{slug} */
import { HEYA_JA } from '../lib/heyaJa'
import { ukrName } from '../lib/translit'  /* ukr_names_v3 */
import { heyaSlug } from '../lib/heya'

export default function HeyaLink({ heya, lang, style }) {
  if (!heya) return null
  const label = lang === 'ja' ? (HEYA_JA[heya] || heya) : lang === 'uk' ? ukrName(heya) : heya  /* ukr_names_v3 */
  const slug = heyaSlug(heya)
  if (!slug) return <span style={style}>{label}</span>
  return (
    <a
      href={`/${lang}/heya/${slug}`}
      style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px dotted currentColor', ...style }}
      onClick={(e) => e.stopPropagation()}
    >{label}</a>
  )
}
