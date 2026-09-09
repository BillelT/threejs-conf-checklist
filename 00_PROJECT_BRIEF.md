# Project Brief — Three.js Conf Volunteer Checklist

## 1. Goal

Build a small, playful, creative checklist website for a volunteer attending the Three.js Conf in Paris.

The site should feel like a tiny interactive web toy rather than a productivity app.

The main inspiration is the visual and interaction language of `threejs.paris`:

- oversized editorial typography;
- saturated pastel gradients;
- cute glossy 3D characters built from simple primitives;
- playful spring physics;
- cursor-reactive objects;
- contrast between rigid 2D typography and chaotic 3D motion;
- an interface that feels tactile, soft, bouncy and alive.

The objective is **not to clone the conference website**. Reuse its design principles and playful energy while creating an original micro-experience around the idea of packing / preparing for the conference.

Reference:
- https://threejs.paris/
- https://tympanus.net/codrops/2026/02/28/when-community-becomes-ui-building-the-website-for-the-first-three-js-conference/

The user will provide screenshots as additional visual references.

---

## 2. Product concept

### Working concept: "PACKED?"

Every checklist item is represented by a small 3D creature/object.

Examples:

- Volunteer badge / accreditation
- Phone
- Charger
- Power bank
- Water bottle
- Notebook
- Pen
- Comfortable shoes
- Hoodie / light layer
- Transit card
- Earplugs
- Snacks
- Any volunteer-specific equipment

The list must be easy to edit in code.

### Core interaction

Unchecked items live loosely in the scene.

When an item is checked:

1. its 3D character reacts immediately;
2. it squashes slightly;
3. it jumps / flies toward a "packed" target area;
4. it settles into the pile with springy motion;
5. the associated UI item changes state;
6. progress updates.

When unchecked:

1. the object pops out of the packed pile;
2. it returns toward its original target;
3. the UI state reverts.

The point is to make checking an item feel like **physically packing it**.

---

## 3. Desired emotional tone

Keywords:

**playful / tactile / toy-like / experimental / cheerful / web-native / slightly chaotic / cute / fast / surprising**

Avoid:

- corporate dashboard aesthetics;
- glassmorphism SaaS cards;
- generic neon cyberpunk;
- excessive HUD elements;
- complex menus;
- photorealism;
- a literal copy of the conference identity.

The site should feel like something a creative developer made for friends before leaving for the event.

---

## 4. Experience structure

Keep the experience short.

### Hero / main view

Large editorial title, for example:

`DON'T`
`FORGET`
`YOUR`
`STUFF`

or:

`PACKED`
`FOR`
`THREE.JS?`

Use original wording rather than reproducing the conference headline.

Secondary text can explain the interaction in one short sentence.

Example:
> Click the little guys when they're packed.

### Checklist

The checklist can be visible as:

- a compact DOM list beside / over the canvas; or
- labels distributed around the scene; or
- a bottom sheet on mobile.

Recommended: keep actual text as accessible DOM elements and use 3D as a synchronized representation.

### Progress

Simple progress language:

- `0 / 12 packed`
- `almost there`
- `ready to go`

Avoid a traditional progress bar unless it is heavily stylized.

Possible visual progress:
- the packed pile gets larger;
- the background gradient shifts;
- title slightly compresses as the pile pushes against it.

### Completion state

When every item is checked:

- all objects bounce once;
- short celebratory camera impulse;
- faces switch to happy expressions;
- show a simple final message:
  `YOU'RE READY`
  `SEE YOU IN PARIS`

Do not create a long success flow.

---

## 5. Interaction principles

Every animation must reinforce one of these ideas:

1. **objects have weight**
2. **objects are alive**
3. **the cursor is a force**
4. **checking means packing**
5. **UI and 3D belong to the same physical world**

If an animation does not support one of these ideas, it is probably unnecessary.

---

## 6. Scope

### Must have

- responsive desktop + mobile;
- editable checklist data;
- persistent checked state using `localStorage`;
- interactive 3D characters;
- click/tap to toggle items;
- synchronized DOM checklist;
- springy transitions;
- cursor/pointer repulsion;
- progress feedback;
- completion animation;
- reduced-motion fallback;
- reasonable performance on mobile.

### Nice to have

- subtle procedural material variations;
- random face variations;
- sound toggle with tiny soft UI sounds;
- drag one or two characters;
- reset button;
- shareable screenshot-friendly final state.

### Explicitly out of scope for v1

- accounts;
- backend;
- multiplayer;
- CMS;
- real-time conference data;
- full custom physics engine;
- hundreds of objects;
- reproduction of the original site's WebGPU rendering pipeline.

---

## 7. Originality / brand guardrail

Treat `threejs.paris` as a **reference**, not as an asset library.

Do not reproduce:

- exact conference layout;
- exact sphere designs;
- proprietary textures;
- exact button silhouettes;
- conference logo or custom assets unless they are supplied and approved;
- exact typography if the font is not legitimately available.

Create original faces, colors, materials, wording and composition.

The connection should be recognizable through shared principles:
**chunky type + soft gradients + simple 3D mascots + physics + playful UI**.

---

## 8. Definition of done

The site is successful if:

- a visitor understands the checklist in under 5 seconds;
- checking an item is fun enough that they want to click several;
- the scene never compromises legibility;
- it works with mouse and touch;
- it still functions without WebGPU;
- checked state survives refresh;
- the final page feels authored rather than like a stock R3F demo.
