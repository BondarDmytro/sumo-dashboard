'use client'
/* site_footer_v1: hlobalnyi futer - promo ekosystemy + navihatsiia + copyright */
import Link from 'next/link'
import { useLang } from './LangProvider'

function t3(lang, uk, en, ja, fr) {  /* fr_local_t3_v1 */
  if (lang === 'en') return en
  if (lang === 'ja') return ja
  if (lang === 'fr') return fr !== undefined ? fr : en
  return uk
}

const UTM = 'utm_source=sumo_dashboard&utm_medium=footer&utm_campaign=ecosystem'

export default function SiteFooter() {
  const { lang } = useLang()
  const promos = [
    { href: `https://dohyo-legends.com/?${UTM}`, logo: '/promo/dohyo-legends-logo.webp', img: '/promo/screen-battle.webp',
      tag: t3(lang, '\u041a\u0430\u0440\u0442\u043a\u043e\u0432\u0430 \u0431\u0438\u0442\u0432\u0430 \u0441\u0443\u043c\u043e', 'Sumo Card Battler', '\u76f8\u64b2\u30ab\u30fc\u30c9\u30d0\u30c8\u30e9\u30fc') },
    { href: `https://dohyo-legends.com/flip?${UTM}`, logo: '/promo/logo_flip.webp', img: '/promo/flip-banner.webp',
      tag: t3(lang, '\u0413\u0440\u0430 \u043d\u0430 \u043f\u0430\u043c\u02bc\u044f\u0442\u044c', 'Memory Card Game', '\u795e\u7d4c\u8870\u5f31\u30b2\u30fc\u30e0') },
  ]
  const navs = [
    { href: '/', label: t3(lang, '\u0422\u0443\u0440\u043d\u0456\u0440', 'Tournament', '\u5834\u6240') },
    { href: '/ranks', label: t3(lang, '\u041f\u0440\u043e\u0433\u043d\u043e\u0437 \u0440\u0430\u043d\u0433\u0456\u0432', 'Rank forecast', '\u756a\u4ed8\u4e88\u60f3') },
    { href: '/rikishi', label: t3(lang, '\u0420\u0456\u043a\u0456\u0448\u0456', 'Rikishi', '\u529b\u58eb') },
    { href: '/archive', label: t3(lang, '\u0410\u0440\u0445\u0456\u0432', 'Archive', '\u30a2\u30fc\u30ab\u30a4\u30d6') },
    { href: '/sumo', label: t3(lang, '\u041f\u0440\u043e \u0441\u0443\u043c\u043e', 'About sumo', '\u76f8\u64b2\u306b\u3064\u3044\u3066') },
  ]
  return (
    <footer className="site-footer">
      <div className="sf-inner">
        <div className="sf-promo-row">
          <div className="sf-promo-head">{t3(lang, '\u0412\u0456\u0434 \u0442\u0432\u043e\u0440\u0446\u0456\u0432 \u0434\u0430\u0448\u0431\u043e\u0440\u0434\u0430', 'From the makers of this dashboard', '\u3053\u306e\u30c0\u30c3\u30b7\u30e5\u30dc\u30fc\u30c9\u306e\u5236\u4f5c\u8005\u3088\u308a')}</div>
          <div className="sf-promos">
            {promos.map(p => (
              <a key={p.href} href={p.href} target="_blank" rel="noopener" className="sf-promo" style={{'--sf-bg': `url(${p.img})`}}>  {/* site_footer_v2 */}
                <div className="sf-promo-text">
                  <img src={p.logo} alt="" className="sf-promo-logo" />
                  <div className="sf-promo-tag">{p.tag}</div>
                  <div className="sf-promo-cta">{t3(lang, '\u0413\u0440\u0430\u0442\u0438 \u0431\u0435\u0437\u043a\u043e\u0448\u0442\u043e\u0432\u043d\u043e', 'Play free', '\u7121\u6599\u3067\u30d7\u30ec\u30a4')} {'\u2192'}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
        <div className="sf-nav">
          {navs.map(n => <Link key={n.href} href={n.href} className="sf-nav-link">{n.label}</Link>)}
        </div>
        <div className="sf-bottom">
          <span>{'\u00a9'} Dohyo Legends 2026</span>
          <span className="sf-credit">Data: <a href="https://sumo-api.com" target="_blank" rel="noopener">sumo-api.com</a></span>
        </div>
      </div>
    </footer>
  )
}
