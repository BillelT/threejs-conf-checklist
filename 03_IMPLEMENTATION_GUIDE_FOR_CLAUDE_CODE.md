# Implementation Guide for Claude Code

## 1. Recommended stack

Use a deliberately small stack.

### Preferred

- Vite
- React
- TypeScript
- Three.js
- `@react-three/fiber`
- `@react-three/drei`
- Zustand (optional)
- Motion / Framer Motion for DOM
- CSS variables / plain CSS or a small styling layer

Do not introduce a heavy UI library.

### Rendering

Start with the normal Three.js renderer used by React Three Fiber.

WebGPU is **not required for v1**.

The reference site uses Three.js WebGPURenderer, TSL and advanced SSGI, but reproducing that stack is unnecessary for a small checklist.

Only upgrade to WebGPU if:
- the base interaction is already finished;
- fallback behavior is acceptable;
- a specific shader feature needs it.

---

## 2. Suggested project structure

```txt
src/
  app/
    App.tsx
  data/
    checklist.ts
  components/
    Checklist.tsx
    ChecklistItem.tsx
    Progress.tsx
    BlobButton.tsx
    CompletionMessage.tsx
  scene/
    Experience.tsx
    CharacterField.tsx
    Character.tsx
    PackedPile.tsx
    CameraRig.tsx
    Lighting.tsx
  hooks/
    useChecklistStore.ts
    useReducedMotion.ts
    usePointerForce.ts
  lib/
    characterSeed.ts
    springs.ts
    storage.ts
  styles/
    globals.css
    tokens.css
```

Keep the boundary clean:

- React DOM = semantic content and accessibility
- R3F = spatial/tactile layer
- shared store = synchronization

---

## 3. Checklist data

Keep editable content in one file.

```ts
export const checklist = [
  { id: 'badge', label: 'Volunteer badge' },
  { id: 'phone', label: 'Phone' },
  { id: 'charger', label: 'Charger' },
  { id: 'powerbank', label: 'Power bank' },
  { id: 'bottle', label: 'Water bottle' },
  { id: 'notebook', label: 'Notebook' },
  { id: 'pen', label: 'Pen' },
  { id: 'layer', label: 'Hoodie / light layer' },
]
```

The actual content should be easy to replace without touching scene code.

---

## 4. Persistent state

Store only item completion states.

Example:

```ts
{
  version: 1,
  packed: {
    badge: true,
    phone: false
  }
}
```

Use `localStorage`.

Add a visible `reset` control.

Do not persist transient physics positions.

---

## 5. Seeded character generator

A checklist item should always receive the same character after reload.

Derive visuals from `item.id` using a deterministic hash.

Generated properties:

```ts
type CharacterAppearance = {
  primary: string
  secondary: string
  roughness: number
  metalness: number
  pattern: 'solid' | 'stripe' | 'speckle' | 'spiral'
  face: 'dot' | 'sleepy' | 'wide'
  scale: number
}
```

This gives the site the feeling of a generative family without creating individual assets manually.

---

## 6. Character implementation

Start simple.

Character:
- one sphere mesh;
- optional second shell/pattern layer only if necessary;
- face rendered via texture, sprites, decals or simple geometry;
- shared geometry;
- limited material pool.

Do not create a custom shader before the base interaction works.

### Milestone order

1. colored spheres;
2. click/toggle;
3. spring movement;
4. pointer force;
5. faces;
6. material variation;
7. polish.

---

## 7. Motion implementation

Prefer a lightweight custom spring simulation for positions.

Each character owns mutable runtime values:

```ts
position
velocity
scaleVelocity
rotationVelocity
```

Render loop:

```ts
useFrame((state, delta) => {
  const dt = Math.min(delta, 1 / 30)

  applySpring(dt)
  applyPointerRepulsion(dt)
  applyNeighborSeparation(dt)
  integrate(dt)
})
```

Do not put per-frame physics values into React state.

Use refs / typed arrays / objects that can mutate without rerendering React.

---

## 8. Material implementation

v1:
- `MeshStandardMaterial`;
- vary color / roughness / metalness;
- one environment map;
- subtle normal map if available.

v2:
- procedural pattern shader or TSL;
- texture atlas;
- simple fresnel / iridescence.

Do not add SSGI until the project already runs correctly on mobile.

---

## 9. Responsive composition

Define three layouts:

### Desktop
- headline left / full background;
- checklist compact on right or bottom-right;
- 3D pile crossing the center;
- 10–20 visible characters.

### Tablet
- reduce title scale;
- move checklist lower;
- simplify pile depth.

### Mobile
- title at top;
- canvas takes middle portion;
- checklist becomes bottom DOM stack / sheet;
- reduce object count visible simultaneously if necessary;
- disable custom cursor and strong parallax.

Use breakpoint-specific target positions rather than forcing one 3D coordinate layout everywhere.

---

## 10. Accessibility

Non-negotiable:

- checklist exists as actual HTML;
- each row contains a native checkbox or button semantics;
- keyboard toggling works;
- 3D canvas is enhancement, not the only control;
- focus states are visible;
- contrast remains readable over gradients;
- reduced motion supported;
- canvas gets an appropriate accessible label or is hidden from the accessibility tree if purely redundant.

---

## 11. Interaction details to polish

### Checklist row hover
- label nudges horizontally;
- corresponding sphere gets a small impulse / scale pulse.

### Sphere hover
- DOM row highlights.

### Button hover
- blob slightly stretches toward cursor.

### Reset
- objects burst gently out of pile and return to loose positions.

### Loading
Do not use a large percent loader.

Instead:
- show typography immediately;
- fade / pop characters in as scene initializes.

---

## 12. Visual tokens

Start with CSS variables.

```css
:root {
  --cream: #f3edda;
  --ink: #151515;
  --lavender: #b6a4ff;
  --pink: #f66ab5;
  --violet: #7048ff;
  --sky: #9fd8ff;

  --radius-pill: 999px;
  --ui-outline: 2px;
}
```

These are starting points only.
Adjust them after inspecting the supplied screenshots.

---

## 13. Performance budget

Avoid premature optimization but enforce:

- sphere segments around `24–32`;
- shared geometry;
- max DPR 2;
- no unnecessary shadow-casting objects;
- no >2 post-processing passes in v1;
- no per-frame React state updates;
- no huge textures;
- compressed assets where practical.

If performance drops:
1. remove post-processing;
2. reduce DPR;
3. reduce sphere segments;
4. simplify shadows;
5. reduce active interaction radius.

---

## 14. Development milestones

### Milestone 1 — functional shell
- semantic checklist
- localStorage
- progress
- responsive typography

### Milestone 2 — 3D mapping
- one sphere per item
- seeded color
- click synchronization

### Milestone 3 — physics feel
- target springs
- pointer repulsion
- packed pile
- squash/stretch

### Milestone 4 — art direction
- gradients
- bold type
- faces
- material families
- blob buttons

### Milestone 5 — polish
- mobile
- reduced motion
- completion sequence
- performance pass
- transitions and micro-interactions

Do not jump directly to shader polish before Milestone 3 is enjoyable.

---

## 15. Acceptance checklist

Claude Code should verify:

- [ ] every checklist item toggles through DOM;
- [ ] every 3D character toggles the same shared item;
- [ ] refresh preserves state;
- [ ] reset works;
- [ ] all-packed state triggers exactly once;
- [ ] pointer interaction does not block clicks;
- [ ] mobile touch works;
- [ ] page is usable with keyboard;
- [ ] reduced-motion mode is usable;
- [ ] title remains readable;
- [ ] no horizontal scroll;
- [ ] no console errors;
- [ ] scene does not visibly hitch on initial shader compilation;
- [ ] visual design is inspired by reference, not a pixel clone.

---

## 16. Instruction to Claude Code

Use the provided screenshots as art-direction references.

Before implementing visual polish:
- inspect their typography scale;
- inspect object density;
- inspect depth / overlap;
- inspect gradient behavior;
- inspect softness and material contrast.

Build the experience in layers and keep it running after every milestone.

Prioritize:
1. interaction feel;
2. composition;
3. readability;
4. performance;
5. shader sophistication.

Do not sacrifice usability just to make the 3D more complex.
