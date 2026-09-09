// Original synthesized foley: rounded rubber notes, brushed air and tiny chimes.
export type Sound = 'pickup' | 'return' | 'pack' | 'confetti' | 'celebrate' | 'bump'
type Options = { intensity?: number; pan?: number }
let context: AudioContext | undefined
let master: GainNode | undefined
let noise: AudioBuffer | undefined
let muted = false
let lastBump = -Infinity
let foregroundUntil = 0
try { muted = localStorage.getItem('packing-muted') === 'true' } catch { /* Storage is optional. */ }

export const isSoundMuted = () => muted
export function setSoundMuted(value: boolean) {
  muted = value
  if (master && context) master.gain.setTargetAtTime(value ? 0 : 0.42, context.currentTime, 0.025)
  try { localStorage.setItem('packing-muted', String(value)) } catch { /* Storage is optional. */ }
}

function prepareAudio() {
  context ??= new AudioContext()
  if (!master) {
    master = context.createGain()
    master.gain.value = muted ? 0 : 0.42
    const compressor = context.createDynamicsCompressor()
    compressor.threshold.value = -18
    compressor.knee.value = 18
    compressor.ratio.value = 3
    compressor.attack.value = 0.008
    compressor.release.value = 0.18
    master.connect(compressor).connect(context.destination)
    noise = context.createBuffer(1, context.sampleRate, context.sampleRate)
    const samples = noise.getChannelData(0)
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1
  }
  return context
}

// Browsers require an initial click/tap/key before pointer movement can make sound.
export function installSoundUnlock() {
  const unlock = () => {
    if (muted) return
    try { void prepareAudio().resume().catch(() => {}) } catch { /* Audio is optional. */ }
  }
  window.addEventListener('pointerdown', unlock, { capture: true })
  window.addEventListener('keydown', unlock)
  return () => {
    window.removeEventListener('pointerdown', unlock, { capture: true })
    window.removeEventListener('keydown', unlock)
  }
}

export function playSound(sound: Sound, options: Options = {}) {
  if (muted || document.hidden) return
  // Hover never creates/resumes audio contexts, and multiple balls share one limit.
  if (sound === 'bump' && (!context || context.state !== 'running')) return
  try {
    const ctx = prepareAudio()
    if (sound === 'bump' && ctx.currentTime - lastBump < 0.125) return
    if (sound === 'bump') lastBump = ctx.currentTime
    else foregroundUntil = ctx.currentTime + (sound === 'celebrate' ? 1.4 : 0.8)
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
    const start = ctx.currentTime + 0.012
    const intensity = Math.max(0, Math.min(1, options.intensity ?? 1))
    const variation = sound === 'celebrate' ? 1 : 0.94 + Math.random() * 0.12
    const output = ctx.createGain()
    output.gain.value = sound === 'bump' ? intensity * (ctx.currentTime < foregroundUntil ? 0.35 : 1) : 1
    const pan = ctx.createStereoPanner()
    pan.pan.value = Math.max(-0.65, Math.min(0.65, options.pan ?? 0))
    output.connect(pan).connect(master!)
    let voices = 0
    const release = () => { if (--voices === 0) { output.disconnect(); pan.disconnect() } }
    const envelope = (gain: GainNode, when: number, duration: number, volume: number, attack = 0.012) => {
      gain.gain.setValueAtTime(0, when)
      gain.gain.linearRampToValueAtTime(volume, when + attack)
      gain.gain.exponentialRampToValueAtTime(0.0001, when + duration)
      gain.gain.linearRampToValueAtTime(0, when + duration + 0.015)
    }
    const tone = (pitches: number[], delay: number, duration: number, volume: number, type: OscillatorType = 'sine') => {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 2600
      oscillator.type = type
      pitches.forEach((pitch, i) => {
        const t = start + delay + duration * i / Math.max(1, pitches.length - 1)
        if (i === 0) oscillator.frequency.setValueAtTime(pitch * variation, t)
        else oscillator.frequency.exponentialRampToValueAtTime(pitch * variation, t)
      })
      envelope(gain, start + delay, duration, volume)
      oscillator.connect(filter).connect(gain).connect(output)
      voices++
      oscillator.onended = () => { oscillator.disconnect(); filter.disconnect(); gain.disconnect(); release() }
      oscillator.start(start + delay)
      oscillator.stop(start + delay + duration + 0.025)
    }
    const air = (delay: number, duration: number, frequency: number, volume: number) => {
      const source = ctx.createBufferSource()
      source.buffer = noise!
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.Q.value = 0.65
      filter.frequency.setValueAtTime(frequency, start + delay)
      filter.frequency.exponentialRampToValueAtTime(frequency * 0.45, start + delay + duration)
      const gain = ctx.createGain()
      envelope(gain, start + delay, duration, volume, Math.min(0.045, duration * 0.25))
      source.connect(filter).connect(gain).connect(output)
      voices++
      source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); release() }
      source.start(start + delay, Math.random() * 0.4)
      source.stop(start + delay + duration + 0.025)
    }
    if (sound === 'bump') {
      const pitch = 230 + Math.random() * 160
      tone([pitch * 1.3, pitch, pitch * 0.56], 0, 0.14, 0.12)
      tone([pitch * 1.9, pitch * 1.3], 0.012, 0.09, 0.018, 'triangle')
      air(0, 0.075, 650, 0.025)
    }
    if (sound === 'pickup') {
      air(0, 0.13, 1100, 0.075)
      tone([260, 620, 470], 0, 0.19, 0.24)
      tone([720, 960, 880], 0.055, 0.18, 0.055, 'triangle')
    }
    if (sound === 'return') {
      tone([390, 170, 250, 150], 0, 0.3, 0.2)
      tone([230, 120], 0.19, 0.16, 0.09)
      air(0.18, 0.13, 550, 0.055)
    }
    if (sound === 'pack') {
      air(0, 0.36, 1400, 0.11)
      tone([240, 480, 740], 0, 0.3, 0.11)
      tone([310, 115, 155, 80], 0.5, 0.23, 0.3)
      air(0.51, 0.16, 700, 0.1)
      tone([660, 660], 0.6, 0.24, 0.095, 'triangle')
      tone([990, 990], 0.68, 0.28, 0.06)
    }
    if (sound === 'confetti') {
      air(0, 0.23, 1800, 0.16)
      tone([270, 100], 0, 0.12, 0.17)
      ;[1320, 1650, 1980].forEach((pitch, i) => {
        tone([pitch, pitch * 0.98], 0.055 + i * 0.055, 0.25, 0.045)
        air(0.035 + i * 0.06, 0.065, 2200, 0.025)
      })
    }
    if (sound === 'celebrate') {
      air(0, 0.35, 1500, 0.12)
      ;[523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((pitch, i) => {
        tone([pitch * 0.96, pitch, pitch], i * 0.115, 0.42, 0.14, 'triangle')
        tone([pitch * 2, pitch * 2], i * 0.115 + 0.015, 0.29, 0.035)
        tone([pitch, pitch], i * 0.115 + 0.16, 0.35, 0.025)
      })
      ;[523.25, 659.25, 783.99].forEach(pitch => tone([pitch, pitch], 0.65, 0.65, 0.065))
    }
  } catch { /* Keep packing usable when Web Audio is unavailable. */ }
}
