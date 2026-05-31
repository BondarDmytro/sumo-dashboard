export default function MaintenancePage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0a0806',
      fontFamily: "'Noto Serif JP', 'Hiragino Mincho ProN', serif",
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #1a1208, #0d0a06)',
        border: '1px solid rgba(184,134,11,0.35)',
        borderRadius: 12,
        padding: '3rem 4rem',
        maxWidth: 480,
        width: '100%',
        boxShadow: '0 0 60px rgba(184,134,11,0.1)',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🥋</div>

        <h1 style={{
          color: '#f0c060',
          fontSize: '2rem',
          fontWeight: 900,
          letterSpacing: '0.15em',
          textShadow: '0 0 30px rgba(240,192,96,0.5)',
          margin: '0 0 0.5rem',
        }}>
          DOHYO LEGENDS
        </h1>

        <div style={{
          width: 60,
          height: 2,
          background: 'linear-gradient(90deg, transparent, #b8860b, transparent)',
          margin: '0 auto 1.5rem',
        }}/>

        <p style={{
          color: 'rgba(255,220,150,0.75)',
          fontSize: '1rem',
          lineHeight: 1.8,
          margin: '0 0 0.5rem',
        }}>
          Готуємось до відкриття
        </p>

        <p style={{
          color: 'rgba(255,255,255,0.3)',
          fontSize: '0.75rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          margin: 0,
        }}>
          Coming Soon
        </p>

        <div style={{
          marginTop: '2.5rem',
          fontSize: '0.55rem',
          color: 'rgba(255,220,150,0.25)',
          letterSpacing: '0.12em',
        }}>
          © 2026 TerraVetera
        </div>
      </div>
    </div>
  )
}
