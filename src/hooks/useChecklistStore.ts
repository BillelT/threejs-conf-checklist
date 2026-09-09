import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ItemKind } from '../data/checklist'

type State = {
  packed: Record<string, boolean>
  toggle: (id: ItemKind) => boolean
  reset: () => void
}

export const useChecklistStore = create<State>()(
  persist(
    (set, get) => ({
      packed: {},
      toggle: (id) => {
        const current = !!get().packed[id]
        const next = !current
        set({ packed: { ...get().packed, [id]: next } })
        return next
      },
      reset: () => set({ packed: {} })
    }),
    { name: 'threejs-conf-checklist' }
  )
)
