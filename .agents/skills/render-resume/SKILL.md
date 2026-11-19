---
name: render-resume
description: Pick up the active render (or switch to another) with full context: its plan, recent history, and the state of the open Blender scene. Use only when the user invokes /render-resume.
disable-model-invocation: true
argument-hint: '[<slug> or <post>/<slug> to switch to]'
---

# /render-resume: take up a render

## Steps

1. Find the render.
    - With an argument: find the matching folder under `content/*/renders/`, write it to
      `.render-active`, and commit that ("Switch to <slug>") if it changed.
    - Without one: read `.render-active`. If it is empty, list every `plan.md` under
      `content/*/renders/` whose `status` is not `done`, and ask which to take up.
2. Read `RENDERS.md`, the render's `plan.md`, and `git log --stat -10 -- <folder>` for what
   happened recently. Note any uncommitted changes in the folder (`git status -- <folder>`).
3. Check Blender, if the Blender MCP is connected:
    - `get_scene_info`, and `bpy.data.filepath` through `execute_blender_code`. If the open
      file is not the plan's `.blend`, say so and ask the user to open it (for a new render
      with no `.blend` yet, offer to save the current scene there once they are ready).
    - One `look`, at a small `max_size`, to see where the scene stands.
      If the MCP is not connected, say so; planning and script items can still go ahead.
4. Reply briefly: the goal in a sentence, items done and pending, the next item, and any
   mismatch between the plan and the scene (an item that looks done in Blender but is not
   ticked, likely done by hand: offer to tick and log it).

Then work as `render-conventions` describes.
