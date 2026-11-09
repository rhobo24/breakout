// Tiny WebAudio blip synth — square waves only, in the spirit of the
// discrete-sound-board original. Lazily created on first user gesture.

let ctx = null

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function blip(ac, freq, dur, delay = 0, type = 'square', gain = 0.08) {
  const t = ac.currentTime + delay
  const osc = ac.createOscillator()
  const env = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  env.gain.setValueAtTime(gain, t)
  env.gain.exponentialRampToValueAtTime(0.001, t + dur)
  osc.connect(env).connect(ac.destination)
  osc.start(t)
  osc.stop(t + dur)
}

// Higher rows ring brighter, like escalating pitch in the arcade.
const BRICK_PITCH = [880, 880, 660, 660, 520, 520, 440, 440]

export function playEvent(e) {
  const ac = ensure()
  if (!ac) return
  switch (e.type) {
    case 'paddle':
      blip(ac, 220, 0.06)
      break
    case 'brick':
      blip(ac, BRICK_PITCH[e.row] ?? 440, 0.05)
      break
    case 'death':
      blip(ac, 160, 0.12)
      blip(ac, 110, 0.18, 0.12)
      blip(ac, 70, 0.3, 0.3)
      break
    case 'gameover':
      blip(ac, 160, 0.15)
      blip(ac, 110, 0.15, 0.15)
      blip(ac, 70, 0.15, 0.3)
      blip(ac, 50, 0.5, 0.45)
      break
    case 'wallcleared':
      for (let i = 0; i < 6; i++) blip(ac, 440 + i * 110, 0.07, i * 0.06)
      break
  }
}
