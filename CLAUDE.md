# CLAUDE.md

This repository holds short vertical videos (Instagram Reels, 1080x1920) that Claude builds in code for the owner
(عبد الغني الحمدي · abdalgani.com). The user writes in Syrian Arabic; answer in Syrian Arabic.

**Before any video / reel / motion / logo-animation / awareness-video request, load the project skill
`reels-video` (`.claude/skills/reels-video/SKILL.md`) and follow it.** It records the user's taste and every
mistake already made, so the first result is the right one. The key rules:

- Deliver a finished video, not a production kit. Decide creatively; don't stall on questions.
- Default: no voiceover: on-screen Arabic text + an original synthesized music bed + synced SFX.
  When a voiceover is wanted, load the skill `george-voice` (`.claude/skills/george-voice/SKILL.md`): it is the approved setup
  (George via vibi.pro, eleven_v4, simple MSA with full tashkeel, English terms in Latin letters). The key `VIBI_API_KEY` never goes in a file.
- Strong, detailed motion, but every element lands in a fixed position; the frame never shifts.
- Review the rendered mp4 with `.claude/skills/reels-video/scripts/review.py` before delivering.

Reference projects (copy from these, don't start from zero):

- `techno-injaz-intro/`: cinematic WebGL logo intro (shaders, HDR post, 3D Earth, hologram build, launch).
- `sham-cash-awareness/video/`: animated awareness slides on a fixed grid with music and a designer-credit footer.

Commit and push every deliverable; `node_modules` (a symlink to the global playwright) and `build/` stay untracked.
