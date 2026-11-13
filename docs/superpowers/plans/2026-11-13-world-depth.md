# World Depth Implementation Plan

**Goal:** Improve the illustrated world's spatial depth and scroll continuity without changing content.
**Architecture:** Preserve the existing scene components; share a continuous ground-height function across terrain and markings, reuse camera interpolation for zoom, and refine existing sky objects.
**Spec:** docs/superpowers/specs/2026-11-13-world-depth.md

- [x] Add regression tests for ground continuity and camera zoom velocity; observe failures.
- [x] Blend the flat plain into the sphere over radius 420–600 and generate matching terrain skirt.
- [x] Strengthen mountain relief and light/shadow separation; add modest boulder clusters and reduce surface visual noise.
- [x] Use slope-limited interpolation for camera FOV, preserving keyframes.
- [x] Improve existing distant planet and orbiting moon visibility, cap idle animation deltas.
- [x] Run tests, lint changed files and build; inspect opening, descent and drone views; get independent code review.

Constraints: no copy changes, no new dependencies, preserve current checkout and other edits. No commit or deployment requested.


## Validation and review

55 tests pass, changed-file ESLint passes, production build passes (existing large-chunk warning remains). Browser inspection covered opening, overhead descent, drone view and landing. Independent review confirmed the ground/FOV fixes and reduced-motion arrival cancellation. Surface markings use adaptive radial subdivisions near the apron; numerical raycasting found zero buried triangle centroids there. Content was not changed.

Ruling: existing uncommitted sky work already included two moons and one distant planet. Refine their scale/placement instead of duplicating them. Keep changes uncommitted in the current checkout.

Potential next pass: camera-relative composition at portrait widths; stronger narrative connection between descent stages; measured idle-render performance. These were not part of this pass.
