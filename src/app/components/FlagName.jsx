'use client'
import { ukrName } from '../lib/translit'  /* ukr_names_v2 */

import { useBios } from './BiosProvider'
import { useLang } from './LangProvider' /* country_name_i18n_v1 */
import RikishiLink from './RikishiLink' /* flagname_link_v1 */
import { useFavorites } from './useFavorites' /* favorites_v1 */
import meta from '../lib/rikishiMeta.json' /* flagname_meta_fallback_v1 */
const META_BY_ID = new Map(meta.map(m => [String(m.id), m]))
const FLAG_BY_PREFIX = [['Mongolia','\u{1F1F2}\u{1F1F3}'],['Ukraine','\u{1F1FA}\u{1F1E6}'],['Georgia','\u{1F1EC}\u{1F1EA}'],['Kazakhstan','\u{1F1F0}\u{1F1FF}'],['China','\u{1F1E8}\u{1F1F3}'],['Brazil','\u{1F1E7}\u{1F1F7}'],['Russia','\u{1F3F3}\uFE0F'],['Bulgaria','\u{1F1E7}\u{1F1EC}'],['Kyrgyzstan','\u{1F1F0}\u{1F1EC}'],['Uzbekistan','\u{1F1FA}\u{1F1FF}'],['Philippines','\u{1F1F5}\u{1F1ED}'],['Egypt','\u{1F1EA}\u{1F1EC}'],['Tonga','\u{1F1F9}\u{1F1F4}'],['Czech','\u{1F1E8}\u{1F1FF}']]
const metaFlag = (shusshin) => {
  const s = String(shusshin || '')
  const hit = FLAG_BY_PREFIX.find(([c]) => s.startsWith(c))
  return hit ? hit[1] : '\u{1F1EF}\u{1F1F5}'
}

export default function FlagName({ id, name, size = '0.95rem' }) {
  const bios = useBios()
  const { isFav } = useFavorites()  /* favorites_v1 */
  const { lang } = useLang()
  const bio = bios[String(id)]
  const metaR = bio ? null : META_BY_ID.get(String(id))  /* flagname_meta_fallback_v1 */
  const flag = bio?.country?.flag || (metaR ? metaFlag(metaR.shusshin) : '🇯🇵')
  const _n = bio?.country?.name
  const country = (_n && typeof _n === 'object') ? (_n[lang] || _n.en || _n.uk) : (_n || (lang === 'ja' ? '日本' : lang === 'en' || lang === 'fr' ? 'Japan' : 'Японія'))  /* country_name_i18n_v1 */

  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:5}}>
      <span title={country} style={{fontSize:'1rem',lineHeight:1,flexShrink:0}}>{flag}</span>
      {isFav(id) && <span style={{color:'#b8860b',fontSize:'0.7em',flexShrink:0}}>{'\u2605'}</span>}{/* favorites_v1 */}
      <span style={{fontSize:size,fontWeight:700}}><RikishiLink id={id}>{lang === 'ja' ? String(bio?.nameJp || metaR?.nameJp || name).split('(')[0] : lang === 'uk' ? ukrName(name) : name}</RikishiLink></span>  {/* kanji_names_v2 */}
    </span>
  )
}