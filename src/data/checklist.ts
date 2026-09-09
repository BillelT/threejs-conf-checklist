export type ItemKind =
  | 'notebook'
  | 'toothbrush'
  | 'pen'
  | 'laptop'
  | 'badge'
  | 'blender'

export type ChecklistItem = {
  id: ItemKind
  label: string
  color: string
  accent: string
}

export const checklist: ChecklistItem[] = [
  { id: 'notebook',   label: 'Yellow notebook',  color: '#ffd94a', accent: '#f56b3a' },
  { id: 'toothbrush', label: 'Toothbrush',       color: '#a8dcff', accent: '#ff6ab8' },
  { id: 'pen',        label: 'Trusty pen',       color: '#1672ef', accent: '#ff43b2' },
  { id: 'laptop',     label: 'Laptop',           color: '#e7e2d0', accent: '#7d63ff' },
  { id: 'badge',      label: 'Three.js badge',   color: '#7d63ff', accent: '#ffd94a' },
  { id: 'blender',    label: 'Blender sticker',  color: '#ff9a5a', accent: '#3b82f6' }
]
