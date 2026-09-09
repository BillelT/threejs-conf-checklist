# Reference Analysis — threejs.paris

This file extracts the main reusable design ideas from the Three.js Conf website.

It is intentionally a **principle-level analysis**, not a cloning specification.

Sources:
- https://threejs.paris/
- https://tympanus.net/codrops/2026/02/28/when-community-becomes-ui-building-the-website-for-the-first-three-js-conference/

---

## 1. Core creative idea

On the conference site, the 3D spheres are not merely decoration.

They represent the community.

Each sphere can vary in:
- material;
- texture;
- color;
- expression;
- size/details.

They still belong to the same visual family because they share a simple rounded form and playful faces.

### Principle to reuse

Give repeated 3D objects a semantic role.

For the checklist:
**one character = one thing to pack**.

---

## 2. Art direction

The published case study describes the identity as deliberately anti-corporate.

Key traits:

- chunky uppercase typography;
- cream display lettering;
- saturated gradients;
- playful kawaii faces;
- super-flat graphic composition mixed with glossy 3D;
- minimal navigation;
- large visual gestures rather than dense UI.

### Principle to reuse

Use very few graphic ingredients, but make each one bold.

---

## 3. 2D / 3D tension

A defining composition technique is the contrast between:
- rigid 2D type;
- chaotic moving spheres.

The type behaves like a fixed graphic anchor.
The spheres create depth, overlap and instability.

### Principle to reuse

Do not make everything animated.
Static typography gives moving objects something to push against visually.

---

## 4. Physics-driven layout

The conference site began from a simple idea:
objects are attracted toward target points while pushing each other away.

The production system grew to include:
- velocity;
- springs;
- bounciness;
- UI AABB colliders;
- spatial hashing;
- worker-based physics computation.

### Principle to reuse

Do not keyframe every object path.

Define desired compositions as targets and let spring/repulsion generate the transition.

For a small checklist, use a much simpler implementation.

---

## 5. UI feels physical

The conference site's UI buttons use custom SVG shapes with many control points and react organically to the cursor.

This extends the physical language outside the 3D canvas.

### Principle to reuse

DOM should not feel like a separate product layer.

Even a simple button can:
- stretch toward the cursor;
- squash on press;
- spring back.

---

## 6. Material diversity

The spheres achieve diversity through combinations of:
- colors;
- normal maps;
- roughness;
- patterns;
- noise;
- eye variants.

The underlying geometry stays simple.

The production site uses optimized texture atlases, compressed textures and a custom TSL material built on Three.js PBR shading.

### Principle to reuse

Spend visual complexity on materials and behavior, not on heavy geometry.

For this checklist, a small preset system is sufficient.

---

## 7. Rendering

The reference implementation uses:
- Three.js WebGPURenderer;
- custom TSL material logic;
- Screen-Space Global Illumination;
- adaptive performance techniques.

SSGI contributes realistic color bleeding between saturated objects.

### Principle to reuse

The important visual result is **soft shared lighting and color interaction**, not the exact implementation.

For a small project:
- good PBR light;
- an environment map;
- contact shadows;
- subtle tone mapping;
are enough initially.

---

## 8. Performance philosophy

The conference site is optimized for many visually different objects through:
- instancing;
- texture atlases;
- KTX2 compression;
- packed instance attributes;
- worker-based physics;
- device-adaptive rendering.

### Principle to reuse

Scale complexity to the number of objects.

A checklist with 10–20 objects does not need the same architecture.
Do not cargo-cult production optimizations.

---

## 9. What to copy conceptually

Good inspiration:

- visual tension between flat type and physical 3D;
- one simple primitive repeated as a family;
- cursor as an invisible force;
- physics-based transitions;
- tactile DOM controls;
- large gradients;
- minimal UI;
- character/personality through materials and faces;
- simple actions that create surprising motion.

---

## 10. What not to copy literally

Avoid:

- exact sphere designs;
- exact conference title composition;
- exact colors;
- exact SVG button shape;
- exact textures;
- exact faces;
- proprietary brand assets;
- recreating the same page sections.

Create a new mini-world whose concept is packing / remembering items.

---

## 11. Most important takeaway

The strongest part of the reference is the alignment between:

```txt
meaning
→ visual form
→ motion
→ interaction
→ technical system
```

For this project:

```txt
need to remember things
→ each item becomes a character
→ unchecked characters wander
→ checking physically packs them
→ the packed pile visualizes progress
```

That conceptual alignment matters more than reproducing any individual shader.
