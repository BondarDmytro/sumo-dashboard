/* auto_current_v3 */
import TournamentHeader from './components/TournamentHeader'
import TournamentStatus from './components/TournamentStatus'
import CompactGrid from './components/CompactGrid'
import TournamentFooter from './components/TournamentFooter'
import TournamentTabsWrapper from './components/TournamentTabsWrapper'
import { BashoFilterProvider } from './components/BashoFilterContext' /* basho_filter_v2 */
import BashoSelect from './components/BashoSelect'
import HomeGrids from './components/HomeGrids'
import CurrentOnly from './components/CurrentOnly' /* basho_filter_v2_fix */
import RikishiCard from './components/RikishiCard'
import YushoWinner from './components/YushoWinner'

export const revalidate = 300  /* cpu_diet_v1: 60->300, x4 lang paths made 60s too hot for free tier */

import { applyBashoRules, prevBashoId } from './lib/bashoRules' /* basho_rules_v1 */
import { currentBashoId, bashoInfo, bashoStatus, prevBashoIdOf } from './lib/bashoCalendar' /* basho_labels_v1 prev_champion_v1 */
import { getBashoData } from './lib/bashoData' /* bashoData_v1 */
const RESULTS_WIN = ['win', 'fusen win']
const RESULTS_LOSS = ['loss', 'fusen loss']
const RESULTS_PLAYED = [...RESULTS_WIN, ...RESULTS_LOSS]

export default async function Home() {
  const { prevYusho, rikishi, leaders, chasers, currentDay, maxWins, h2h, winner, playoff, isFinished, showPlayoffBanner, specialPrizes, yushoData } = await getBashoData()
  const contenders = rikishi.filter(r => r.yushoChance > 0)
    .sort((a,b) => b.wins - a.wins || b.yushoChance - a.yushoChance || (a.rankValue||999) - (b.rankValue||999))
  const hasPlayoff = currentDay >= 15 && leaders.length > 1 && !isFinished
  const others = rikishi.filter(r => r.yushoChance === 0 && !r.kyujo)
  const kyujo = rikishi.filter(r => r.kyujo)

  return (
    <main style={{fontFamily:"'Noto Sans JP',sans-serif",background:'var(--bg)',minHeight:'100vh',color:'var(--ink)'}}>
      <>{/* basho_nav_v1: provider pereikhav u layout */}
      <TournamentHeader
        champion={!isFinished && prevYusho && bashoStatus(currentBashoId()) === 'upcoming'
          ? { id: String(prevYusho.id), name: prevYusho.name, nameJp: prevYusho.nameJp, wins: 12, losses: 3,  /* champ_prop_jp */
              label: bashoInfo(prevBashoIdOf(currentBashoId())).label.uk + ' \u2014 \u044e\u0448\u043e' }
          : null}  /* champion_data_v1 */
        currentDay={currentDay}
        daysLeft={15 - currentDay}
        contendersCount={contenders.length}
        hasPlayoff={hasPlayoff}
        isFinished={isFinished}
      />

      {showPlayoffBanner && (
        <div style={{maxWidth:1280,margin:'0 auto',padding:'1.25rem 1.5rem 0'}}>
          <div style={{background:'var(--bg2)',border:'2px solid #b8860b',borderRadius:4,padding:'1.5rem 2rem',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',right:'1rem',top:'50%',transform:'translateY(-50%)',fontSize:'5rem',opacity:0.08,pointerEvents:'none'}}>⚡</div>
            <div style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'#b8860b',marginBottom:'0.75rem'}}>
              Плей-оф — визначення переможця юшо
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'1.5rem',flexWrap:'wrap'}}>
              {leaders.map((r, i) => (
                <div key={r._id} style={{display:'flex',alignItems:'center',gap:'1rem'}}>
                  {i > 0 && (
                    <span style={{fontFamily:'Georgia,serif',fontSize:'1.8rem',color:'#b8860b',fontWeight:800}}>vs</span>
                  )}
                  <div style={{background:'var(--card)',border:'1px solid var(--border)',padding:'0.75rem 1.25rem',borderRadius:2,textAlign:'center',minWidth:120}}>
                    <div style={{fontWeight:800,fontSize:'1rem'}}>{r.name}</div>
                    <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',marginTop:2}}>{r.rankFull}</div>
                    <div style={{fontFamily:'monospace',fontSize:'0.9rem',fontWeight:700,color:'#b8860b',marginTop:6}}>{r.wins}–{r.losses}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{marginTop:'0.75rem',fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)'}}>
              Очікується додатковий бій для визначення переможця
            </div>
          </div>
        </div>
      )}

      {isFinished && winner && (
        <div style={{maxWidth:1280,margin:'0 auto',padding:'1.25rem 1.5rem 0'}}>
          <YushoWinner winner={winner} playoff={playoff} bashoLabel={bashoInfo(currentBashoId()).label.uk} bashoLabelEn={bashoInfo(currentBashoId()).label.en} bashoLabelJa={bashoInfo(currentBashoId()).label.ja} /* basho_labels_v1 */ />
        </div>
      )}

      <div style={{maxWidth:1280,margin:'0 auto',padding:'1.25rem 1.5rem 4rem'}}>
        <TournamentStatus
          leaders={leaders}
          chasers={chasers}
          currentDay={currentDay}
          maxWins={maxWins}
          kyujoCount={kyujo.length}
          contendersCount={contenders.length}
          isFinished={isFinished || showPlayoffBanner}
        />
        <TournamentTabsWrapper
          contenders={contenders}
          currentDay={currentDay}
          allRikishi={rikishi}
          isFinished={isFinished}
          specialPrizes={specialPrizes}
          yushoData={yushoData}
        />
        <HomeGrids others={others} kyujo={kyujo} currentDay={currentDay} />
        <CurrentOnly>  {/* basho_filter_v2_fix: mobile-cards + footer тільки для поточного басьо */}
        <div className="anim-3 mobile-cards" style={{marginBottom:'2rem'}}>
          {contenders.map((r,i) => <RikishiCard key={r._id} r={r} index={i} />)}
        </div>
        <TournamentFooter contenders={contenders} h2h={h2h} />
        </CurrentOnly>
      </div>
      </>
    </main>
  )
}