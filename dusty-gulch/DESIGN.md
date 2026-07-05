# DUSTY GULCH — Design Document

*Working title. A 4-player co-op, open-world western RPG about laying the last
railroad at the end of the world.*

---

## 1. The core question

We want FNV's soul: a fascinating world, factions with defensible
philosophies, grit, and choices that visibly rearrange the map. And we want
4-player co-op. The candidate "gimmicks" were base building, railroad
construction, or nothing at all.

**Recommendation: the railroad — but not as a gimmick.** As the world's
central conflict.

Here's the reasoning:

- **"No gimmick, just really good" is a trap at our scale.** FNV's goodness is
  a million words of reactive writing and a decade of Black Isle institutional
  knowledge. A small team competing on pure content volume loses. We need a
  *systemic spine* that generates stories and stakes cheaply. That's what a
  gimmick is when it's load-bearing.
- **Base building is the wrong gimmick for co-op RPG.** It's everywhere
  (Fallout 4, Valheim, Conan), it pulls the party apart into menus, and it
  anchors players to one spot while the authored content is elsewhere. It
  competes with the RPG instead of feeding it.
- **The railroad feeds everything.** It's collective (everyone swings a
  hammer), directional (it paces the campaign like a quest line), visible
  (the world transforms behind you), and thematically loaded — railroads are
  civilization, capital, displacement, and who-owns-the-future, which is
  exactly FNV's question wearing a different hat.

FNV's structure is: *one prize (the Dam), four claimants, and you're the
tiebreaker.* Ours is: **one railroad, four claimants — and the players hold
the charter.**

### The synthesis: your base is a train

Base building doesn't get cut; it gets bolted onto the rail. The crew owns a
**work train** — engine, tender, and cars you acquire, upgrade, and rearrange:

- **Armory car** — weapon storage, workbench, ammo press
- **Sawbones car** — medical station, faster revives when camped
- **Quarters** — respawn point, trophies from finished quests on the walls
- **Galley, brig, stable car, parlor car** — utility, prisoners, horses, NPCs

The train is the mobile base, the fast-travel system (along built track only),
the co-op hub, and the biggest set-piece generator we have (see §5). Players
get the ownership/decoration itch scratched without ever leaving the story's
spine. The train can only go where you've laid track — **progress is
literally infrastructure.**

---

## 2. The universe: The Long Dusk

We keep our own universe — homage to FNV's tone, zero Fallout IP.

### The collapse

Eighty years ago the old world ran on **emberglass** — a vitreous seam of
something deep in the earth, mined from a single monstrous deposit out west
called **the Vein**. It lit cities, drove engines, made the desert bloom.
Then it *soured*. Nobody agrees on why — overdrawn, provoked, or simply
finished with us. The sky burned for nine days.

It never fully recovered. The sun has hung low and amber ever since — not
setting, not rising, a permanent smoldering golden hour the survivors call
**the Long Dusk**. (This is retroactive lore for the fixed late-afternoon
lighting the prototype already has: *the sun hasn't finished setting in
eighty years.*) Nights still come, but wrong — short, starless in the west,
and things move in them.

The federal government's last act was the **Quarantine**: an army drew a
cordon around the Vein country and burned every bridge, rail, and road into
it. Then the government stopped writing back, and the army just... stayed.

### The present

Two generations on, the frontier is re-civilizing in patches. Free towns,
company towns, nomad circuits, ghost towns. What's missing is *connection* —
everything moves by brahmin cart and stagecoach at banditry speed. Whoever
rebuilds the railroad stitches the region together and owns its future.

And every line on every survey map, if you extend it far enough west, points
at the same place: the Vein. Cheap power, or a second Dusk. The rail isn't
just commerce — it's the fuse to the world's biggest unanswered question.

**Theme in one line:** *Civilization is coming back. Who lays the track, and
who gets left off the map?*

### The players' hook

FNV opens with a personal injury (two in the head) that unspools into the
faction war. Ours: the four players are a **track gang left for dead** — a
tunnel collapse that was no accident, on a line that officially never
existed. They crawl out owning three things: their lives, a dead foreman's
satchel, and inside it the **Charter** — a pre-Dusk railroad concession,
legally sound, signed and sealed, granting its bearer right-of-way through
the whole territory. The last legal instrument of a dead government, and
every faction in the region would kill for it, buy it, or marry it.

The crew starts as nobody. The Charter makes them *the* somebody. That's the
FNV courier structure: a MacGuffin that makes four drifters the tiebreaker of
the region — except the MacGuffin is a deed, and the deed is playable.

---

## 3. Factions

The FNV quadrant, re-derived from our theme (each faction is a coherent
answer to "what should the railroad be for?"), each defensible, each with
blood on its hands:

### The Consolidated Line ("the Company")
*NCR-money crossed with House's vision.* The remnant of the old rail trust,
run from a marble terminal in the east by the **Directorate**. They genuinely
rebuild — Company towns have medicine, schools, law. Company law. Wages in
scrip, debts that outlive the debtor, and a private army of **Regulators**.
Their answer: *the railroad is for commerce; civilization follows the
dividend.* They'll honor the players' Charter — as a controlling partnership.
**Grit:** debt bondage dressed as opportunity; safety you can't afford to
leave.

### The Free Towns Compact
*The NCR slot: sympathetic, democratic, maddening.* Dusty Gulch and a dozen
towns like it, loosely federated by mail, militia, and grudges. They want the
rail desperately — on public terms, tariff-free, no Company scrip. But every
junction vote takes three town meetings, two feuds, and a hanging.
Their answer: *the railroad is for the people who live along it.*
**Grit:** democracy of scarcity — noble charters, corrupt sheriffs, and towns
that will bribe you to bypass their rivals.

### The Cinder Watch
*The Legion slot, but with a point.* Descendants of the Quarantine army,
still holding a cordon nobody ordered them to hold, under commander
**Colonel Verity Slate**. Ash-grey uniforms, iron discipline, and one
doctrine: *the Vein stays sealed.* They tax, conscript, and burn — bridges,
depots, whole towns that dig too deep or build too far west. They are
brutal, and they might be **right**. Every mile of track you lay west, the
Watch reads as a fuse being cut shorter.
Their answer: *the railroad is a weapon pointed at the Vein; break it.*
**Grit:** the villains have the strongest evidence; their atrocities are
prevention, by their lights.

### The Sundown Nations
*No FNV analog — our own.* The nomad circuits who survived the Dusk by
moving: herders, salvage caravans, dowsers who read the desert like
scripture. The rail cuts their migration lines and waters. They are not a
monolith — the **Ledger Riders** want negotiated crossings and tolls, the
**Cut-line** faction dynamites surveys, and both have the region's best
intelligence about what the Vein country actually looks like now (they're
the only people who've been inside the cordon and come back).
Their answer: *the railroad is a scar; if it must exist, it routes around
what's ours, or it pays in blood or treaty.*
**Grit:** displacement in real time — every junction the players choose is
someone's pasture.

### The Surveyor (wildcard — the Yes Man slot)
Deep in a bypassed roundhouse sits **the Surveyor**: an old-world automaton
that drew the original charter maps, still ticking, still holding the only
complete survey of the Vein country, cheerfully loyal to *whoever holds the
Charter*. The independence route: tell every faction to pound sand and run
the line yourselves. The Surveyor never argues. That should worry you.

### Faction mechanics

- **Reputation per faction and per town** (idolized ↔ vilified), shared by
  the crew (see §4 for individual nuance).
- Each faction runs a **campaign arc** trying to capture/befriend/destroy
  the railroad, converging on the endgame: **the Golden Spike** — where the
  last junction points, and under whose flag the first through-train runs.
- Ending slideshow, FNV-style: every town, faction, and named NPC gets an
  epilogue card driven by your junction choices and quest outcomes.

---

## 4. Four-player co-op design

### Principles

1. **The crew is one character in the world's eyes** — one Charter, one
   shared faction reputation, one wallet for rail materials (personal
   pocket money stays personal). No "my karma vs yours" bookkeeping.
2. **The players are four characters in each other's eyes** — backgrounds,
   builds, and table talk are where individuality lives.
3. **Never gate the party on one player's menu.** Dialogue, shops, and
   building happen in-world and don't pause anything.

### Backgrounds (roles)

Pick at character creation; grants a skill spread, a unique dialogue
interject, and a rail-work bonus:

| Background | Combat identity | Dialogue interject | Rail bonus |
| --- | --- | --- | --- |
| **Gunhand** | duelist, revolvers/lever guns | intimidate | faster escort events |
| **Tinker** | traps, turret, demolitions | machine-savvy | cheaper/faster track, bridge builds |
| **Sawbones** | medic, chems, debuffs | empathy/medicine reads | crew heals at camp, cheaper revives |
| **Silver Tongue** | support, buffs, luck | barter/deceive | better material prices, treaty options |

### Dialogue in co-op (the hard problem)

- Whoever initiates a conversation is **the Voice** for that conversation;
  the other three see everything live.
- Non-speaking players get contextual **interjects** — a single button that
  offers their background's line when the tree flags it ("[TINKER] That
  boiler gauge is lying to you"). The Voice chooses whether to yield.
  This creates table talk instead of spectating.
- Skill checks read the *crew's best* relevant skill — bring your Silver
  Tongue to the treaty table, physically. Party composition in the room
  matters.

### Junction votes (the signature co-op moment)

Route choices — which town gets the line, which gets bypassed — are decided
at **spike ceremonies**: the crew stands at the junction marker and votes by
physically driving a spike on their preferred heading. Majority wins; ties
are broken by whoever holds the Charter satchel that session (a hot-potato
honor the crew can reassign). The minority's grudge is remembered by NPCs
("heard you voted against us, and your friends outvoted you" — cheap lines,
huge table drama).

### Moment-to-moment

- **Downed → bleed-out → revive** (Sawbones faster). Full wipe = wake up in
  the quarters car, robbed of a material shipment (sting, not erase).
- **Drop-in/drop-out**: joining player is "a new hand the crew hired";
  absent players' characters ride the train as NPCs.
- **Horses for four** — the stable car carries them; mounted party travel
  off-rail, handcar sprints on-rail.
- Enemy count and HP scale with connected players; bandit ambushes escalate
  to **train raids** at 3-4 players.

### Netcode (prototype reality)

- **Phase 1:** WebSocket relay (tiny Node server), host-authoritative, 12 Hz
  snapshots + event messages (shots, hits, dialogue locks, votes).
  Interpolate remotes. Good enough for co-op PvE at prototype scale, avoids
  WebRTC NAT pain.
- **Phase 2 (if it graduates):** WebRTC data channels via the same server
  for signaling; host migration on disconnect.
- NPC AI runs host-side only; clients render + predict their own movement.
- Determinism is *not* required — authoritative events, not lockstep.

---

## 5. The railroad as a game system

### The loop

1. **Survey** — ride ahead (horses — they finally have a job), plant markers,
   scout hazards. Sundown scouts or Surveyor data reveal better routes.
2. **Clear** — the authored-content hook: every obstacle is a quest. A
   collapsed cut full of something nesting. A rancher who won't sell
   right-of-way (talk/buy/intimidate/frame). A Watch demolition team.
3. **Grade & lay** — the co-op minigame: ties, rails, spikes. Short,
   physical, satisfying, faster with more hands — this is the "campfire"
   activity where the crew talks. Materials come from quests, trade, and
   salvage — **never from grinding rocks**.
4. **Run the train** — supply runs and escorts on finished track. One drives,
   the rest defend. Raiders board. It's a rolling set piece.
5. **Junction** — vote, spike ceremony, watch the map change.

### The world reacts (grit made visible)

- **Connected towns grow**: new buildings appear, merchants stock better
  goods, quests unlock, prices drop. Dusty Gulch gets a second street.
- **Bypassed towns decay**: shops close, NPCs leave or turn desperate,
  eventually a ghost town or a raider nest — which is *new content*, not
  just punishment. The saloon you drank in last week has coyotes in it now.
- Faction control shifts along the line: Company scrip appears in "their"
  stations, Watch checkpoints, Sundown toll crossings.

### Endgame

The line reaches the cordon. Every faction plays its last card. The final
junction is the Vein itself: seal it (Watch), tap it (Company), trust the
towns with it (Compact), treaty it under Sundown stewardship, or trust the
Surveyor's cheerful math and pull the lever yourselves. The Long Dusk either
ends, deepens, or — in the best FNV tradition — changes into something
nobody voted for.

---

## 6. Tone & grit guardrails

- **Scarcity with receipts.** Prices, debts, and wages are diegetic. Scrip
  vs caps vs barter is a real choice in Company territory.
- **Violence is cheap, killing is expensive.** Named NPCs die permanently
  and their quests die with them (the prototype's "the town will remember
  this" becomes literal: prices, dialogue, and quest access shift).
- **Nobody is clean.** Every faction quest line includes at least one order
  you'll want to refuse — and refusing has a cost too.
- **Funny like a gallows.** FNV is hilarious *because* it's bleak. Sal's
  radioactive water jokes are the register.
- **The desert wins by default.** The Dusk light, coyotes, ghost towns —
  the world reads as *outlasting* everyone, including you.

---

## 7. Roadmap (prototype-scale, in order)

| Milestone | Deliverable | Proves |
| --- | --- | --- |
| **M1 — Wire** | 2-player WebSocket sync in the current town (movement, shots, NPC state from host) | netcode viability in this stack |
| **M2 — Crew** | 4 players, revive/bleed-out, shared rep + wallet, interject stub in dialogue | co-op is fun in combat + town |
| **M3 — Steel** | Track-laying loop: survey markers → clear one authored obstacle → lay a spline of track → ride a handcar on it | the gimmick's core verb feels good |
| **M4 — Consequence** | One junction, two towns: connected town visibly grows, bypassed town visibly decays | the world-reaction promise |
| **M5 — Iron & Blood** | The work train (2 cars), one train-raid set piece, Watch and Company intro quests | faction stakes + signature set piece |
| **M6 — Vertical slice** | 2-3 hours: Charter hook → first junction → first faction ultimatum | the whole thesis |

Each milestone is shippable in the current no-build-step architecture except
M1's relay server (one small Node file, ~100 lines to start).

---

## 8. Open questions (deliberately unresolved)

1. **Session model** — persistent host world (Valheim-style) vs. campaign
   lobbies (Deep Rock-style)? Leaning persistent-host: the railroad *is* the
   save file.
2. **PvP at junctions** — pure vote, or allow a duel-for-the-spike option?
   (Fun, but could poison crews. Prototype the vote first.)
3. **How weird does the Vein country get?** Full weird-west (things in the
   short nights, dowser magic that works) vs. hard grit with one mystery.
   Leaning: the *edges* stay grounded; weirdness concentrates westward, so
   the approach to the endgame is also a tonal escalation.
4. **Name.** "Dusty Gulch" is the town. The game wants a title like
   *The Long Dusk*, *Golden Spike*, *Charter*, or *Last Line West*.
