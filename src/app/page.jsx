'use client'
// src/app/page.jsx
// Головна сторінка — лендінг Dohyo Legends
// Гра доступна на /game

import Link from 'next/link'

export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cinzel+Decorative:wght@700;900&family=IM+Fell+English:ital@0;1&family=Noto+Serif+JP:wght@300;400;700;900&display=swap');

        :root {
          --gold:    #c8950a;
          --gold-lt: #f0c060;
          --gold-dk: #6a4808;
          --ink:     #0a0805;
          --border:  rgba(184,134,11,0.25);
          --jp:      'Noto Serif JP', serif;
          --display: 'Cinzel Decorative', serif;
          --body:    'IM Fell English', serif;
          --title:   'Cinzel', serif;
        }

        html { scroll-behavior: smooth; }

        .landing * { box-sizing: border-box; margin: 0; padding: 0; }

        .landing {
          background: var(--ink);
          color: #d4c4a0;
          font-family: var(--body);
          overflow-x: hidden;
          min-height: 100vh;
        }

        /* grain */
        .landing::before {
          content: '';
          position: fixed; inset: 0; z-index: 999;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none; opacity: 0.35;
        }

        /* ── NAV ── */
        .l-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 1rem 2rem;
          display: flex; align-items: center; justify-content: space-between;
          background: linear-gradient(180deg, rgba(7,5,3,0.97) 0%, transparent 100%);
          border-bottom: 1px solid rgba(184,134,11,0.08);
        }
        .l-nav-logo {
          font-family: var(--display);
          font-size: clamp(0.65rem, 1.5vw, 0.82rem);
          font-weight: 700; color: var(--gold);
          text-decoration: none; letter-spacing: 0.06em;
          text-shadow: 0 0 12px rgba(200,149,10,0.4);
        }
        .l-nav-links { display: flex; gap: 2rem; list-style: none; }
        .l-nav-links a {
          font-family: var(--jp); font-size: 0.58rem;
          color: rgba(212,196,160,0.45); text-decoration: none;
          letter-spacing: 0.12em; text-transform: uppercase;
          transition: color 0.2s;
        }
        .l-nav-links a:hover { color: var(--gold-lt); }
        .l-btn-play-sm {
          font-family: var(--title); font-size: 0.68rem;
          font-weight: 700; letter-spacing: 0.1em;
          text-decoration: none; padding: 7px 20px;
          background: linear-gradient(180deg, #8a6010, #4a3008);
          color: #f0c060;
          border: 1px solid rgba(184,134,11,0.4); border-radius: 3px;
          transition: all 0.2s; display: inline-block;
        }
        .l-btn-play-sm:hover {
          background: linear-gradient(180deg, #aa7818, #6a4410);
          box-shadow: 0 0 16px rgba(184,134,11,0.3);
        }

        /* ── HERO ── */
        .l-hero {
          position: relative; min-height: 100vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          overflow: hidden; padding: 6rem 1rem 5rem;
        }
        .l-hero-bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% 40%, rgba(140,80,10,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 60% 80% at 20% 80%, rgba(100,20,10,0.15) 0%, transparent 60%),
            radial-gradient(ellipse 50% 70% at 80% 20%, rgba(10,20,60,0.2) 0%, transparent 60%),
            linear-gradient(180deg, #0a0603 0%, #0f0a06 40%, #080504 100%);
        }
        .l-ring {
          position: absolute; border-radius: 50%;
          border: 1px solid rgba(184,134,11,0.07);
          animation: l-ringBreath 6s ease-in-out infinite;
        }
        .l-ring-1 { width: min(700px,90vw); height: min(700px,90vw); }
        .l-ring-2 { width: min(520px,68vw); height: min(520px,68vw); border-width: 2px; animation-delay: -3s; }
        @keyframes l-ringBreath {
          0%,100% { transform: scale(1); opacity: 0.6; }
          50%      { transform: scale(1.015); opacity: 1; }
        }
        .l-kanji-bg {
          position: absolute; inset: 0; overflow: hidden; pointer-events: none;
        }
        .l-kanji-bg span {
          position: absolute; font-family: var(--jp); font-weight: 900;
          color: rgba(184,134,11,0.035); user-select: none;
          animation: l-kanjiFloat linear infinite;
        }
        @keyframes l-kanjiFloat {
          0%   { transform: translateY(0) rotate(var(--r)); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-120vh) rotate(var(--r)); opacity: 0; }
        }
        .l-hero-content {
          position: relative; z-index: 2;
          display: flex; flex-direction: column;
          align-items: center; text-align: center; max-width: 900px;
        }
        .l-badge {
          font-family: var(--jp); font-size: 0.62rem; font-weight: 700;
          color: rgba(200,149,10,0.65); letter-spacing: 0.4em;
          border: 1px solid rgba(200,149,10,0.18); border-radius: 20px;
          padding: 4px 18px; margin-bottom: 1.5rem;
          animation: l-fadeUp 0.8s ease 0.2s both;
        }
        .l-logo-img {
          width: min(600px, 88vw); height: auto;
          filter: drop-shadow(0 0 40px rgba(200,149,10,0.35)) drop-shadow(0 8px 32px rgba(0,0,0,0.9));
          animation: l-fadeUp 0.9s ease 0.3s both, l-logoPulse 4s ease-in-out 1.5s infinite;
          margin-bottom: 0.5rem;
        }
        @keyframes l-logoPulse {
          0%,100% { filter: drop-shadow(0 0 30px rgba(200,149,10,0.3)) drop-shadow(0 8px 32px rgba(0,0,0,0.9)); }
          50%      { filter: drop-shadow(0 0 60px rgba(200,149,10,0.55)) drop-shadow(0 8px 32px rgba(0,0,0,0.9)); }
        }
        .l-title-fallback {
          font-family: var(--display); font-size: clamp(2.8rem, 8vw, 6rem);
          font-weight: 900; color: var(--gold-lt);
          text-shadow: 0 0 40px rgba(200,149,10,0.6), 0 4px 16px rgba(0,0,0,1);
          line-height: 1; animation: l-fadeUp 0.9s ease 0.3s both;
        }
        .l-sub {
          font-family: var(--jp); font-size: clamp(0.65rem, 2vw, 0.95rem);
          font-weight: 300; color: rgba(212,196,160,0.45);
          letter-spacing: 0.28em; margin: 0.5rem 0 2rem;
          animation: l-fadeUp 0.9s ease 0.5s both;
        }
        .l-tagline {
          font-family: var(--body); font-style: italic;
          font-size: clamp(1rem, 2.5vw, 1.25rem);
          color: rgba(212,196,160,0.68); max-width: 500px;
          line-height: 1.65; margin-bottom: 2.5rem;
          animation: l-fadeUp 0.9s ease 0.6s both;
        }
        .l-cta-row {
          display: flex; gap: 14px; flex-wrap: wrap;
          justify-content: center;
          animation: l-fadeUp 0.9s ease 0.75s both;
        }
        .l-btn-play {
          font-family: var(--title); font-size: clamp(0.82rem, 1.8vw, 1rem);
          font-weight: 700; letter-spacing: 0.12em;
          text-decoration: none; padding: clamp(12px,2vw,16px) clamp(28px,4vw,48px);
          background: linear-gradient(180deg, #b07810 0%, #6a4808 100%);
          color: #f8e8b0;
          border: 1px solid rgba(240,192,96,0.5); border-radius: 4px;
          box-shadow: 0 0 24px rgba(200,149,10,0.35), 0 4px 16px rgba(0,0,0,0.8);
          transition: all 0.2s; position: relative; overflow: hidden; display: inline-block;
        }
        .l-btn-play:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 40px rgba(200,149,10,0.55), 0 8px 24px rgba(0,0,0,0.8);
          background: linear-gradient(180deg, #c88a18 0%, #7a5410 100%);
        }
        .l-btn-sec {
          font-family: var(--title); font-size: clamp(0.75rem, 1.6vw, 0.9rem);
          font-weight: 600; letter-spacing: 0.1em;
          text-decoration: none; padding: clamp(11px,2vw,15px) clamp(22px,3.5vw,36px);
          background: transparent; color: rgba(212,196,160,0.6);
          border: 1px solid rgba(184,134,11,0.22); border-radius: 4px;
          transition: all 0.2s; display: inline-block;
        }
        .l-btn-sec:hover { color: var(--gold-lt); border-color: rgba(184,134,11,0.55); }

        .l-scroll-hint {
          position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          opacity: 0.3; animation: l-fadeUp 1s ease 2s both; z-index: 2;
        }
        .l-scroll-hint span { font-family: var(--jp); font-size: 0.48rem; letter-spacing: 0.2em; color: var(--gold); }
        .l-scroll-line {
          width: 1px; height: 36px;
          background: linear-gradient(180deg, var(--gold), transparent);
          animation: l-scrollLine 2s ease-in-out infinite;
        }
        @keyframes l-scrollLine {
          0%,100% { opacity: 0.4; }
          50%      { opacity: 1; transform: scaleY(0.7); }
        }

        /* ── SECTIONS COMMON ── */
        .l-section { padding: clamp(3.5rem,7vw,6rem) 1.5rem; }
        .l-section-inner { max-width: 1100px; margin: 0 auto; }
        .l-label {
          font-family: var(--jp); font-size: 0.58rem; font-weight: 700;
          color: rgba(200,149,10,0.45); letter-spacing: 0.4em;
          text-transform: uppercase; text-align: center; margin-bottom: 0.6rem;
        }
        .l-h2 {
          font-family: var(--title); font-size: clamp(1.5rem, 4vw, 2.6rem);
          font-weight: 700; color: var(--gold-lt); text-align: center;
          text-shadow: 0 0 28px rgba(200,149,10,0.28);
          margin-bottom: 0.9rem; letter-spacing: 0.04em;
        }
        .l-divider {
          width: 100px; height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
          margin: 0 auto 3rem;
        }

        /* ── FEATURES ── */
        .l-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(255px, 1fr));
          gap: 1.25rem;
        }
        .l-feature {
          background: linear-gradient(160deg, rgba(26,21,14,0.92), rgba(12,10,6,0.96));
          border: 1px solid rgba(184,134,11,0.18); border-radius: 8px;
          padding: 1.75rem 1.4rem; position: relative; overflow: hidden;
          transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
        }
        .l-feature::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(200,149,10,0.35), transparent);
        }
        .l-feature:hover {
          border-color: rgba(184,134,11,0.45); transform: translateY(-3px);
          box-shadow: 0 0 28px rgba(184,134,11,0.07), 0 8px 28px rgba(0,0,0,0.5);
        }
        .l-feature-icon { font-size: 2rem; margin-bottom: 0.9rem; display: block; }
        .l-feature-name {
          font-family: var(--title); font-size: 0.95rem; font-weight: 700;
          color: var(--gold-lt); letter-spacing: 0.07em; margin-bottom: 0.55rem;
        }
        .l-feature-desc { font-size: 0.85rem; color: rgba(212,196,160,0.5); line-height: 1.65; }

        /* ── HOW TO PLAY ── */
        .l-htp {
          background: linear-gradient(180deg, transparent, rgba(8,5,3,0.85) 15%, rgba(8,5,3,0.85) 85%, transparent);
        }
        .l-steps {
          display: flex; gap: 1.5rem; flex-wrap: wrap;
          justify-content: center; max-width: 880px; margin: 0 auto;
        }
        .l-step {
          flex: 1 1 180px; max-width: 220px;
          display: flex; flex-direction: column; align-items: center;
          text-align: center; gap: 0.65rem;
        }
        .l-step-num {
          width: 48px; height: 48px; border-radius: 50%;
          background: linear-gradient(145deg, rgba(184,134,11,0.18), rgba(184,134,11,0.04));
          border: 1px solid rgba(184,134,11,0.38);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--title); font-size: 1rem; font-weight: 700;
          color: var(--gold); flex-shrink: 0;
        }
        .l-step-title {
          font-family: var(--title); font-size: 0.85rem; font-weight: 700;
          color: var(--gold-lt); letter-spacing: 0.05em;
        }
        .l-step-text { font-size: 0.8rem; color: rgba(212,196,160,0.48); line-height: 1.6; }

        /* ── SCREENSHOTS ── */
        .l-shots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1rem;
        }
        .l-shot {
          border-radius: 8px; overflow: hidden;
          border: 1px solid rgba(184,134,11,0.18);
          aspect-ratio: 16/9; background: rgba(16,12,8,0.9);
          transition: border-color 0.25s;
        }
        .l-shot:hover { border-color: rgba(184,134,11,0.45); }
        .l-shot img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .l-shot-ph {
          width: 100%; height: 100%;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 8px;
          background: linear-gradient(135deg, rgba(20,16,10,0.9), rgba(10,8,5,0.95));
        }
        .l-shot-ph-icon { font-size: 2.2rem; opacity: 0.3; }
        .l-shot-ph-label {
          font-family: var(--jp); font-size: 0.52rem;
          color: rgba(184,134,11,0.25); letter-spacing: 0.15em;
        }

        /* ── MODES ── */
        .l-modes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 1rem; max-width: 860px; margin: 0 auto;
        }
        .l-mode {
          background: linear-gradient(160deg, rgba(22,18,12,0.95), rgba(10,8,5,0.98));
          border: 1px solid rgba(184,134,11,0.13); border-radius: 8px;
          padding: 1.4rem 1.1rem; text-align: center;
          transition: border-color 0.25s, background 0.25s;
        }
        .l-mode:hover {
          border-color: rgba(184,134,11,0.38);
          background: linear-gradient(160deg, rgba(26,20,14,0.98), rgba(13,10,6,0.99));
        }
        .l-mode-emoji { font-size: 1.9rem; margin-bottom: 0.55rem; display: block; }
        .l-mode-name {
          font-family: var(--title); font-size: 0.82rem; font-weight: 700;
          color: var(--gold-lt); margin-bottom: 0.4rem; letter-spacing: 0.05em;
        }
        .l-mode-desc { font-size: 0.76rem; color: rgba(212,196,160,0.42); line-height: 1.55; }
        .l-soon {
          font-size: 0.5rem; color: rgba(200,149,10,0.45);
          font-family: var(--jp); display: inline;
        }

        /* ── CTA ── */
        .l-cta-section {
          padding: clamp(4rem,8vw,7rem) 1.5rem;
          text-align: center; position: relative; overflow: hidden;
        }
        .l-cta-section::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse 70% 60% at 50% 50%, rgba(140,80,10,0.1) 0%, transparent 70%);
        }
        .l-cta-section p {
          font-size: clamp(0.82rem, 2vw, 0.98rem);
          color: rgba(212,196,160,0.45); font-style: italic;
          margin: 0.75rem auto 2.5rem; max-width: 420px;
        }

        /* ── FOOTER ── */
        .l-footer {
          border-top: 1px solid rgba(184,134,11,0.08);
          padding: 2.5rem 1.5rem;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 1rem;
          max-width: 1100px; margin: 0 auto;
        }
        .l-footer-logo {
          font-family: var(--display); font-size: 0.85rem;
          font-weight: 700; color: rgba(200,149,10,0.55); letter-spacing: 0.06em;
        }
        .l-footer-links { display: flex; gap: 1.5rem; flex-wrap: wrap; }
        .l-footer-links a {
          font-family: var(--jp); font-size: 0.56rem;
          color: rgba(212,196,160,0.3); text-decoration: none;
          letter-spacing: 0.1em; transition: color 0.2s;
        }
        .l-footer-links a:hover { color: rgba(212,196,160,0.65); }
        .l-footer-copy {
          font-family: var(--jp); font-size: 0.5rem;
          color: rgba(212,196,160,0.18); letter-spacing: 0.08em;
        }

        @keyframes l-fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 640px) {
          .l-nav-links { display: none; }
          .l-nav { padding: 0.75rem 1rem; }
        }
      `}</style>

      <div className="landing">

        {/* NAV */}
        <nav className="l-nav">
          <a href="/" className="l-nav-logo">⛩ Dohyo Legends</a>
          <ul className="l-nav-links">
            <li><a href="#features">Про гру</a></li>
            <li><a href="#howtoplay">Як грати</a></li>
            <li><a href="#modes">Режими</a></li>
          </ul>
          <Link href="/game" className="l-btn-play-sm">▶ Грати</Link>
        </nav>

        {/* HERO */}
        <section className="l-hero">
          <div className="l-hero-bg"></div>
          <div className="l-ring l-ring-1"></div>
          <div className="l-ring l-ring-2"></div>
          <div className="l-kanji-bg" id="kanjiContainer"></div>

          <div className="l-hero-content">
            <div className="l-badge">⛩ Карткова стратегія · Безкоштовно · В браузері</div>

            <img
              src="/images/dohyo-logo.webp"
              alt="Dohyo Legends"
              className="l-logo-img"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                document.getElementById('heroTitleFallback').style.display = 'block'
              }}
            />
            <h1 className="l-title-fallback" id="heroTitleFallback" style={{display:'none'}}>
              Dohyo Legends
            </h1>

            <div className="l-sub">土俵の伝説 · Легенди Дохьо</div>

            <p className="l-tagline">
              Збери колоду, вийди на дохьо,<br/>
              змуси суперника визнати поразку.
            </p>

            <div className="l-cta-row">
              <Link href="/game" className="l-btn-play">⚔ Грати безкоштовно</Link>
              <a href="#features" className="l-btn-sec">Дізнатись більше</a>
            </div>
          </div>

          <div className="l-scroll-hint">
            <span>SCROLL</span>
            <div className="l-scroll-line"></div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="l-section" id="features">
          <div className="l-section-inner">
            <p className="l-label">Про гру</p>
            <h2 className="l-h2">Стратегія, Сила, Честь</h2>
            <div className="l-divider"></div>
            <div className="l-features-grid">
              {[
                { icon:'🃏', name:'Карткова механіка', desc:'20+ унікальних карток: атака, захист, спеціальні техніки. Щоразу нова колода — щоразу нова стратегія.' },
                { icon:'🏆', name:'Кампанія',           desc:'П\'ять рівнів з наростаючою складністю. Зароби зірки, відкрий унікальні картки, стань Йокодзуна.' },
                { icon:'⚔',  name:'Бій проти CPU',     desc:'Тренуйся проти інтелектуального суперника. CPU адаптується до твоєї колоди і стилю гри.' },
                { icon:'🌐', name:'Мультиплеєр',        desc:'Грай з другом через код сесії на двох пристроях. Онлайн-матчмейкінг — незабаром.' },
                { icon:'🪙', name:'Базар',              desc:'Заробляй коіни за перемоги. Купуй аватари рікіші, нові фони арен, музичні теми.' },
                { icon:'🎌', name:'Автентичність',      desc:'Реальні техніки сумо: тачіай, хенка, харитете. Мовою і духом — справжнє дохьо.' },
              ].map(f => (
                <div className="l-feature" key={f.name}>
                  <span className="l-feature-icon">{f.icon}</span>
                  <div className="l-feature-name">{f.name}</div>
                  <p className="l-feature-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW TO PLAY */}
        <section className="l-section l-htp" id="howtoplay">
          <div className="l-section-inner">
            <p className="l-label">Правила</p>
            <h2 className="l-h2">Як грати</h2>
            <div className="l-divider"></div>
            <div className="l-steps">
              {[
                { n:'1', title:'Обери карту',       text:'Кожен раунд — вибір однієї карти з руки. Атака, захист, або спеціальна техніка.' },
                { n:'2', title:'Битва',              text:'Обидва гравці розкривають карти одночасно. Ефекти застосовуються, переможець отримує очко.' },
                { n:'3', title:'Кюджо або Кімаріте', text:'Знижуй HP суперника до нуля або виграй більшість раундів з 15.' },
                { n:'4', title:'Нова рука',          text:'Після кожного раунду є шанс взяти нову карту. Постійно оновлюй стратегію.' },
              ].map(s => (
                <div className="l-step" key={s.n}>
                  <div className="l-step-num">{s.n}</div>
                  <div className="l-step-title">{s.title}</div>
                  <p className="l-step-text">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SCREENSHOTS */}
        <section className="l-section" id="screenshots">
          <div className="l-section-inner">
            <p className="l-label">Геймплей</p>
            <h2 className="l-h2">Скріншоти</h2>
            <div className="l-divider"></div>
            <div className="l-shots-grid">
              {[
                { src:'/images/screenshots/screen-battle.webp',   label:'БИТВА',    icon:'⚔' },
                { src:'/images/screenshots/screen-vs.webp',       label:'VS ЕКРАН', icon:'🥊' },
                { src:'/images/screenshots/screen-campaign.webp', label:'КАМПАНІЯ', icon:'🏆' },
                { src:'/images/screenshots/screen-bazaar.webp',   label:'БАЗАР',    icon:'🪙' },
              ].map(s => (
                <div className="l-shot" key={s.label}>
                  <img src={s.src} alt={s.label}
                    onError={(e) => {
                      e.currentTarget.parentElement.innerHTML =
                        `<div class="l-shot-ph"><span class="l-shot-ph-icon">${s.icon}</span><span class="l-shot-ph-label">${s.label}</span></div>`
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MODES */}
        <section className="l-section" id="modes">
          <div className="l-section-inner">
            <p className="l-label">Режими гри</p>
            <h2 className="l-h2">Обери свій шлях</h2>
            <div className="l-divider"></div>
            <div className="l-modes-grid">
              {[
                { emoji:'⚔',  name:'vs CPU',     desc:'Швидкий бій проти комп\'ютера.' },
                { emoji:'🗾', name:'Кампанія',    desc:'5 рівнів, нові картки як нагорода.' },
                { emoji:'📱', name:'Локально',    desc:'Два пристрої, один код сесії.' },
                { emoji:'🌍', name:'Онлайн',      desc:'Глобальний рейтинг.', soon:true },
              ].map(m => (
                <div className="l-mode" key={m.name}>
                  <span className="l-mode-emoji">{m.emoji}</span>
                  <div className="l-mode-name">
                    {m.name}{m.soon && <span className="l-soon"> · скоро</span>}
                  </div>
                  <p className="l-mode-desc">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="l-cta-section">
          <p className="l-label">Починай зараз</p>
          <h2 className="l-h2">Вийди на дохьо</h2>
          <p>Безкоштовно. Прямо в браузері. Без реєстрації.</p>
          <Link href="/game" className="l-btn-play" style={{fontSize:'1rem', padding:'16px 52px'}}>
            ⚔ Грати безкоштовно
          </Link>
        </section>

        {/* FOOTER */}
        <footer className="l-footer">
          <div className="l-footer-logo">⛩ Dohyo Legends</div>
          <nav className="l-footer-links">
            <a href="/game">Грати</a>
            <a href="#features">Про гру</a>
            <a href="#howtoplay">Правила</a>
            <a href="mailto:hello@dohyo-legends.com">Контакт</a>
          </nav>
          <div className="l-footer-copy">© 2026 TerraVetera · All rights reserved</div>
        </footer>

        {/* Kanji animation script */}
        <script dangerouslySetInnerHTML={{ __html: `
          const KANJI = ['土','俵','相','撲','力','勝','技','道','魂','剛','柔','闘','龍','虎','武','将']
          const container = document.getElementById('kanjiContainer')
          if(container){
            for(let i=0;i<16;i++){
              const el=document.createElement('span')
              const size=40+Math.random()*110
              const dur=18+Math.random()*22
              const delay=-Math.random()*dur
              const rot=(Math.random()-0.5)*20
              el.textContent=KANJI[Math.floor(Math.random()*KANJI.length)]
              el.style.cssText='left:'+Math.random()*100+'%;top:'+(20+Math.random()*80)+'%;font-size:'+size+'px;--r:'+rot+'deg;animation-duration:'+dur+'s;animation-delay:'+delay+'s;'
              container.appendChild(el)
            }
          }
        `}}/>

      </div>
    </>
  )
}
