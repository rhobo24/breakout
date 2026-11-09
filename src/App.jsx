import GameCanvas from './components/GameCanvas.jsx'

export default function App() {
  return (
    <main className="app">
      <GameCanvas />
      <footer className="hint">
        MOUSE / ARROWS move paddle &middot; SPACE or CLICK launch
      </footer>
    </main>
  )
}
