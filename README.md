# Breakout

A browser recreation of Atari's *Breakout* (1976), built with React + Vite.
React provides the shell; the game itself is a canvas simulation with a pure,
testable physics core.

## Run it

```sh
npm install
npm run dev      # dev server
npm run build    # production build
node scripts/smoke.js   # headless physics test
```

Controls: **mouse** or **← →** (or A/D) to move the paddle, **space** /
**click** to launch.

## Architecture

```
src/
  game/
    constants.js   all physics/layout tuning in one place
    engine.js      pure simulation: state + step() -> events (no DOM)
    render.js      canvas drawing at native logical resolution
    audio.js       WebAudio square-wave blips
  components/
    GameCanvas.jsx rAF loop, input wiring (game state lives in a ref,
                   so 60 fps never re-renders React)
    Overlay.jsx    title / game-over screens
scripts/smoke.js   headless full-game simulation + invariant checks
```

## Physics fidelity

The playfield is the original **114×192 logical pixels**, upscaled by an
integer factor with `image-rendering: pixelated`.

Behaviors modeled after the original hardware (researched from the schematic
netlist model in MAME — circuit behavior only, no code copied — and
published technical descriptions of the deflection PROM and speed counters):

- **8-zone paddle deflection.** The real machine divided the paddle into 8
  discrete zones wired through a PROM; each zone reflects the ball at one
  fixed angle, flatter toward the edges. Exactly reproduced: rebound angles
  are always one of `[70°, 55°, 40°, 25°]` (mirrored), never continuous.
- **Discrete speed levels.** The ball moves at one of a few stepped speeds
  (hardware counters selecting the ball clock). Ours steps up every 8
  bricks destroyed and whenever a full wall is cleared, and never drops.
- **Axis-separated motion.** The arcade advanced its X and Y position
  counters independently and bounces flipped exactly one axis. The physics
  step moves each axis separately and resolves collisions per axis, which
  also reproduces the characteristic corner behavior.
- **Both axes always progress.** The hardware counters could not stall on
  one axis, so the ball never travels purely vertical or horizontal
  (minimum component enforced).
- **Slew-limited paddle.** The arcade paddle was a potentiometer you had to
  physically turn; pointer input is speed-clamped rather than teleporting.
- **Scoring** matches the classic scheme: top rows score 7, mid rows 4,
  bottom rows 1; clearing the wall starts a new, faster wall.
- **3 lives**, serve alternates sides, serve angle fixed like the arcade.

The exact PROM table values and speed clock ratios of the 1976 hardware are
not precisely documented anywhere I could verify; the numbers in
`constants.js` produce the authentic *behavior* (quantized angles, stepped
speeds, flat edge shots) and are all in one file for easy tuning.

## Status

Scaffold complete: physics core, rendering, audio, input, and UI all working.
Possible next steps: two-player alternating turns, the enhanced 1976 game
variants (curve, steering, stuck ball), high-score table.
