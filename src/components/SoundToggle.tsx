import { useState } from 'react'
import { isSoundMuted, playSound, setSoundMuted } from '../lib/sounds'

export function SoundToggle() {
  const [muted, setMuted] = useState(isSoundMuted)
  return <button className="sound-toggle" type="button" aria-label="Mute sound effects" aria-pressed={muted}
    onClick={() => { setSoundMuted(!muted); setMuted(!muted); if (muted) playSound('pickup') }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4Z" strokeLinejoin="round" />
      {muted ? <path d="m16 9 6 6m0-6-6 6" /> : <><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" /></>}
    </svg>
    Sound {muted ? 'off' : 'on'}
  </button>
}
