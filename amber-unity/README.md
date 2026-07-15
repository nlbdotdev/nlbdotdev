# Amber — Unity 6 (URP) scaffold

Slice 0 of the move off the Three.js prototype. This is a **gunfeel sandbox**: a
gray-box range you can drop into and start tuning weapons, recoil, hit reactions,
and AI — the things the browser prototype couldn't sell. Art, netcode, and the
town come later; this exists to prove the shooting feels better than the toy did.

The prototype lives at `../dusty-gulch/` (still playable in a browser). Its tuning
(weapon stats, recoil, XP curve, dismemberment rules) is ported here 1:1 so this
starts where that left off.

## Requirements

- **Unity 6000.0.32f1** (Unity 6 LTS line). Any `6000.0.x` opens it; Unity Hub
  will offer to upgrade the patch version, which is fine.
- URP, Input System, Cinemachine, and TMP are declared in
  `Packages/manifest.json` and resolve automatically on first open.

## Open and run (about two minutes)

1. **Unity Hub → Add → Add project from disk →** pick this `amber-unity/` folder.
2. Open it. First import takes a few minutes while packages resolve and Unity
   generates its `Library/` and `.meta` files.
3. If prompted about **input backends**, choose the option that enables the new
   Input System (or "Both"). The project already ships `activeInputHandler: 2`
   ("Both"), so you normally won't be asked.
4. Menu bar → **Amber → Create Sandbox Scene**. This writes
   `Assets/Amber/Scenes/Sandbox.unity` and adds it to Build Settings.
5. Press **Play**.

That's it — a single `SandboxBootstrap` object builds the entire playable range
at runtime (ground, cover, target dummies, three hostiles, the wired player rig,
lighting, and a HUD). Nothing else to author.

### Controls

| Input | Action |
|-------|--------|
| WASD | Move |
| Shift | Sprint |
| Mouse | Look |
| LMB | Fire |
| R | Reload |
| 1 / 2 / 3 | Revolver / Repeater / Shotgun |
| Mouse wheel | Cycle weapons |
| Space | Jump |
| Esc | Free/lock cursor |

All three weapons are unlocked in the sandbox so you can compare their feel. In
the real game the shotgun stays locked (`OwnedAtStart = false`) until you buy it —
the bootstrap just calls `weapon.Acquire(2)` to open it up for the range.

## For the crisp look (optional but recommended)

The sandbox renders fine under the built-in pipeline (the bootstrap picks a
matching shader automatically), but URP is the whole reason for the move. To turn
it on:

1. **Assets → Create → Rendering → URP Asset (with Universal Renderer).**
2. **Project Settings → Graphics →** set *Default Render Pipeline* to that asset.
3. **Project Settings → Quality →** assign it to your quality levels too.
4. Add a **Global Volume** (GameObject → Volume → Global Volume) and enable
   Bloom, Tonemapping (ACES), and a warm color grade for the amber dusk.

## Project layout

```
amber-unity/
├─ Packages/manifest.json        URP · Input System · Cinemachine · TMP
├─ ProjectSettings/              activeInputHandler = Both, color space Linear
└─ Assets/Amber/
   ├─ Scripts/
   │  ├─ Combat/   HitInfo · IDamageable · Health · BodyPart (dismemberment)
   │  ├─ Weapons/  WeaponData (tuning) · WeaponController (fire/recoil/reload)
   │  ├─ Player/   PlayerMotor · PlayerLook (recoil punch) · PlayerRig (input)
   │  ├─ NPC/      NpcBrain (wander/chase/shoot/flee)
   │  ├─ Progression/ ExperienceLedger (XP + levels)
   │  └─ World/    SandboxBootstrap (builds the range) · SandboxHud
   └─ Editor/      CreateSandboxScene (the Amber ▸ menu command)
```

## What's ported from the prototype

| System | Prototype behaviour | Here |
|--------|--------------------|------|
| Loadout | Revolver 12dmg/6mag, Repeater 20/7, Shotgun 8×6 pellets/2 | `WeaponData.DefaultLoadout()` |
| Spread | radians per weapon | converted to degrees, same feel |
| Recoil | CSS gun-nudge | camera view-punch + viewmodel kick |
| Headshots | 2× damage | `BodyPart.DamageMultiplier` |
| Dismemberment | `overkill*0.035 + force*0.45` gib chance | `Health.Die()`, verbatim |
| XP / levels | level×100 to next, +10 max HP per level | `ExperienceLedger` |
| Kill rewards | bandit +30, coyote +15, quest +60 | `NpcBrain.xpReward` |
| NPC AI | wander → chase → shoot → flee | `NpcBrain` |

## What's deliberately not here yet

- **Real art / animation** — dummies are primitives; the point is feel, not looks.
- **The town, quests, dialogue, merchants** — design is captured in
  `../dusty-gulch/DESIGN.md`; port after gunfeel locks.
- **Netcode** — the MMO-lite topology (instanced towns + PvP corridors) is a later
  slice; FishNet is the current plan.
- **A ScriptableObject weapon database** — `WeaponData` is a serializable class for
  now so the sandbox runs with zero asset wiring. Promote to SOs when weapons need
  to be shared/authored across characters.

## Note on the cloud session

This scaffold was authored in a headless cloud environment, which can't run the
Unity Editor (licensed GUI app, no display). So these files have **not** been
compiled or opened in Unity — they're written against the Unity 6 / URP 17 API and
the prototype's verified tuning. First open will generate `Library/` and `.meta`
files locally. If anything doesn't compile on your machine, it'll be an API/version
nit, not a design gap — send me the console error and I'll fix it.
