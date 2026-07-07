'use client'

import { useBios } from './BiosProvider'
import { useLang } from './LangProvider' /* country_name_i18n_v1 */
import RikishiLink from './RikishiLink' /* flagname_link_v1 */

export default function FlagName({ id, name, size = '0.95rem' }) {
  const bios = useBios()
  const { lang } = useLang()
  const bio = bios[String(id)]
  const flag = bio?.country?.flag || '🇯🇵'
  const _n = bio?.country?.name
  const country = (_n && typeof _n === 'object') ? (_n[lang] || _n.uk) : (_n || (lang === 'ja' ? '日本' : lang === 'en' ? 'Japan' : 'Японія'))  /* country_name_i18n_v1 */

  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:5}}>
      <span title={country} style={{fontSize:'1rem',lineHeight:1,flexShrink:0}}>{flag}</span>
      <span style={{fontSize:size,fontWeight:700}}><RikishiLink id={id}>{lang === 'ja' && bio?.nameJp ? bio.nameJp : name}</RikishiLink></span>  {/* kanji_names_v2 */}
    </span>
  )
}