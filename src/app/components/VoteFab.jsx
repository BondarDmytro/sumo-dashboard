'use client'
/* votes_v1: plavaiucha knopka holosuvannia + popup-panel */
import { useState, useMemo } from 'react'
import { useVotes } from './useVotes'
import { useLang } from './LangProvider'
import meta from '../lib/rikishiMeta.json'

function t3(lang, uk, en, ja) { return lang === 'en' ? en : lang === 'ja' ? ja : uk }

export default function VoteFab() {
  const { lang } = useLang()
  const { votes, total, myVote, vote } = useVotes()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')

  const nameOf = (id) => {
    const m = meta.find(x => Number(x.id) === Number(id))
    if (!m) return `#${id}`
    return lang === 'ja' && m.nameJp ? m.nameJp.split(/\s/)[0] : m.name
  }

  const list = useMemo(() => {
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      return meta.filter(m => (m.name || '').toLowerCase().includes(s) || (m.nameJp || '').includes(q.trim())).slice(0, 8).map(m => ({ id: m.id, n: votes[m.id] || 0 }))
    }
    const top = Object.entries(votes).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, n]) => ({ id: Number(id), n }))
    return top.length ? top : meta.filter(m => /Yokozuna|Ozeki|Sekiwake/.test(m.hiRank || m.rank || '')).slice(0, 8).map(m => ({ id: m.id, n: 0 }))
  }, [q, votes])

  return (
    <>
      <button onClick={() => setOpen(o => !o)} aria-label="Vote" className="fb-btn fb-vote" title={t3(lang, 'Хто візьме юшо?', 'Who takes the yusho?', '優勝予想')}>
        <span style={{fontSize:20,lineHeight:1}}>{'🗳️'}</span>
      </button>
      {open && (
        <div className="fb-panel fb-panel-vote" style={{width:280,background:'var(--card)',border:'1px solid var(--border)',borderRadius:4,padding:12,boxShadow:'0 8px 24px rgba(0,0,0,0.25)',maxHeight:'60vh',overflowY:'auto'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.68rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',marginBottom:8}}>
            {t3(lang, 'Хто візьме юшо?', 'Who takes the yusho?', '優勝予想')}{total > 0 ? ` · ${total}` : ''}
          </div>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={t3(lang, 'Пошук рікіші...', 'Search rikishi...', '力士検索...')}
            style={{width:'100%',boxSizing:'border-box',marginBottom:8,padding:'5px 8px',fontFamily:'monospace',fontSize:'0.72rem',border:'1px solid var(--border)',borderRadius:2,background:'var(--bg2)',color:'var(--ink)'}} />
          {list.map(r => (
            <div key={r.id} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0',borderBottom:'1px solid var(--border)'}}>
              <span style={{flex:1,fontSize:'0.78rem',fontWeight:600,color:'var(--ink)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{nameOf(r.id)}</span>
              {r.n > 0 && <span style={{fontFamily:'monospace',fontSize:'0.65rem',color:'#b8860b'}}>{total ? Math.round(r.n / total * 100) : 0}% ({r.n})</span>}
              <button onClick={() => vote(r.id)}
                style={{fontFamily:'monospace',fontSize:'0.6rem',padding:'2px 8px',borderRadius:2,cursor: Number(myVote) === Number(r.id) ? 'default' : 'pointer',
                  border: Number(myVote) === Number(r.id) ? '1px solid #b8860b' : '1px solid var(--border)',
                  background: Number(myVote) === Number(r.id) ? 'rgba(184,134,11,0.18)' : 'transparent',
                  color: Number(myVote) === Number(r.id) ? '#b8860b' : 'var(--mid)'}}>
                {Number(myVote) === Number(r.id) ? '\u2713' : t3(lang, 'голос', 'vote', '投票')}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
