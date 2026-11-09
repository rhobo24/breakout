// Pure game engine: no DOM, no React, no rendering. step() mutates the
// game state at a fixed timestep and returns a list of events so the
// host (audio, UI) can react. This separation keeps the physics
// deterministic and testable in isolation (see server smoke test in
// README).

import * as C from './constants.js'

const D2R = Math.PI / 180

export function buildWall() {
  const bricks = new Array(C.BRICK_ROWS * C.BRICK_COLS)
  for (let r = 0; r < C.BRICK_ROWS; r++)
    for (let c = 0; c < C.BRICK_COLS; c++)
      bricks[r * C.BRICK_COLS + c] = C.ROW_POINTS[r]
  return bricks
}

export function createGame() {
  const g = {
    state: 'serve', // serve | playing | over
    score: 0,
    lives: C.LIVES,
    wall: 1, // walls cleared + 1; each wall starts the ball faster
    bricks: buildWall(),
    bricksLeft: C.BRICK_ROWS * C.BRICK_COLS,
    bricksBroken: 0, // within the current wall, drives speed level
    speedLevel: 0,
    paddleX: (C.PLAY_W - C.PADDLE_W) / 2,
    ball: { x: 0, y: 0, vx: 0, vy: 0 },
    serveRight: false, // serve direction alternates like the arcade
  }
  resetBall(g)
  return g
}

function speed(g) {
  const fromBricks = Math.floor(g.bricksBroken / C.SPEEDUP_EVERY)
  const fromWalls = g.wall - 1
  g.speedLevel = Math.min(C.SPEEDS.length - 1, fromBricks + fromWalls)
}

function setBallSpeed(g) {
  const b = g.ball
  const mag = Math.hypot(b.vx, b.vy) || 1
  const s = C.SPEEDS[g.speedLevel]
  b.vx = (b.vx / mag) * s
  b.vy = (b.vy / mag) * s
}

function resetBall(g) {
  const b = g.ball
  b.x = g.paddleX + C.PADDLE_W / 2 - C.BALL / 2
  b.y = C.PADDLE_Y - C.BALL
  b.vx = 0
  b.vy = 0
  g.state = 'serve'
}

export function launch(g) {
  if (g.state !== 'serve') return
  speed(g)
  const b = g.ball
  const s = C.SPEEDS[g.speedLevel]
  const a = C.SERVE_ANGLE * D2R
  g.serveRight = !g.serveRight
  b.vx = Math.sin(a) * s * (g.serveRight ? 1 : -1)
  b.vy = -Math.cos(a) * s
  g.state = 'playing'
}

// Move one axis and resolve that axis's collisions. The original
// hardware stepped x and y counters independently, and so do we.
function moveX(g, events) {
  const b = g.ball
  b.x += b.vx * C.STEP
  if (b.x < 0) {
    b.x = 0
    b.vx = Math.abs(b.vx)
  } else if (b.x + C.BALL > C.PLAY_W) {
    b.x = C.PLAY_W - C.BALL
    b.vx = -Math.abs(b.vx)
  }
  const hit = brickAt(g, b.x, b.y)
  if (hit >= 0) {
    // undo and reflect horizontally
    b.x -= b.vx * C.STEP
    b.vx = -b.vx
    destroyBrick(g, hit, events)
  }
}

function moveY(g, events) {
  const b = g.ball
  b.y += b.vy * C.STEP

  if (b.y < 0) {
    b.y = 0
    b.vy = Math.abs(b.vy)
    return
  }

  // paddle: only catches a descending ball
  if (
    b.vy > 0 &&
    b.y + C.BALL >= C.PADDLE_Y &&
    b.y <= C.PADDLE_Y + C.PADDLE_H &&
    b.x + C.BALL >= g.paddleX &&
    b.x <= g.paddleX + C.PADDLE_W
  ) {
    b.y = C.PADDLE_Y - C.BALL
    paddleBounce(g, events)
    return
  }

  if (b.y > C.PLAY_H) {
    loseBall(g, events)
    return
  }

  const hit = brickAt(g, b.x, b.y)
  if (hit >= 0) {
    b.y -= b.vy * C.STEP
    b.vy = -b.vy
    destroyBrick(g, hit, events)
  }
}

// Which existing brick (index) does the ball square overlap? -1 if none.
function brickAt(g, bx, by) {
  const top = C.WALL_TOP
  const bottom = top + C.BRICK_ROWS * C.BRICK_H
  if (by + C.BALL <= top || by >= bottom) return -1
  const r0 = Math.max(0, Math.floor(by / C.BRICK_H - top / C.BRICK_H))
  const r1 = Math.min(C.BRICK_ROWS - 1, Math.floor((by + C.BALL - 0.001) / C.BRICK_H - top / C.BRICK_H))
  const c0 = Math.max(0, Math.floor((bx - C.WALL_LEFT) / C.BRICK_W))
  const c1 = Math.min(C.BRICK_COLS - 1, Math.floor((bx + C.BALL - 0.001 - C.WALL_LEFT) / C.BRICK_W))
  for (let r = r0; r <= r1; r++)
    for (let c = c0; c <= c1; c++) {
      const x = C.WALL_LEFT + c * C.BRICK_W
      const y = top + r * C.BRICK_H
      if (bx + C.BALL > x && bx < x + C.BRICK_W && by + C.BALL > y && by < y + C.BRICK_H) {
        const i = r * C.BRICK_COLS + c
        if (g.bricks[i] > 0) return i
      }
    }
  return -1
}

function destroyBrick(g, i, events) {
  const pts = g.bricks[i]
  g.bricks[i] = 0
  g.score += pts
  g.bricksBroken++
  g.bricksLeft--
  events.push({ type: 'brick', points: pts, row: Math.floor(i / C.BRICK_COLS) })

  speed(g)
  setBallSpeed(g)

  if (g.bricksLeft === 0) {
    g.wall++
    g.bricks = buildWall()
    g.bricksLeft = C.BRICK_ROWS * C.BRICK_COLS
    g.bricksBroken = 0
    events.push({ type: 'wallcleared', wall: g.wall })
    resetBall(g)
  }
}

// 8 discrete deflection zones across the paddle, PROM-style: the zone
// the ball lands in picks one fixed rebound angle, flatter at the edges.
function paddleBounce(g, events) {
  const b = g.ball
  const center = b.x + C.BALL / 2
  let zone = Math.floor(((center - g.paddleX) / C.PADDLE_W) * 8)
  zone = Math.max(0, Math.min(7, zone))
  const angle = C.DEFLECT_ANGLES[zone] * D2R
  const s = C.SPEEDS[g.speedLevel]
  b.vx = Math.sin(angle) * s * (center < g.paddleX + C.PADDLE_W / 2 ? -1 : 1)
  b.vy = -Math.abs(Math.cos(angle) * s)
  clampComponents(g)
  events.push({ type: 'paddle' })
}

// Never let the ball travel purely vertical or horizontal — the
// hardware counters always advanced on both axes. Re-normalize to the
// current level's speed after clamping.
function clampComponents(g) {
  const b = g.ball
  if (Math.abs(b.vx) < C.MIN_COMP) b.vx = Math.sign(b.vx || 1) * C.MIN_COMP
  if (Math.abs(b.vy) < C.MIN_COMP) b.vy = Math.sign(b.vy || -1) * C.MIN_COMP
  setBallSpeed(g)
}

function loseBall(g, events) {
  g.lives--
  events.push({ type: g.lives > 0 ? 'death' : 'gameover' })
  if (g.lives > 0) resetBall(g)
  else {
    g.state = 'over'
    g.ball.vx = 0
    g.ball.vy = 0
  }
}

// Advance the simulation by dt seconds. `input` is
// { dir: -1|0|1 (keyboard), targetX: playfield-x the pointer wants, or null }
export function step(g, dt, input) {
  const events = []

  // Paddle: keyboard nudges, pointer tracks with a slew limit.
  if (input.dir !== 0) {
    g.paddleX += input.dir * C.PADDLE_KEY_SPEED * dt
  } else if (input.targetX != null) {
    const want = input.targetX - C.PADDLE_W / 2
    const maxDelta = C.PADDLE_MAX_SPEED * dt
    g.paddleX += Math.max(-maxDelta, Math.min(maxDelta, want - g.paddleX))
  }
  g.paddleX = Math.max(0, Math.min(C.PLAY_W - C.PADDLE_W, g.paddleX))

  if (g.state === 'serve') {
    resetBall(g) // ball rides on the paddle before launch
    return events
  }
  if (g.state !== 'playing') return events

  // Fixed-timestep substeps: never move more than ~1px per substep so
  // fast balls can't tunnel through bricks or the paddle.
  let remaining = dt
  while (remaining > 1e-9 && g.state === 'playing') {
    const h = Math.min(C.STEP, remaining)
    moveX(g, events)
    if (g.state !== 'playing') break
    moveY(g, events)
    remaining -= h
  }
  return events
}
