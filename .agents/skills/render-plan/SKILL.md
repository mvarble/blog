---
name: render-plan
description: Draft the plan for a new Blender-made asset behind a three.js component, and make it the active render. Use only when the user invokes /render-plan.
disable-model-invocation: true
argument-hint: '<post>/<slug> <what the component should do, or how to build it in Blender>'
---

# /render-plan: plan a render

Turn the user's request into `content/<post>/renders/<slug>/plan.md`, following `RENDERS.md`
at the root of the repository. Nothing in Blender is touched here; this is the plan only.

## Steps

1. Read `RENDERS.md`. Then read the post: its `index.svx`, the pages near where the component
   will sit, its existing `components/` and `util/`, and any finished render folders under
   `content/*/renders/` (their plans are the best examples of the level of detail wanted).
2. If the user gave no `<post>/<slug>`, propose one and confirm it. If the folder already
   exists, stop and suggest `/render-resume <slug>` instead.
3. Read the request for which kind it is:
    - **A recipe** (how to build it in Blender): keep its steps and their order as the items,
      splitting any that would not end in a state worth committing, and fill in what it leaves
      implicit (names, export, preprocessing).
    - **A spec** (what the component should do): design the approach yourself: how to model
      it in Blender, what the runtime contract should be, whether a sidecar is worth it. Put
      the questions you could not settle as the first item, so they are answered before work
      starts.
4. Write the plan from the template in `RENDERS.md`, with `status: planning`:
    - **Goal** in terms of what the reader sees and the intuition built.
    - **Runtime contract** concrete enough that the component could be written against it
      before the asset exists: names, attributes, materials, sidecar shape.
    - **Items** each with a "Done when". Include the export, any `preprocess.mjs` or
      `verify.mjs`, and, if the component is in scope, the component work as later items.
    - **Log** with one dated line saying where the plan came from.
5. Write the folder's path to `.render-active`.
6. Commit `plan.md` and `.render-active` ("Plan <slug>"). If on `main`, commit there unless
   the user has said to branch.
7. Reply with a short summary of the approach and the item list, and invite edits. Each edit
   round is committed as "Revise <slug> plan: ...".
