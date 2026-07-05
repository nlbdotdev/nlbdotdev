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
- **NPCs** — seven named townsfolk who wander their patches (or keep shop)
  and talk through a dialogue box with numbered choices (`E` to talk, `1-9`
  to choose, `Q` to leave), and a Viper Gang camp east of town: five
  hostiles who aggro, chase, and shoot back. Kill them for caps. Shoot a
  civilian and the town remembers.
- **Quests** — three of them, with a quest log (`J`) and an on-screen
  objective tracker: clear the Viper camp for Sheriff Vance's bounty, run
  Doc Whitley's medicine over to Widow Calloway, and recover Prospector
  Jeb's lucky pickaxe from a cairn out west.
- **Interiors** — the saloon, general store, and clinic are enterable
  New Vegas-style cells (walk to the door, press `E`): lantern-lit rooms
  with a bar, shelves, piano, patient bed, and the rest.
- **Merchants** — Barkeep Sal pours drinks, Trader Rosa sells ammo and a
  max-HP hat, Doc Whitley patches you up and sells stimpaks (`H` to use
  one from your inventory). All trading happens in a keyboard-driven
  shop panel.
- **The HUD** — Pip-Boy-amber panels for HP, ammo, caps, and stimpaks, a
  scrolling compass, damage vignette, death/respawn, and slow health regen.

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
| `E` | Talk / trade / enter buildings / mount & dismount |
| `1-9` | Pick dialogue option / buy shop item |
| `Q` | Leave dialogue or shop |
| `J` | Quest log |
| `H` | Use a stimpak |
| `ESC` | Release mouse |

## Tech notes

- Three.js r160, vendored in `lib/` so the game runs fully offline.
- One module (`main.js`): terrain, town builder, particle/tracer pools,
  NPC AI (wander / flee / chase-and-shoot), horse riding, weapon view
  models, and a pointer-locked FPS controller with AABB collision.
- Interior "cells" are boxed rooms built 30 units below the terrain and
  entered by door teleport with a fade — the same trick New Vegas load
  doors pull, minus the loading screen. Ground height and collision are
  elevation-aware so the surface world and interiors never interfere.
- Quests are tiny state machines wired into the dialogue trees; dialogue
  nodes carry numbered options whose actions advance stages, grant caps,
  or open a merchant's shop.
- Sounds are synthesized with the Web Audio API (noise bursts and
  oscillator blips) — no audio files.
