# Openworld pixel 2.5D

New bitmap asset pack (retained hooded explorer + brighter human, pine, normal maps,
48 frames per avatar), build/pivot/provenance: [asset v2 README](../assets/openworld/v2/README.md).

Study of the five later devlogs, source comparison, design constraints and recommended
implementation order: [nghien-cuu-5-video-isocore.md](nghien-cuu-5-video-isocore.md).

Reference: https://www.youtube.com/watch?v=dEMbNXdD5oI (JohnBrx).
The downloaded reference is 44 seconds, showing an isometric pixel scene, a central
warm light, then darkness and rain. It contains no available captions or code.
The initial appearance was inferred from that demo.

Lighting tutorial: https://www.youtube.com/watch?v=UavoVWHrebM —
"Creating 3D Lighting for my 2D Game" (152 seconds). Its English captions describe
painted sprite normal maps, global ambient light, a separate object-light rendering
layer, a sprite light orbiting the camera, and translucent black sprite copies
inclined 45 degrees and oriented from that light to approximate shadows in Unity 2D.
The Three.js adaptation retains that division: normal-mapped cards, isolated object
sunlight, and projected silhouette shadows. These are generated for the local pixel
art, not extracted assets or normal maps from the reference video.

World-generation reference: https://www.youtube.com/watch?v=wiMqixx-8EU&t=45s —
"Creating the world for my indie game [DEVLOG]" (232 seconds). The main section
describes abandoning floating islands, cellular automata and wave-function collapse
in favor of Perlin noise, streamed open-world chunks, separate vegetation/resource
noise and saving only seed plus player modifications. The video uses a premade chunk
pool; this code retains its existing continuous stepped Perlin terrain rather than
substituting premade tile layouts. Building/crafting/slime are brief side mentions;
this change covers the procedural world and persistence section.

- Entry: `public/openworld.html`, source `src/openworld/main.ts`.
- Terrain stays 3D with depth testing and existing collision/height queries.
- `props.ts` creates alpha-tested, lit pixel cards for trees, rocks and small props.
  Hedges use bush cards; pillars and the central monument retain 3D geometry.
- `chunks.ts` instances cards; `billboard.ts` rotates each instance about its ground
  anchor to the active camera quaternion. Zero-scaled harvested instances stay hidden.
  Rotations are cached per mesh; recompute bounds after changing matrices.
- `character.ts` uses front/side/back pixel frames and the existing movement,
  jump, ground contact and circle collision logic. Camera-facing visuals do not
  rotate its simulation root. Textures are released when changing worlds.
- Default orthographic elevation is 30 degrees for a 2:1 tile diamond. Dragging
  rotates yaw; the alternate perspective mode is retained.
- `sprite-lighting.ts` paints quantized tangent-space face vectors: rounded foliage
  and hoods, cylindrical stems, explicit stone facets. Normals use linear
  `NoColorSpace`, nearest filtering and `flipY=true` to align with canvas albedo.
  Each character frame has matching diffuse and normal textures.
- Rendering uses two passes with the same camera/depth buffer: terrain and its
  sunlight on layer 0, then normal-mapped sprites and their sunlight on layer 1.
  Hemisphere/central point light participate in both passes. Background is null
  in pass 2 to prevent Three.js's Color background from forcing a buffer clear.
  **A light's layers alone do not restrict its effect per mesh** in WebGLRenderer;
  they only filter it against the camera. Do not collapse this into one pass.
- The sprite sunlight orbits with camera yaw; L / "Xoay nắng" offsets it by 45 degrees.
  Both sprite and terrain sun share that direction, with independent intensities.
  The "Ánh sáng" button removes/restores only the normal maps for an A/B comparison,
  including when streaming new chunks or changing character frames.
- Black alpha-textured copies of each card project onto the horizontal plane at
  its ground anchor along the light direction; character shadows account for jump
  height. Shadows fade out at night. This adapts the tutorial's inclined 2D copies
  to Y-up 3D coordinates. They approximate flat ground and are not conforming decals
  across stepped cliffs. Zero-scaled harvested cards and their shadows stay hidden.
- Mobile-width HUD panels occupy opposite screen corners. Unloaded chunk geometries,
  instance buffers and owned materials are freed; cached sprite textures remain shared.
- Drawing-buffer height is at most 540 logical pixels, enlarged using CSS
  `image-rendering: pixelated`. HUD stays at native resolution.
- N or the weather button cycles day, night, rainy night. Light/fog transition
  smoothly; `weather.ts` owns seeded world-space rain streaks. The existing central
  crystal remains the warm local light source.

## Generation, streaming and saves

- `world-generation.ts`: independent seeded Perlin/fBm fields for vegetation and
  minerals, sampled at world coordinates. Global jittered candidate cells yield
  stable `kind:cellX:cellZ` IDs. Candidates resolve spacing against higher-priority
  neighboring candidates from all prop rules, including across chunk boundaries.
  Layout is independent of chunk load order and of harvested state; removed objects
  do not free space for new procedural objects. Protected plaza/paths and terrain
  height/slope constraints remain in effect. Noise regions are visible in telemetry.
- `ChunkManager.update` recomputes a 5x5 window, unloads obsolete coordinates and
  loads at most one missing chunk per frame, nearest the player's chunk first.
  Startup loads the spawn chunk immediately; telemetry shows pending chunks. The
  unit of work is still a whole chunk on the main thread, not a worker or hard time
  guarantee. Candidate and terrain caches are bounded and deterministic on eviction.
- `ChunkManager.removed` survives chunk unloads; harvested IDs are filtered from the
  regenerated layout **after** procedural spacing, removing both colliders and
  sprite/shadow instances. New seeds have their own deltas.
- `world-save.ts`: browser storage key `openworld-progress-v1`, file version 1,
  generator version 2. Worlds are indexed by `presetId|seed`; each record contains
  seed, preset, removed IDs, `[x,z]`, and save timestamp. Terrain and mesh buffers
  are never stored. Character Y is recomputed on restored ground for safe landing.
- Save immediately after harvest, every 5 seconds, before switching worlds, on
  pagehide/hidden, or with "Lưu thế giới". Reload restores the last active world;
  returning to the same seed restores that world's changes/position. Saves belong
  to the browser origin (a different localhost port has separate storage).
- Storage failures keep the in-memory session and show a save failure status/toast;
  malformed/unsupported save files are ignored instead of crashing initialization.

## Artwork and visual quality

- `pixel-art.ts` extends the code-owned sprite system with layered 34x48 pine and
  40x48 oak silhouettes, scalloped foliage, branches/roots, faceted mossy rocks,
  dedicated bushes/flowers, mushrooms, slime, and 24x34 explorer animation frames.
  Semantic palette grids feed both albedo and normal generation; do not resize one
  independently. The explorer has readable teal cloth, an amber scarf and backpack.
- These code-painted trees/explorer are now fallbacks. `sprite-assets.ts` loads the
  selected ImageGen bitmap pack from `/openworld-art/v2/` before first world build.
  Pine/oak use its tree albedo and normal. Each avatar has dedicated walk/run/axe/hit
  frames; normalized square frames use foot pivot (32,54) in 64x64 cells. Geometry
  is a 3-unit card shifted down by 10/64 of its height to ground that pivot.
- Avatar appearance is separate from game/race stats and from world progress. The
  `openworld-avatar-v2` preference keeps 'hooded' or 'human' across reloads. Switching
  preserves position, vertical velocity and grounded state; old player textures are freed.
- `terrain.ts` uses a 128x128 atlas of sixteen 32x32 grass variants. World-coordinate
  hashes select UV quarters, preserving appearance when chunks reload. Paved plaza
  faces use their own geometry and the stone/stair material, rather than grass UVs.
  The shared stone material uses vertex colors; stair box geometry must supply white
  color attributes. Terrain heights, candidate IDs and generator version are unchanged.
- The central cap is faceted stone, and a small additive halo follows the crystal.
  Rebuilding a world releases owned monument geometries, materials and its halo map.
- `sprite-lighting.ts` dithers only the small foreground-card area covering the
  explorer's screen-space silhouette. Focus uniforms are updated after the camera
  and before rendering, in drawing-buffer coordinates. Keep this in the sprite color
  pass; projected shadows remain complete. This preserves navigation readability.
- HUD settings and key help are collapsed `<details>` controls; the compact panel
  leaves the world visible. Every existing setting remains under "Tùy chỉnh thế giới".

## Action feedback and reference scene

- `actions.ts` provides a frame-rate-independent action clock; `chunks.ts` reserves
  a harvest target, animates its instance for 0.22 seconds, then hides all its parts,
  removes its collider, records the delta and emits a reward result once. Repeated
  input does not restart a pending target; unloading cancels its pending commit.
- `character.ts` has matching normal/albedo axe frames, a 0.28-second action window
  and reduced movement during a swing. Empty-ground clicks still show the swing.
- `effects.ts` owns a 512-particle limit, disposable short-lived slash meshes,
  wood/stone/slime impact fragments, actual-distance footsteps, landing rings and
  crystal sparkles. Water rings use the water surface, not the submerged ground Y.
  World rebuild resets all transient particles/slashes.
- Sprite vertex motion uses a shared time uniform with world-position phase:
  rooted foliage bends gently; slime squashes and bounces. This is cosmetic, not AI
  or combat movement, and projected shadows remain a rest-pose approximation.
- `video-grove` is a separate bright, flatter, denser reference forest preset.
  Existing preset seeds/deltas remain separate. The user can select it as
  "Rừng tham chiếu video"; it is also the default for a fresh save.
- The current `+2 WOOD` message is feedback, not an implemented inventory ledger.
  Combat HP, hostile AI, combo, dash and hit-stop are still separate future work.

Validation:

```powershell
npx tsc -p tsconfig.openworld.json --noEmit
node --test tests/openworld-billboard.test.mjs tests/openworld-lighting.test.mjs tests/openworld-generation.test.mjs tests/openworld-actions.test.mjs
npm run openworld:build
python -m http.server 4173 --bind 127.0.0.1 --directory public
```

Open `http://127.0.0.1:4173/openworld.html`. Check WASD, jump, harvest then rotate,
all three weather modes, world presets, camera toggle and window resize.
Compare normal/flat mode, rotate sunlight, and check silhouette shadow direction.

Verified 2026-11-25: TypeScript, billboard regression test and production build pass.
Browser preview at port 4174 served HTML and bundle with HTTP 200. Visually checked
day and rainy night, movement, yaw rotation, perspective mode and all three presets;
captured browser console contained no errors. Harvest retention is covered by the
matrix regression test; a complete in-browser harvest session was not exercised.

Second-reference verification: TypeScript, all four billboard/normal/shadow tests
and the production build pass. Browser checked normal-map on/off, sunlight rotation,
night and rainy night; captured console error list was empty. The object-light pass
preserved terrain/depth and the HUD remained readable in the narrow preview.

Third-reference verification: TypeScript, all 10 generation/save/billboard/lighting
tests and production build pass. Browser showed incremental startup loading followed
by 25 active chunks. Moved to `(4.7, 4.8)`, saved, and reloaded to the same coordinates.
Harvested a nearby tree (`+2 WOOD`), reloaded and visually confirmed it stayed absent.
Switched to highland and back; meadow seed 2026 restored its own position/progress.
Captured browser console error list was empty. Storage failure/invalid JSON and
generation across negative-coordinate chunk boundaries are covered by automated tests.

Visual-quality pass: browser checked the new layered trees, grass atlas, paved paths,
explorer foreground dither and crystal halo in day/night/rain. The existing seed 2026
save restored correctly. Captured console error list was empty; preview telemetry
was approximately 50–60 FPS on the tested narrow viewport, not a general benchmark.

Action pass: TypeScript/build and 13 tests (including `tests/openworld-actions.test.mjs`)
passed. Browser selected `video-grove`, moved the explorer, harvested a close tree,
and showed pixel fragments plus `+2 WOOD`; captured console errors were empty before
the interaction. Clock tests cover repeated clicks, multiple frame rates and unload
cancellation. No claim is made that the prototype now has a complete combat system.
