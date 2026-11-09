// Headless physics smoke test: node scripts/smoke.js
// Simulates full games with a simple auto-paddle and asserts the
// engine's authentic behaviors hold up.

import assert from 'node:assert/strict'
import { createGame, step, launch } from '../src/game/engine.js'
import * as C from '../src/game/constants.js'

const input = { dir: 0, targetX: null }
const g = createGame()

// Auto-paddle: chase the ball.
function autoPaddle() {
  input.targetX = g.ball.x + C.BALL / 2
}

let events = []
launch(g)
assert.equal(g.state, 'playing')

let deaths = 0
let bricksSeen = 0
for (let frame = 0; frame < 60 * 120; frame++) {
  autoPaddle()
  const evs = step(g, 1 / 60, input)
  events.push(...evs)
  bricksSeen += evs.filter((e) => e.type === 'brick').length
  deaths += evs.filter((e) => e.type === 'death' || e.type === 'gameover').length
  if (g.state === 'serve' && g.lives > 0) launch(g)
  if (g.state === 'over') break

  // invariants
  assert.ok(g.ball.x >= -0.01 && g.ball.x <= C.PLAY_W + 0.01, `ball x out of range: ${g.ball.x}`)
  assert.ok(Math.abs(g.ball.vy) >= C.MIN_COMP - 1e-6, 'ball can go purely horizontal')
  assert.ok(g.score >= 0 && Number.isFinite(g.score))
}

assert.ok(bricksSeen > 30, `expected lots of bricks broken, got ${bricksSeen}`)
assert.ok(g.score > 0, 'expected a score')
assert.ok(g.speedLevel > 0, 'expected the ball to have sped up')

// Speed levels are discrete: every served speed matches a table entry.
for (const s of [1, 2, 3]) {
  launch(g)
  assert.ok(C.SPEEDS.includes(Math.round(Math.hypot(g.ball.vx, g.ball.vy))), 'speed off the table')
}

// Deflection quantization: a ball dropping onto each of the 8 paddle
// zones must rebound at exactly that zone's table angle.
const observed = []
for (let z = 0; z < 8; z++) {
  const gg = createGame()
  launch(gg)
  const center = z * (C.PADDLE_W / 8) + C.PADDLE_W / 16
  gg.paddleX = 40
  gg.ball.x = 40 + center - C.BALL / 2
  gg.ball.y = C.PADDLE_Y - C.BALL - 0.01
  gg.ball.vx = 0
  gg.ball.vy = C.SPEEDS[gg.speedLevel]
  step(gg, 1 / 120, { dir: 0, targetX: null })
  const angle = Math.round((Math.atan2(Math.abs(gg.ball.vx), -gg.ball.vy) * 180) / Math.PI)
  observed.push(angle)
  assert.ok(
    gg.ball.vy < 0,
    `zone ${z}: ball should rebound upward, vy=${gg.ball.vy}`,
  )
  const sign = center < C.PADDLE_W / 2 ? -1 : 1
  assert.equal(Math.sign(gg.ball.vx), sign, `zone ${z}: wrong horizontal direction`)
  assert.ok(
    Math.abs(angle - C.DEFLECT_ANGLES[z]) <= 1,
    `zone ${z}: expected ${C.DEFLECT_ANGLES[z]}°, got ${angle}°`,
  )
}

// Discrete speed: the speed vector magnitude always matches the table.
assert.ok(C.SPEEDS.includes(Math.round(Math.hypot(g.ball.vx, g.ball.vy))))

console.log(`OK — bricks broken: ${bricksSeen}, deaths: ${deaths}, score: ${g.score}, final state: ${g.state}`)
console.log(`Deflection angles per zone: ${observed.join(', ')}`)
