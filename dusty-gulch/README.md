# Dusty Gulch

A lightweight, Fallout: New Vegas-flavored 3D prototype built with Three.js.
No build step, no external assets — every model, texture, and sound effect is
generated procedurally at runtime.

![genre](https://img.shields.io/badge/genre-open--world%20western-orange)

## Run it

Any static file server works (ES modules need `http://`, not `file://`):

```bash
cd dusty-gulch
python3 -m http.server 8080
# or: npx serve .
```

Then open http://localhost:8080 and click to lock the mouse.

## What's in the box

- **A small western town** — saloon, sheriff's office, general store, doc,
  bank, hotel, livery stable, and church, each with false-front facades,
  porches, and painted signs, plus a water tower, hitching rails, and street
  clutter. Desert terrain with dunes, rocks, cacti, and distant mesas.
- **Guns** — a .357 revolver and a cowboy repeater (keys `1`/`2`), with
  raycast hitscan, spread, recoil, muzzle flash, tracers, reloading (`R`),
  ammo reserves, and hitmarkers.
- **Horses** — three of them, hitched around town. Walk up, press `E` to
  mount, `SHIFT` to gallop, `E` again to dismount. Legs animate, heads dip
  to graze while idle.
- **NPCs** — six named townsfolk who wander their patches and offer
  wasteland gossip through a dialogue box (`E` to talk, `Q` to leave), and a
  Viper Gang camp east of town: five hostiles who aggro, chase, and shoot
  back. Kill them for caps. Shoot a civilian and the town remembers.
- **The HUD** — Pip-Boy-amber panels for HP, ammo, and caps, a scrolling
  compass, damage vignette, death/respawn, and slow health regen.

## Controls

| Input | Action |
| --- | --- |
| `W A S D` | Move |
| Mouse | Look |
| `LMB` | Shoot |
| `R` | Reload |
| `1` / `2` | Revolver / repeater |
| `SHIFT` | Sprint / gallop |
| `SPACE` | Jump |
| `E` | Talk / mount / dismount / advance dialogue |
| `Q` | Leave dialogue |
| `ESC` | Release mouse |

## Tech notes

- Three.js r160, vendored in `lib/` so the game runs fully offline.
- One module (`main.js`): terrain, town builder, particle/tracer pools,
  NPC AI (wander / flee / chase-and-shoot), horse riding, weapon view
  models, and a pointer-locked FPS controller with AABB collision.
- Sounds are synthesized with the Web Audio API (noise bursts and
  oscillator blips) — no audio files.
