# Malá násobilka — pohybom (Math + PE exercise)

**Date:** 2026-06-16
**Route:** `/nasobilka` → `app/nasobilka/page.tsx`

## Purpose

A standalone, full-screen classroom activity that combines PE with the small
multiplication table. The screen shows a multiplication problem (e.g. `9 · 3`)
and two answer panels — one on the **left**, one on the **right**. Each panel is
tied to a simple, classroom-doable body position (e.g. *sadni si* / *postav sa*).
Pupils physically take the position of the answer they think is correct. The
teacher reveals the correct side, then advances to the next problem.

This exercise is intentionally **separate** from the language exercises: its own
route, its own (orange/amber, "sporty") visual theme, and no shared data file.
Problems are generated in code. It reuses only the tiny `cn` helper.

## User experience

### Flow (teacher-led, button-free)

Each problem has two states:

1. **Asking** — problem + both answer panels are shown. A discreet hint line
   reads e.g. *"Klikni alebo stlač medzerník"*.
2. **Revealed** — the correct panel is highlighted green with a ✓, the other is
   dimmed/red. The hint line changes to prompt the next problem, e.g.
   *"Ďalej →"*.

**Any input advances the state machine:**
- Mouse click / tap anywhere on the screen
- `Space` or `Enter`
- Arrow keys (`←` `→` `↑` `↓`)

First input on a problem reveals the answer; the next input loads a new problem.
There are **no on-screen buttons** — keeps the layout big and clean for a room,
and lets the teacher drive it with a clicker, keyboard, or touch.

The activity is **endless**: it keeps generating new problems. No score, no end
screen (it is a whole-class activity, not per-pupil).

### Layout (mirrors the reference image)

```
┌─────────────────────────────────────┐
│               9 · 3                 │   ← big problem card
└─────────────────────────────────────┘

   ┌────────────┐       ┌────────────┐
   │     🧘      │       │     🧍      │
   │  Sadni si  │       │ Postav sa  │   ← two big position panels
   │     27     │       │     24     │
   └────────────┘       └────────────┘

          Klikni alebo stlač medzerník
```

## Math content

- Both factors are random integers **2–10** (inclusive). Trivial `×1` is skipped.
- The correct product is placed on a **random side** (left or right) each round.
- The other side shows a **plausible wrong distractor**:
  - Candidate values are derived from common mistakes: `a*(b±1)`, `(a±1)*b`,
    `p±a`, `p±b`, `p±1`.
  - The distractor must be a **positive integer** and **different** from the
    correct product. Pick one valid candidate at random.

## Positions (rotating classroom-safe pairs)

Each round picks a random **pose pair** from a small pool. The first pose of the
pair is shown on the left panel, the second on the right. Each panel renders a
large emoji + a short Slovak instruction label + the number.

Pool of pairs (all desk/classroom friendly — no space or equipment needed):

| Left pose            | Right pose            |
|----------------------|-----------------------|
| 🧘 Sadni si          | 🧍 Postav sa          |
| 🧎 Čupni si          | 🧍 Postav sa          |
| 🙆 Ruky hore         | 🙇 Predkloň sa        |
| 🙋 Ruka hore         | 🧍 Stoj rovno         |

(The exact pool is defined as a constant in the page; easy to extend later.)

Note: the pose pair is **visual flavour** indicating which body position maps to
the left vs right answer. The pose itself does not affect correctness — the
answer is still about which side holds the correct product.

## Visual theme

- Orange/amber "sporty" palette (e.g. `from-amber-100 to-orange-50` background,
  `orange-500` accents), distinct from the pastel language exercises so it reads
  as a different kind of activity.
- Large, high-contrast typography readable across a classroom.
- Tailwind only (v4), consistent with the rest of the app.

## Components / structure

Single self-contained client component `app/nasobilka/page.tsx`:

- **Problem generator** — pure helper(s) producing `{ a, b, product, distractor,
  correctSide, posePair }`. Uses `Math.random` (same approach as existing
  exercises). Lives in the page file (no new data file).
- **State**: `current` problem object, `phase: "asking" | "revealed"`.
- **Input handling**: one `window` `keydown` listener (Space/Enter/Arrows, with
  `preventDefault` for Space to avoid page scroll) + an `onClick` on the
  full-screen container (covers mouse and touch taps).
- **Render**: problem card, two panels (left/right) showing emoji + label +
  number, hint line. On `revealed`, apply correct/incorrect styling.

## Home page integration

Add one new card to the `exercises` array in `app/page.tsx`:

```ts
{
  href: "/nasobilka",
  title: "Malá násobilka — pohybom",
  description: "Ukáž odpoveď pohybom: sadni si alebo sa postav podľa správnej strany.",
  color: "bg-orange-100/80 border-orange-300 hover:border-orange-400",
}
```

## Out of scope (YAGNI)

- No scoring, stars, mistakes list, or results screen.
- No difficulty selector / settings.
- No persistence.
- No bundled image assets (emoji only).

## Testing

Manual verification (matches how the rest of the app is validated — no test
harness exists in the repo):

- `pnpm dev`, open `/nasobilka`.
- Verify: problem renders, both panels show distinct numbers, one is the correct
  product; pose pair varies across rounds; correct side varies across rounds.
- Verify input: click/tap reveals then advances; Space/Enter/Arrows do the same;
  Space does not scroll the page.
- Verify the home page shows the new card and links correctly.
- `pnpm lint` passes.
