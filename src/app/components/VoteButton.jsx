'use client'
/* votes_v1: knopka "holosuvaty za yusho" */
import { useVotes } from './useVotes'
import { useLang } from './LangProvider'

export default function VoteButton({ id, name }) {
  const { myVote, vote } = useVotes()
  const { lang } = useLang()
  const mine = Number(myVote) === Number(id)
  const t = (uk, en, ja) => lang === 'en' ? en : lang === 'ja' ? ja : uk
  return (
    <button
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); vote(id) }}
      title={mine ? t('Ваш прогноз на юшо', 'Your yusho pick', 'あなたの優勝予想') : t('Прогнозую юшо', 'Pick to win yusho', '優勝予想に投票')}
      style={{fontFamily:'monospace',fontSize:'0.6rem',letterSpacing:'0.06em',textTransform:'uppercase',
        padding:'2px 8px',borderRadius:2,cursor: mine ? 'default' : 'pointer',
        border: mine ? '1px solid #b8860b' : '1px solid var(--border)',
        background: mine ? 'rgba(184,134,11,0.18)' : 'transparent',
        color: mine ? '#b8860b' : 'var(--mid)'}}
    >{mine ? '✓ ' + t('мій прогноз', 'my pick', '予想済') : '🗳️ ' + t('юшо?', 'yusho?', '優勝?')}</button>
  )
}
