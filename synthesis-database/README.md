# DQMJ2 Professional — Synthesis & Skill Database

A static, client-side searchable reference for **Dragon Quest Monsters: Joker 2 Professional**
(Nintendo DS, Japan-only — commonly played via the English fan translation).

Live site: https://therealscepsis.github.io/DQMJ2p/

## What it does

- **Monster Synthesis search** — search any monster and instantly see:
  - every recipe that **produces** it (the synthesis target), and
  - every recipe that uses it **as a material** anywhere in its ingredient list.
  - Filter by family, rank, and whether to include Professional's Special-Only syntheses.
- **Skill Upgrade search** — search any skill and instantly see:
  - what combination of skills **creates** it, and
  - every upgraded skill that **requires it** as an ingredient skill (with the minimum level needed).

Everything runs entirely in the browser against a static dataset — no backend, no build step, no tracking.

## Data

- **678** synthesis recipes: normal rank/family formula syntheses plus Professional's Special-Only combinations.
- **150** skill upgrade combinations.
- **400+** monster icons.

Source material was extracted from a Professional-specific synthesis export and from
[Dragon's Den](https://www.woodus.com/den/games/dqm5ds/), the long-standing Dragon Quest Monsters
fansite (Special-Only Synthesizations and Skill Upgrade Requirements pages for DQMJ2).

## Running locally

No build tooling required — it's plain HTML/CSS/JS.

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Project structure

```
index.html   – markup & layout
style.css    – theme and styling
data.js      – static recipe/skill dataset (generated from source pages)
app.js       – search, filtering, and rendering logic
```

---

Fan-made reference tool. Not affiliated with Square Enix.
