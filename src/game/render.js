// Canvas renderer. Draws at native logical resolution onto an oversized
// canvas (backing store scaled by SCALE, CSS upscaled pixelated), so
// everything stays crisp blocks of "fat pixels" like the arcade.

import * as C from './constants.js'

const WHITE = '#ffffff'
const GRAY = '#888888'

export function setupCanvas(canvas) {
  canvas.width = C.LOGICAL_W * C.SCALE
  canvas.height = C.LOGICAL_H * C.SCALE
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  return ctx
}

export function render(ctx, g) {
  ctx.setTransform(C.SCALE, 0, 0, C.SCALE, 0, 0)
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, C.LOGICAL_W, C.LOGICAL_H)

  drawHud(ctx, g)

  ctx.save()
  ctx.translate(0, C.HUD_H)

  // playfield border
  ctx.strokeStyle = GRAY
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, C.PLAY_W - 1, C.PLAY_H - 1)

  // bricks
  for (let r = 0; r < C.BRICK_ROWS; r++) {
    for (let c = 0; c < C.BRICK_COLS; c++) {
      if (g.bricks[r * C.BRICK_COLS + c] <= 0) continue
      ctx.fillStyle = C.ROW_COLORS[r]
      ctx.fillRect(C.WALL_LEFT + c * C.BRICK_W, C.WALL_TOP + r * C.BRICK_H, C.BRICK_W, C.BRICK_H - 1)
    }
  }

  // paddle
  ctx.fillStyle = WHITE
  ctx.fillRect(Math.round(g.paddleX), C.PADDLE_Y, C.PADDLE_W, C.PADDLE_H)

  // ball
  if (g.state !== 'over') {
    ctx.fillRect(Math.round(g.ball.x), Math.round(g.ball.y), C.BALL, C.BALL)
  }

  ctx.restore()
}

// Score left, remaining balls right — like the top strip of the arcade.
function drawHud(ctx, g) {
  ctx.textBaseline = 'middle'
  ctx.font = 'bold 10px "Courier New", monospace'

  ctx.fillStyle = '#d82800'
  ctx.textAlign = 'left'
  ctx.fillText('1P', 3, 8)
  ctx.fillStyle = WHITE
  ctx.fillText(String(g.score).padStart(4, '0'), 16, 8)

  ctx.fillStyle = GRAY
  ctx.textAlign = 'right'
  ctx.fillText(`${g.lives}`, C.PLAY_W - 3, 8)
  ctx.textAlign = 'left'
  ctx.fillText('BALL', C.PLAY_W - 34, 8)

  ctx.fillStyle = GRAY
  ctx.font = '8px "Courier New", monospace'
  ctx.textAlign = 'left'
  ctx.fillText(`WALL ${g.wall}`, 3, 20)
}
