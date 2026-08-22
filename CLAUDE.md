@AGENTS.md

# Claude-specific notes

Everything operational is in `AGENTS.md`, imported above — one source of truth, and readable
by any harness that follows the AGENTS.md convention.

- **Do not duplicate content here.** A second copy drifts; the `@` import is inlined
  automatically, so nothing is lost by keeping this file thin.
- **Never replace this with a symlink.** Git stores one as mode `120000`, and on a machine
  with `core.symlinks=false` it checks out as a nine-character text file — the instructions
  then silently fail to load. That happened in this estate.
