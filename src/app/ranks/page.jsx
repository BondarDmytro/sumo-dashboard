import RankForecast from '../components/RankForecast'

export const revalidate = 300

export default function RanksPage() {
  return (
    <main style={{fontFamily:"'Noto Sans JP',sans-serif",background:'var(--bg)',minHeight:'100vh',color:'var(--ink)'}}>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'2rem 1.5rem 4rem'}}>
        <div style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'0.5rem'}}>
          Натсу Басьо 2026
        </div>
        <h1 style={{fontSize:'1.6rem',fontWeight:800,marginBottom:'0.4rem'}}>
          Прогноз змін рангу
          <span style={{color:'#b8860b'}}> — Санʼяку</span>
        </h1>
        <p style={{fontSize:'0.82rem',color:'var(--mid)',marginBottom:'2rem',lineHeight:1.6}}>
          Прогноз на основі поточних результатів. Враховує кадо-бан для Озекі, озекі-тест (33 перемоги за 3 басьо) для Секіваке, та маке-коші для всіх рангів.
        </p>
        <RankForecast />
      </div>
    </main>
  )
}