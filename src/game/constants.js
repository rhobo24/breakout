// Units: "logical pixels" of the original 114x192 Atari playfield.
// The canvas is an integer multiple of this, upscaled pixelated.

export const PLAY_W = 114
export const PLAY_H = 192
export const HUD_H = 26
export const LOGICAL_W = PLAY_W
export const LOGICAL_H = PLAY_H + HUD_H
export const SCALE = 4

// Wall: 8 rows x 14 bricks, classic Breakout colors and point values
// (top rows hardest to reach, worth most).
export const BRICK_ROWS = 8
export const BRICK_COLS = 14
export const BRICK_W = 8
export const BRICK_H = 4
export const WALL_TOP = 42 // playfield-relative y of first brick row
export const WALL_LEFT = 1 // (114 - 14*8) / 2

export const ROW_COLORS = [
  '#f8d800', // yellow
  '#f8d800',
  '#d82800', // red
  '#d82800',
  '#6844fc', // violet
  '#6844fc',
  '#00a800', // green
  '#00a800',
]
export const ROW_POINTS = [7, 7, 4, 4, 1, 1, 1, 1]

export const PADDLE_W = 12
export const PADDLE_H = 3
export const PADDLE_Y = PLAY_H - 14 // top edge, playfield-relative
// The arcade paddle was a potentiometer with a physical slew limit, so it
// cannot teleport. We clamp paddle speed the same way (px/s, mouse input).
// Tuned down from 480/340 — faster tracking caused overshoot.
export const PADDLE_MAX_SPEED = 220
export const PADDLE_KEY_SPEED = 170

// --- Ball physics -----------------------------------------------------
// Authentic behaviors modeled (original 1976 hardware, from published
// technical descriptions of the deflection PROM and speed counters):
//
//  * The paddle is divided into 8 discrete zones; each zone reflects the
//    ball at one FIXED angle, flatter toward the edges. No continuous
//    angle math, just like the PROM lookup.
export const DEFLECT_ANGLES = [70, 55, 40, 25, 25, 40, 55, 70] // deg from vertical
//  * The ball has a small number of discrete speed levels; it steps up
//    after every SPEEDUP_EVERY bricks destroyed (and when a wall is
//    cleared). It is never allowed to go purely vertical or horizontal,
//    so it always makes progress on both axes.
export const SPEEDS = [70, 100, 135] // px/s, per level
export const SPEEDUP_EVERY = 8 // bricks per level step...
export const MIN_COMP = 8 // min |vx| or |vy| after a reflection, px/s
//  * X and Y positions were driven by independent counters, so bounces
//    mirror exactly one axis. Our physics step moves each axis
//    separately and tests collisions after each axis move.
export const STEP = 1 / 120 // fixed physics timestep (s)

export const BALL = 2 // ball is a 2x2 logical-pixel square
export const SERVE_ANGLE = 30 // deg from vertical, aimed toward field center
export const LIVES = 3
