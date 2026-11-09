import { useEffect, useRef, useState, useCallback } from 'react'
import { createGame, step, launch } from '../game/engine.js'
import { setupCanvas, render } from '../game/render.js'
import { playEvent } from '../game/audio.js'
import * as C from '../game/constants.js'
import Overlay from './Overlay.jsx'

// React owns mount/unmount, input wiring and the overlay screens.
// The simulation lives in a ref so 60fps updates never re-render React.
export default function GameCanvas() {
  const canvasRef = useRef(null)
  const gameRef = useRef(createGame())
  const inputRef = useRef({ dir: 0, targetX: null })
  const [phase, setPhase] = useState('serve') // serve | playing | over
  const [score, setScore] = useState(0)

  const pressAction = useCallback(() => {
    const g = gameRef.current
    if (g.state === 'serve') launch(g)
    else if (g.state === 'over') {
      gameRef.current = createGame()
      setPhase('serve')
      setScore(0)
    }
    setPhase((p) => (p === 'playing' ? p : 'playing'))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = setupCanvas(canvas)

    const toLogicalX = (clientX) => {
      const rect = canvas.getBoundingClientRect()
      return ((clientX - rect.left) / rect.width) * C.PLAY_W
    }
    const onPointerMove = (e) => {
      inputRef.current.targetX = toLogicalX(e.clientX)
    }
    const onPointerDown = () => pressAction()
    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        inputRef.current.dir = -1
        inputRef.current.targetX = null
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        inputRef.current.dir = 1
        inputRef.current.targetX = null
      } else if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault()
        pressAction()
      }
    }
    const onKeyUp = (e) => {
      if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && inputRef.current.dir === -1)
        inputRef.current.dir = 0
      if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && inputRef.current.dir === 1)
        inputRef.current.dir = 0
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerdown', onPointerDown)

    let raf = 0
    let last = performance.now()
    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05) // clamp long tab-away frames
      last = now
      const g = gameRef.current
      const events = step(g, dt, inputRef.current)
      for (const e of events) {
        playEvent(e)
        if (e.type === 'gameover') setPhase('over')
      }
      if (g.state === 'playing') setPhase((p) => (p === 'playing' ? p : 'playing'))
      setScore(g.score)
      render(ctx, g)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerdown', onPointerDown)
    }
  }, [pressAction])

  return (
    <div className="game-frame">
      <canvas ref={canvasRef} className="game-canvas" aria-label="Breakout playfield" />
      <Overlay phase={phase} score={score} onAction={pressAction} />
    </div>
  )
}
