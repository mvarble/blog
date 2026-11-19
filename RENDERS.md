# Renders

How the 3D assets behind the posts' three.js components are made: modelled in Blender,
exported as GLB, optionally preprocessed into a sidecar, and loaded by a component. Each
asset is planned in a `plan.md` that is worked through item by item and committed as it goes.

## Layout

Every render has a folder of its own beside the post it belongs to:

```
content/<post>/renders/<slug>/
  plan.md            the plan: goal, runtime contract, items, log
  <slug>.blend       source of truth for the geometry
  <slug>.glb         the export, imported by the component with `?url`
  preprocess.mjs     optional: reads the GLB, writes the sidecar
  <slug>.sidecar.*   optional: precomputed tables, committed beside the GLB
  verify.mjs         optional: checks the GLB honours the runtime contract
```

Assets shared between renders or with the page (a grid texture, say) stay in the post's
`static/` folder and are referenced by relative path.

The CMS only reads `.svx` and `.bib` files, so nothing in a render folder becomes a page.

## The active render

`.render-active`, at the root of the repository, holds one line: the folder of the render
being worked on (e.g. `content/diffgeo/renders/manifold-charts`), or nothing. It is
committed, so whoever picks the work up next, on whatever machine, starts from the same
place. Change it when switching renders, and empty it when a render is finished and
nothing else is under way.

## plan.md

```markdown
---
post: <post>
component: content/<post>/components/<name>.svelte
blend: <slug>.blend
export: <slug>.glb
status: planning # planning | active | done
---

# <Title>

## Goal

What the reader sees and does, and the intuition it is meant to build.

## Runtime contract

What the component relies on in the GLB: object names (they become glTF node names),
which meshes must be indexed or carry UVs, materials and textures, transforms, and the
shape of the sidecar if there is one. Anything not listed here is free to change.

## Items

1. [ ] <A step in Blender, a script, or a piece of the component.>
       Done when: <what we look at to agree it is finished.>
2. [ ] ...

## Log

- YYYY-MM-DD: <decisions, aesthetic calls, deviations from the plan, what was done by hand.>
```

Items are numbered and each ends in a state worth committing. They may be done in Blender by
hand, through a script, or back and forth until the result looks right; the log says which
when it matters. The plan is a working document: items are added, split, reordered or
dropped as the work teaches us, and the log records why.

`status` is `planning` until work in Blender starts, `active` while it goes on, and `done`
when the component ships with the asset.

## Commits

- Revising the plan: commit `plan.md` alone ("Revise <slug> plan: ...").
- Finishing an item: save the `.blend`, re-export the GLB, rerun `preprocess.mjs` and
  `verify.mjs` if the plan has them, tick the item, add a log line, and commit the folder
  together, so the `.blend`, GLB, sidecar and plan in any commit agree with one another.

Blender's `*.blend1` backups are ignored.

## Blender and glTF

- **Names are the contract.** Name objects as the plan's runtime contract says; the
  component finds them by name.
- **Export** as GLB with `bpy.ops.export_scene.gltf`: modifiers applied, UVs and normals
  included, only the objects the contract names (select them and export the selection, or
  hide the rest). No Draco compression unless the component configures a decoder.
- **Units and transforms**: the component frames the camera from bounds, so absolute scale
  matters less than consistency; say in the contract if a transform must be applied.
- **Textures** the component swaps or shares are better loaded by the component than
  embedded; say which in the contract.

## Preprocessing

When the component needs tables that are expensive to compute at load (spatial indices,
lookup grids, precomputed curves), a `preprocess.mjs` beside the GLB reads it and writes
`<slug>.sidecar.json` (or `.bin` for large numeric data). It runs by hand with
`node content/<post>/renders/<slug>/preprocess.mjs` after each export, and its output is
committed; the site build treats the sidecar as an ordinary asset. The GLB-parsing in
`content/diffgeo/renders/manifold-charts/verify.mjs` is a pattern to copy: it builds three.js meshes from the GLB
without a GPU, so the component's own code can be reused at build time.

A `verify.mjs` does the same parsing to check the contract (names present, UVs present,
round trips exact) and is worth running after every export.
