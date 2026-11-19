---
name: render-conventions
description: How to work on a render in this blog: Blender MCP work, GLB exports, preprocessing scripts, and keeping the render's plan.md and commits up to date. Use whenever working in Blender through the MCP, exporting or preprocessing a GLB, or editing a plan under content/*/renders/ in this repository.
---

# Working on a render

The conventions are in `RENDERS.md` at the root of the repository; read it if it is not
already in context. The active render is the folder named in `.render-active`, and its
`plan.md` is the brief.

## While working an item

- Work one item at a time, the one the user has chosen. The user may do parts by hand; ask
  rather than redo what they did, and log it.
- Keep to the plan's runtime contract. If the work shows the contract should change, change
  the plan first and say so.
- After a visual change, `look` before reporting it. Aesthetics are the user's call: show,
  then ask whether it is right, rather than declaring it done.
- Keep scripts sent to Blender small and idempotent where possible, so a step can be rerun.

## Finishing an item

When the user agrees an item is done:

1. Save the `.blend` (`bpy.ops.wm.save_mainfile()`), and export the GLB if the item changed
   anything exported.
2. Run `preprocess.mjs` and `verify.mjs` if the plan has them; report failures, don't commit
   over them.
3. Tick the item, add a dated log line (decisions, deviations, what was done by hand), and
   set `status: active` if it was `planning`.
4. Commit the render folder together ("<slug>: <item, briefly>").

## Changing the plan

Edit `plan.md` whenever the plan stops matching the work: items added, split, reordered or
dropped. Commit it alone ("Revise <slug> plan: ..."), with the reason in the log.

When the last item is ticked, set `status: done`, empty `.render-active` unless another
render is under way, and commit.
