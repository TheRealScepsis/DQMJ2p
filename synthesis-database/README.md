# DQMJ2 Professional — Synthesis & Skill Database

A static, client-side searchable reference for **Dragon Quest Monsters: Joker 2 Professional**
(Nintendo DS, Japan-only — commonly played via the English fan translation).

Live site: https://therealscepsis.github.io/DQMJ2p/

## What it does

- **Monster Synthesis search** — search any monster and instantly see:
  - every recipe that **produces** it (the synthesis target), and
  - every recipe that uses it **as a material** anywhere in its ingredient list.
  - Filter by family and rank, and switch results between a card view and a compact list/table view.
- **Synthesis Tree** — search a monster to render its full ancestry, all the way back to wild-caught
  base monsters. Two view modes: a visual **Diagram** (org-chart style, with zoom/fit controls for
  wide trees) and a collapsible **Outline** (an indented, tap-to-expand list) that defaults to open on
  small screens, since panning around a huge diagram on a phone is painful. Tap/click any node to
  re-root the tree on that monster, and use the ⟲ button on a node with multiple recipes to switch
  which combination is shown. Materials repeated within a recipe (e.g. "Liquid Metal Slime ×4") are
  collapsed into a single branch with a quantity badge instead of exploding into duplicate subtrees.
- **Builder** — the same ancestry as a compact "parts list": only the selected monster's direct
  materials are shown at first, and everything deeper stays collapsed until you tap the (large,
  thumb-friendly) ▸ arrow to expand a specific branch. A material with no recipe of its own, or one
  that would loop back into an earlier step, is marked 🎣 **Catchable** rather than forced open, since
  it's simplest to just catch that monster in the wild. Much more space-efficient than the full Tree
  for a quick "what do I need next" look, especially on a phone. Tapping a monster's name re-roots the
  kit onto it; a **← Back** button walks you back out again, one step at a time, to wherever you
  started.
- **All Monsters** — no search box, just the complete list: every synthesis recipe (with rank, family,
  size, and materials) and every base monster that's simply caught in the wild, each in its own
  sortable table — click a column header to sort by it.
- **Skill Upgrade search** — search any skill and instantly see:
  - what combination of skills **creates** it, and
  - every upgraded skill that **requires it** as an ingredient skill (with the minimum level needed).

Everything runs entirely in the browser against a static dataset — no backend, no build step, no tracking.

## Data

- **333** synthesis recipes (rank/family formula syntheses).
- **150** skill upgrade combinations.
- **336** monster icons.

Monster synthesis recipes come from a Professional-specific synthesis export. Skill upgrade
combinations come from [Dragon's Den](https://www.woodus.com/den/games/dqm5ds/), the long-standing
Dragon Quest Monsters fansite (Skill Upgrade Requirements page for DQMJ2).

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
