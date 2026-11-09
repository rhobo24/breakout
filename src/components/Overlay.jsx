export default function Overlay({ phase, score, onAction }) {
  if (phase === 'playing') return null
  return (
    <div className="overlay">
      {phase === 'serve' && (
        <>
          <h1>BREAKOUT</h1>
          <p>
            Move: mouse or <kbd>&larr;</kbd> <kbd>&rarr;</kbd>
          </p>
          <button onClick={onAction}>LAUNCH BALL</button>
        </>
      )}
      {phase === 'over' && (
        <>
          <h1>GAME OVER</h1>
          <p className="final-score">SCORE {String(score).padStart(4, '0')}</p>
          <button onClick={onAction}>PLAY AGAIN</button>
        </>
      )}
    </div>
  )
}
