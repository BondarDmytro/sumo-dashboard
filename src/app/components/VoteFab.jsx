'use client'
/* votes_v2: knopka -> modalka z usima rikishi Makuuchi potochnoho basho */
import { useState, useEffect } from 'react'
import { useVotes } from './useVotes'
import { useLang } from './LangProvider'
import meta from '../lib/rikishiMeta.json'

function t3(lang, uk, en, ja) { return lang === 'en' ? en : lang === 'ja' ? ja : uk }

export default function VoteFab() {
  const { lang } = useLang()
  const [isMobile, setIsMobile] = useState(false)  /* vote_pills_grid_v2 */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)')
    setIsMobile(mq.matches)
    const h = e => setIsMobile(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  const { votes, total, myVote, vote } = useVotes()
  const [open, setOpen] = useState(false)
  const [list, setList] = useState(null)  // null = loading

  useEffect(() => {
    if (!open || list) return
    fetch('/api/basho-division?division=Makuuchi')
      .then(r => r.json())
      .then(d => {
        const rk = (d?.rikishi || d?.allRikishi || []).map(r => ({
          id: Number(r._id ?? r.id), name: r.name, nameJp: r.nameJp,
          rank: r.rank, rankValue: r.rankValue ?? 999, wins: r.wins, losses: r.losses,
        })).sort((a, b) => a.rankValue - b.rankValue)
        setList(rk)
      })
      .catch(() => setList([]))
  }, [open, list])

  const nameOf = (r) => lang === 'ja' && r.nameJp ? r.nameJp.split(/\s/)[0] : r.name

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Vote" className="fb-btn fb-vote" title={t3(lang, 'Хто візьме юшо?', 'Who takes the yusho?', '優勝予想')}>
        <span style={{fontSize:20,lineHeight:1}}>{'🗳️'}</span>
      </button>
      {open && (
        <div onClick={() => setOpen(false)} style={{position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div onClick={e => e.stopPropagation()} style={{background:'var(--card)',border:'1px solid rgba(184,134,11,0.4)',borderRadius:6,width:'min(680px, 100%)',maxHeight:'80vh',display:'flex',flexDirection:'column',boxShadow:'0 16px 48px rgba(0,0,0,0.4)'}}>
            <div style={{display:'flex',alignItems:'center',padding:'12px 16px',borderBottom:'1px solid var(--border)'}}>
              <div style={{flex:1,fontFamily:'monospace',fontSize:'0.78rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--ink)',fontWeight:700}}>
                {'🗳️ '}{t3(lang, 'Хто візьме юшо?', 'Who takes the yusho?', '優勝は誰だ？')}
                {total > 0 && <span style={{color:'var(--mid)',fontWeight:400}}> · {total} {t3(lang, 'голосів', 'votes', '票')}</span>}
              </div>
              <button onClick={() => setOpen(false)} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:18,color:'var(--mid)',padding:4}}>{'\u2715'}</button>
            </div>
            <div style={{overflowY:'auto',padding:'8px 16px 16px'}}>
              {list === null && <div style={{padding:20,textAlign:'center',color:'var(--mid)',fontFamily:'monospace',fontSize:'0.72rem'}}>{t3(lang, 'Завантаження...', 'Loading...', '読み込み中...')}</div>}
              {Array.isArray(list) && (
                <div style={{display:'grid',gridTemplateColumns: isMobile ? 'repeat(3, minmax(0,1fr))' : 'repeat(5, minmax(0,1fr))',gap:6}}>{/* vote_pills_grid_v2 */}
                  {list.map(r => {
                    const mine = Number(myVote) === r.id
                    const n = votes[r.id] || 0
                    return (
                      <button key={r.id} onClick={() => vote(r.id)}
                        style={{display:'flex',alignItems:'center',justifyContent:'center',gap:4,padding:'5px 6px',borderRadius:14,minWidth:0,cursor: mine ? 'default' : 'pointer',
                          border: mine ? '1.5px solid #b8860b' : '1px solid var(--border)',
                          background: mine ? 'rgba(184,134,11,0.18)' : 'var(--bg2)',
                          fontFamily:'inherit'}}>
                        {mine && <span style={{color:'#b8860b',fontWeight:700}}>{'✓'}</span>}
                        <span style={{fontSize: isMobile ? '0.64rem' : '0.72rem',fontWeight:600,color:'var(--ink)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',minWidth:0}}>{nameOf(r)}</span>
                        {/* vote_pills_names_v3: rekord prybrano */}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
