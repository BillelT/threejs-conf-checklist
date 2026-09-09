# 3D Interaction & Animation Spec

## 1. Main interaction metaphor

The scene is a physical packing table.

Each checklist item owns one 3D character.

State:

```ts
type ChecklistItem = {
  id: string
  label: string
  packed: boolean
  characterSeed: number
}
```

Each character has two conceptual targets:

- `looseTarget`
- `packedTarget`

The animation system continuously pulls the character toward the active target using spring-like motion.

This recreates the useful principle from the reference site:
**art direction defines the target composition; physics defines how objects travel toward it.**

---

## 2. Idle scene

Unchecked characters should never look completely frozen.

Use only subtle movement:

- micro breathing scale;
- very slow rotational drift;
- occasional eye movement;
- tiny spring response to nearby pointer movement.

Do not use identical sine-wave floating on every object.

Add seeded variation in:
- phase;
- amplitude;
- rotation speed.

---

## 3. Pointer interaction

Treat the pointer as a soft repulsive force.

When pointer enters an influence radius:

```txt
character velocity += normalized(character - pointerWorldPos)
                    * force
                    * falloff
```

Desired result:

- characters move away;
- nearby objects react more strongly;
- movement has inertia;
- characters return to targets after pointer leaves.

Do not teleport positions.

### Touch

On touch devices:
- use tap interaction;
- optionally add a short radial impulse around tap position;
- do not rely on hover.

---

## 4. Toggle interaction

### On pack

Sequence:

1. `pointerDown`
   - character squashes to ~`scaleY 0.9`
   - horizontal scale grows slightly

2. `pointerUp`
   - small upward impulse
   - set `packed = true`
   - target changes to packed position

3. travel
   - spring accelerates toward pile
   - small rotation impulse

4. arrival
   - collide / visually compress against nearby packed characters
   - one short rebound
   - face can blink / smile

The DOM checklist state must update immediately, not after the animation.

### On unpack

Reverse concept:

- character receives outward/upward impulse;
- target returns to its loose location;
- expression briefly changes;
- item reappears as active in DOM list.

---

## 5. Packed pile

The packed pile is the emotional center of the experience.

Options, from simplest to most advanced:

### Recommended v1 — target cluster

Precompute a set of packed positions arranged in a loose mound.

Assign checked items to these slots.

Add local spring + mild pairwise repulsion so objects do not overlap too strongly.

Advantages:
- deterministic;
- performant;
- easy on mobile;
- visually art-directable.

### Optional v2 — Rapier physics

Use sphere colliders and a shallow container.

This can be fun but may introduce:
- unstable settling;
- difficult responsive layout;
- more CPU cost;
- harder reproducibility.

Do not start with full rigid-body physics unless the simple system is insufficient.

---

## 6. Lightweight custom motion model

A simple per-object model is enough:

```ts
velocity += (target - position) * springStrength
velocity *= damping
velocity += externalForces
position += velocity
```

Then add:
- pointer repulsion;
- optional neighbor separation;
- click impulse.

Use fixed-ish timestep or clamp delta to avoid huge impulses after tab switching.

---

## 7. Neighbor separation

For a small checklist (< 30 items), an O(n²) separation pass is acceptable.

Pseudo logic:

```ts
for each pair:
  delta = b.position - a.position
  if distance < minDistance:
    push both objects apart
```

No need for the spatial hashing used by the conference site unless object count increases significantly.

---

## 8. UI ↔ 3D synchronization

Every item must be toggleable through:

- the 3D character;
- the DOM checklist row;
- keyboard interaction.

Both surfaces update one shared state store.

Suggested store:
- Zustand; or
- plain React state for a very small app.

Avoid duplicated state inside individual meshes.

---

## 9. Optional DOM collision illusion

The reference project allows UI and 3D to feel physically connected.

For this smaller project, fake it rather than implement full HTML collision.

Technique:

1. read headline/checklist bounding rects;
2. map them approximately to normalized device coordinates;
3. define exclusion zones;
4. nudge loose 3D targets away from those zones.

Alternative:
simply art-direct target coordinates so the pile visibly overlaps the big title but avoids smaller text.

---

## 10. Camera

Use an almost poster-like camera.

Recommended:
- PerspectiveCamera with low/moderate FOV (`30–45`);
- very little camera rotation;
- no orbit controls.

Subtle pointer parallax:
- camera x/y moves only a few percent;
- interpolate smoothly;
- never compromise readability.

Completion:
- one very small camera push or shake;
- return quickly.

The camera should support the composition, not become the experience.

---

## 11. Scroll

Best v1 option:
**single-screen / near single-screen experience**.

If content exceeds viewport:
- let DOM scroll normally;
- keep canvas fixed/sticky;
- subtly shift 3D composition based on scroll.

Avoid long cinematic scroll sequences.
The tool should remain usable as a checklist.

---

## 12. Completion animation

Trigger exactly once when progress reaches 100%.

Suggested sequence:

```txt
0 ms      progress hits 100%
0–200 ms  all characters squash
200 ms     radial upward impulse
200–900 ms pile bounces
300 ms     background begins color transition
500 ms     headline changes to READY
800 ms     happy faces / eye blink
1200 ms    scene settles
```

Respect `prefers-reduced-motion`.

Do not trigger full-screen particle spam.

---

## 13. Hover / cursor details

Desktop:

- cursor can become a chunky custom dot/blob;
- character under hover looks toward cursor;
- label highlights;
- button shape compresses toward pointer.

Keep the custom cursor optional and disable it for coarse pointers.

---

## 14. Performance rules

Target:
- 60 FPS on a modern laptop;
- smooth enough on recent phones.

Use:

- shared sphere geometry;
- shared material presets;
- instancing if convenient;
- low/medium polygon sphere;
- DPR cap around `1.5–2`;
- paused/minimal updates when tab is hidden;
- adaptive effects;
- no expensive post-processing by default.

For 10–20 items, clarity matters more than extreme optimization.

---

## 15. Reduced motion

When `prefers-reduced-motion: reduce`:

- disable pointer repulsion;
- remove camera parallax;
- replace jump paths with quick eased translations;
- remove continuous idle motion;
- retain clear state changes.

The checklist must remain completely usable.
