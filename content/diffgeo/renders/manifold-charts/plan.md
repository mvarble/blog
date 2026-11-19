---
post: diffgeo
component: content/diffgeo/components/manifold-charts.svelte
blend: manifold-charts.blend
export: manifold-charts.glb
status: done
---

# Manifold and charts

Written after the fact: this asset was made by hand before the render workflow existed, and
this plan records how, as a worked example for later renders.

## Goal

Build physical intuition for charts on a 2-manifold. The component has two canvases:

- **3-space**: an orbitable view of a 2-manifold with one chart's domain drawn over it. As
  the mouse moves over the surface, the displayed chart switches to one whose domain contains
  the hovered point, and a marker follows the mouse.
- **2-space**: the image of that chart in the plane, with the hovered point's chart image
  marked. Moving the mouse inside the image moves the 3-space marker, showing the inverse
  chart as a parameterization of part of the manifold.

The manifold has holes, so it is visibly not something the plane could hold whole, and the
charts are deliberately distorted so each shows the stretching a chart may introduce.

## Runtime contract

Consumed by `content/diffgeo/util/glb-manifold.ts` (`loadAtlas`):

- A mesh named `manifold`, material `manifold-blue`. It needs no UVs.
- Meshes named `chart.NN` (`chart.01` to `chart.10`), sorted by name for display order.
  Each one:
    - is **indexed** and carries **UVs** (`TEXCOORD_0`); the UVs _are_ the chart map into the
      plane, and should lie roughly within the unit square, which the 2-space view frames;
    - is a single patch with no vertices split within it, so its boundary edges trace the
      outline of its domain;
    - sits slightly outside the manifold (displaced along normals) so it is never occluded by it.
- Chart material `chart-texture`, whose base-color texture is the shared grid, so every
  chart shows the same coordinate grid of the plane.
- Charts overlap generously: together they cover the manifold.

No sidecar: the flat domain meshes and boundary edges are built at load time by `buildChart`.

## Items

1. [x] Combine metaballs into a globular shape with holes.
       Done when: the shape reads as a genus > 0 surface, clearly not embeddable in the plane.
2. [x] Convert to a mesh and sculpt it to taste; name it `manifold`.
3. [x] Duplicate the mesh and inflate the copy slightly with a modifier, so charts cut from
       it float above the manifold.
4. [x] Separate the inflated copy into ten overlapping patches, `chart.01` to `chart.10`.
       Done when: every part of the manifold is covered by some chart.
5. [x] Unwrap each chart and translate, scale and distort its UVs within the unit square,
       so that charts land in different parts of the plane with visibly different distortions.
6. [x] Give the charts a shared grid-textured material (`chart-texture`) and the manifold
       its own (`manifold-blue`).
7. [x] Export `manifold-charts.glb` with the manifold and the ten charts.
8. [x] `verify.mjs`: round-trip chart coordinates against the asset.
       Done when: nearly every round trip is exact to 1e-6. `chart.09` folds over itself
       across about 2% of its domain; the component handles this with a continuity hint.
9. [x] Component `manifold-charts.svelte` and runtime `util/glb-manifold.ts`.

## Log

- 2026-11-19: Moved into the render workflow. `static/manifold.{blend,glb}` became
  `renders/manifold-charts/manifold-charts.{blend,glb}`, and `scripts/chart-roundtrip.mjs`
  became `verify.mjs`. The `.blend1` backup was dropped from git. The `chart-texture` image
  is not linked to `static/grid.png` by a relative path, so the move did not break it.
