# Malá násobilka — pohybom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone, full-screen classroom math+PE exercise at `/nasobilka` where pupils answer multiplication problems by taking a left/right body position, advanced by any input (click/tap/key).

**Architecture:** A single self-contained Next.js client component (`app/nasobilka/page.tsx`) holding pure generator helpers + a two-state UI ("asking" → "revealed"). One new card links it from the home page. No new data file, no new dependencies; reuses only the `cn` helper.

**Tech Stack:** Next.js 16 (App Router, client component), React 19, Tailwind v4, TypeScript. Package manager: `pnpm`.

> **Testing note:** This repo has no test runner and none of the existing exercises have tests. Per YAGNI and codebase convention, verification is manual via `pnpm dev` + `pnpm lint`. Generator logic is kept as pure, self-contained functions so it can be reasoned about and (optionally) logged during dev.

---

### Task 1: Create the exercise page with generator + static UI

**Files:**
- Create: `app/nasobilka/page.tsx`

This task creates the full page in one file. It is presented in build order: (1) constants + pure helpers, (2) the React component.

- [ ] **Step 1: Create the file with constants and pure generator helpers**

Create `app/nasobilka/page.tsx` with the following top section (imports + module-level constants + pure functions). These functions take no React state and are deterministic given `Math.random`, matching how `shuffle.ts`/existing exercises use randomness.

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/src/lib/cn";

// --- Positions: rotating classroom-safe pairs (left pose, right pose) ---
type Pose = { emoji: string; label: string };
type PosePair = { left: Pose; right: Pose };

const POSE_PAIRS: PosePair[] = [
  { left: { emoji: "🧘", label: "Sadni si" }, right: { emoji: "🧍", label: "Postav sa" } },
  { left: { emoji: "🧎", label: "Čupni si" }, right: { emoji: "🧍", label: "Postav sa" } },
  { left: { emoji: "🙆", label: "Ruky hore" }, right: { emoji: "🙇", label: "Predkloň sa" } },
  { left: { emoji: "🙋", label: "Ruka hore" }, right: { emoji: "🧍", label: "Stoj rovno" } },
];

const MIN_FACTOR = 2;
const MAX_FACTOR = 10;

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Build a plausible wrong distractor from common multiplication mistakes.
function makeDistractor(a: number, b: number, product: number): number {
  const candidates = [
    a * (b + 1),
    a * (b - 1),
    (a + 1) * b,
    (a - 1) * b,
    product + a,
    product - a,
    product + b,
    product - b,
    product + 1,
    product - 1,
  ].filter((n) => n > 0 && n !== product);

  const unique = Array.from(new Set(candidates));
  return pickFrom(unique);
}

type Problem = {
  a: number;
  b: number;
  product: number;
  distractor: number;
  correctSide: "left" | "right";
  posePair: PosePair;
};

function makeProblem(): Problem {
  const a = randInt(MIN_FACTOR, MAX_FACTOR);
  const b = randInt(MIN_FACTOR, MAX_FACTOR);
  const product = a * b;
  const distractor = makeDistractor(a, b, product);
  const correctSide: "left" | "right" = Math.random() < 0.5 ? "left" : "right";
  const posePair = pickFrom(POSE_PAIRS);
  return { a, b, product, distractor, correctSide, posePair };
}
```

- [ ] **Step 2: Add the React component (state, input handling, render)**

Append the component to the same file:

```tsx
type Phase = "asking" | "revealed";

export default function NasobilkaPage() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [phase, setPhase] = useState<Phase>("asking");

  useEffect(() => {
    setProblem(makeProblem());
  }, []);

  const advance = useCallback(() => {
    setPhase((prev) => {
      if (prev === "asking") return "revealed";
      setProblem(makeProblem());
      return "asking";
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const keys = ["Enter", " ", "Spacebar", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
      if (keys.includes(e.key)) {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [advance]);

  if (!problem) return null;

  const revealed = phase === "revealed";
  const leftValue = problem.correctSide === "left" ? problem.product : problem.distractor;
  const rightValue = problem.correctSide === "right" ? problem.product : problem.distractor;

  const panel = (side: "left" | "right", pose: Pose, value: number) => {
    const isCorrect = revealed && problem.correctSide === side;
    const isWrong = revealed && problem.correctSide !== side;
    return (
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center rounded-3xl border-4 bg-white/90 px-6 py-10 transition",
          !revealed && "border-orange-200",
          isCorrect && "border-emerald-500 bg-emerald-50",
          isWrong && "border-rose-200 bg-rose-50 opacity-50",
        )}
      >
        <span className="text-7xl sm:text-8xl" aria-hidden>
          {pose.emoji}
        </span>
        <span className="mt-2 text-xl font-bold uppercase tracking-wide text-orange-600 sm:text-2xl">
          {pose.label}
        </span>
        <span className="mt-3 text-6xl font-black text-slate-800 sm:text-8xl">
          {value}
          {isCorrect && <span className="ml-3 text-emerald-500">✓</span>}
        </span>
      </div>
    );
  };

  return (
    <div
      className="flex min-h-screen cursor-pointer select-none flex-col bg-gradient-to-b from-amber-100 to-orange-50 font-sans text-slate-800"
      onClick={advance}
    >
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-10 px-4 py-8">
        <div className="rounded-3xl bg-white/95 px-12 py-6 shadow-sm">
          <p className="text-7xl font-black tracking-tight text-orange-600 sm:text-8xl">
            {problem.a} · {problem.b}
          </p>
        </div>

        <div className="flex w-full max-w-5xl gap-6 sm:gap-10">
          {panel("left", problem.posePair.left, leftValue)}
          {panel("right", problem.posePair.right, rightValue)}
        </div>

        <p className="min-h-8 text-center text-lg font-semibold text-orange-700/70 sm:text-xl">
          {revealed ? "Ďalej →" : "Klikni alebo stlač medzerník"}
        </p>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Verify it compiles and renders**

Run: `pnpm dev` (in a separate terminal), then open `http://localhost:3000/nasobilka`.
Expected:
- A problem like `7 · 4` shows in the top card.
- Two panels appear with a pose emoji + Slovak label + a number; the two numbers differ.
- Clicking anywhere (or pressing Space/Enter/arrows) reveals the correct panel (green ✓) and dims the other.
- Clicking/pressing again loads a new problem.
- Pressing Space does NOT scroll the page.

- [ ] **Step 4: Commit**

```bash
git add app/nasobilka/page.tsx
git commit -m "Add Malá násobilka pohybom exercise page

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Add the home-page launcher card

**Files:**
- Modify: `app/page.tsx` (the `exercises` array)

- [ ] **Step 1: Add the new card to the `exercises` array**

In `app/page.tsx`, append this object as the last element of the `exercises` array (after the `casovanie-slovies` entry):

```tsx
  {
    href: "/nasobilka",
    title: "Malá násobilka — pohybom",
    description: "Ukáž odpoveď pohybom: sadni si alebo sa postav podľa správnej strany.",
    color: "bg-orange-100/80 border-orange-300 hover:border-orange-400",
  },
```

- [ ] **Step 2: Verify the card appears and links**

Run: with `pnpm dev` running, open `http://localhost:3000/`.
Expected: a new orange "Malá násobilka — pohybom" card is visible and clicking it navigates to `/nasobilka`.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "Link Malá násobilka pohybom from home page

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Final lint check

**Files:** none (verification only)

- [ ] **Step 1: Run the linter**

Run: `pnpm lint`
Expected: passes with no errors for the new/modified files.

- [ ] **Step 2: If there are fixable issues, fix them and amend the relevant commit**

Address any reported issues in `app/nasobilka/page.tsx` or `app/page.tsx`, then re-run `pnpm lint` until clean.

---

## Self-Review

- **Spec coverage:** flow (any-input reveal/advance) → Task 1 Step 2; endless, no score → Task 1 (no score state); factors 2–10 → `randInt(MIN_FACTOR, MAX_FACTOR)`; plausible distractor → `makeDistractor`; rotating pose pairs → `POSE_PAIRS` + `pickFrom`; orange/amber theme → gradient + accents in Task 1 Step 2; left/right correct placement → `correctSide`; home card → Task 2; manual verification → Task 1 Step 3 / Task 3. All covered.
- **Placeholder scan:** no TBD/TODO; all code shown in full.
- **Type consistency:** `Pose`, `PosePair`, `Problem`, `Phase`, `makeProblem`, `makeDistractor`, `advance` used consistently across steps.
