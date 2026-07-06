// src/app/game/page.jsx
// Окрема сторінка гри — доступна на /game
import NavBar from '../components/NavBar'

export const metadata = {
  title: 'Грати — Dohyo Legends',
  description: 'Карткова гра сумо. Збери колоду, вийди на дохьо.',
}

export default function GamePage() {
  return <NavBar />
}
