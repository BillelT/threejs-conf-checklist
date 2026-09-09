# Visual Direction

## 1. Reference DNA

The visual language of the Three.js Conf site can be reduced to a few strong principles.

### A. Rigid 2D vs playful 3D

A major source of tension comes from pairing:

- huge, flat, immovable typography;
- small round 3D forms that bounce, collide and overlap it.

For this project, preserve that contrast.

The typography should act like architecture.
The 3D characters should act like inhabitants.

---

## 2. Typography

### Direction

Use a very bold grotesk / display sans.

Properties:

- uppercase;
- heavy weight;
- compact leading;
- large scale;
- intentionally cropped by viewport edges;
- minimal number of font sizes.

The headline can occupy 40–70% of the visual field on desktop.

Suggested hierarchy:

- Display: `clamp(72px, 14vw, 220px)`
- UI / checklist: `16–22px`
- Micro labels: `11–14px`

Do not over-format the page.

### Composition

Allow the 3D scene to overlap the title.

The title can sit behind the canvas visually while remaining HTML for accessibility and crisp rendering.

The composition should feel closer to a poster than a dashboard.

---

## 3. Color

### Macro palette

Keep the environment simple.

Recommended starting palette:

- warm cream for major type;
- lavender / lilac;
- saturated pink;
- electric violet;
- pale sky blue;
- near-black for small UI details.

Use broad gradients rather than many small colored UI components.

Example moods:

#### Default
lavender → soft blue

#### Progressing
lavender → pink

#### Completed
pink → warm orange / cream glow

The gradient may slowly interpolate based on completion percentage.

Do not copy exact colors from screenshots unless intentionally approved.

---

## 4. 3D character language

### Geometry

Base everything on simple primitives:

- sphere;
- slightly squashed sphere;
- capsule;
- rounded cube as an occasional exception.

Default should still be the sphere.

Simplicity of geometry is important because the personality comes from:
- material;
- face;
- movement;
- scale;
- interaction.

### Faces

Keep facial design extremely minimal.

Possible face set:

- two dot eyes;
- sleepy eyes;
- wide eyes;
- tiny smile;
- anxious mouth;
- happy completion face.

Use a limited system so all characters feel like one family.

### Material families

Create 5–8 reusable material presets rather than a unique shader for every item.

Examples:

1. glossy plastic;
2. matte rubber;
3. pearlescent;
4. metallic;
5. striped;
6. noisy speckled;
7. soft gradient;
8. subtle spiral.

Vary:
- base color;
- secondary color;
- roughness;
- metalness;
- normal/noise strength;
- pattern scale.

The result should feel diverse without becoming visually noisy.

---

## 5. Lighting

Aim for a soft studio-rendered feel.

Suggested setup:

- soft environment / HDR-like fill;
- one broad key;
- gentle rim or directional fill;
- contact shadow or subtle shadow plane;
- tone mapping;
- restrained bloom only if useful.

The reference site uses sophisticated real-time global illumination / SSGI, but this project does **not** need to reproduce that pipeline.

Prefer:
- stable 60 FPS;
- clean PBR materials;
- good environment lighting;
over:
- expensive GI that breaks on phones.

A cheap fake color-bleed can be introduced through:
- colored fill lights;
- gradient environment;
- material tint based on neighbor/progress state.

---

## 6. Background

Do not make the environment a literal room.

Use:
- full-screen gradient;
- subtle noise/grain;
- optional floor only where shadows are needed.

The scene should feel graphic, not architectural.

A small CSS/SVG grain overlay can stop large gradients from feeling sterile.

---

## 7. UI language

UI should share the softness of the 3D scene.

Buttons:
- pill / blob shape;
- thick outline or high-contrast fill;
- slightly oversized;
- deforms 2–5% on hover;
- springs back on release.

Checklist rows:
- minimal;
- no boxed SaaS cards;
- large hit target;
- strike-through / opacity change when packed;
- small matching color dot or tiny face.

Checkboxes can be custom but must remain semantically accessible.

---

## 8. Motion language

All motion should use:
- springs;
- overshoot;
- squash and stretch;
- inertia.

Avoid:
- linear easing;
- uniform fade-ins;
- endless floating animation on every object;
- aggressive camera movement.

Recommended feel:
`quick response + soft overshoot + slow settle`.

Example spring values are implementation-dependent, but the result should feel slightly under-damped.

---

## 9. Visual hierarchy

Priority order:

1. giant title;
2. 3D pile / characters;
3. checklist content;
4. progress;
5. small controls.

Do not let tiny labels compete with the main composition.

---

## 10. Screenshot-reference workflow for Claude Code

When reference screenshots are added:

1. inspect them for **relationships**, not pixels;
2. identify dominant type scale;
3. identify gradient direction;
4. estimate object scale relative to viewport;
5. identify foreground/background overlap;
6. note average spacing and density;
7. reproduce the visual rhythm with original assets.

Do not attempt pixel-perfect cloning.
