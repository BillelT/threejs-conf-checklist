const ITEM_LAYOUT_SEED_KEY = 'threejs-conf-checklist:item-layout-seed'

function createSeed() {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const values = new Uint32Array(1)
    crypto.getRandomValues(values)
    return values[0] || Date.now()
  }

  return Math.floor(Math.random() * 0xffffffff) || Date.now()
}

export function getItemLayoutSeed() {
  if (typeof window === 'undefined') return 1

  const saved = window.localStorage.getItem(ITEM_LAYOUT_SEED_KEY)
  const parsed = saved ? Number.parseInt(saved, 10) : 0
  if (Number.isFinite(parsed) && parsed > 0) return parsed

  const seed = createSeed()
  window.localStorage.setItem(ITEM_LAYOUT_SEED_KEY, String(seed))
  return seed
}

export function seededRandom(seed: number) {
  let value = seed >>> 0

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 4294967296
  }
}
