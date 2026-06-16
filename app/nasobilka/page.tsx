"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/src/lib/cn";

// --- Positions: classroom-safe poses; two distinct ones are picked each round ---
type Pose = { emoji: string; label: string };
type PosePair = { left: Pose; right: Pose };

const POSES: Pose[] = [
  { emoji: "🏄", label: "Surferská póza" },
  { emoji: "🦩", label: "Stoj na jednej nohe" },
  { emoji: "🦸", label: "Superhrdina" },
  { emoji: "⭐", label: "Hviezda" },
  { emoji: "🩰", label: "Stoj na špičkách" },
  { emoji: "🙏", label: "Ruky spolu" },
  { emoji: "🥋", label: "Bojovník" },
  { emoji: "🤖", label: "Robot" },
  { emoji: "🐢", label: "Korytnačka" },
  { emoji: "🙌", label: "Vystri ruky hore" },
  { emoji: "💪", label: "Napni svaly" },
  { emoji: "🤷", label: "Pokrč ramenami" },
  { emoji: "👋", label: "Zamávaj" },
  { emoji: "🧍", label: "Postav sa" },
  { emoji: "🧘", label: "Sadni si" },
  { emoji: "🧎", label: "Čupni si" },
  { emoji: "🙆", label: "Ruky hore" },
  { emoji: "🙇", label: "Predkloň sa" },
  { emoji: "🙋", label: "Ruka hore" },
  { emoji: "🙅", label: "Ruky prekríž" },
];

const MIN_FACTOR = 2;
const MAX_FACTOR = 10;

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Pick two distinct items at random, returned as [left, right].
function pickTwoDistinct<T>(arr: T[]): [T, T] {
  const i = Math.floor(Math.random() * arr.length);
  let j = Math.floor(Math.random() * (arr.length - 1));
  if (j >= i) j += 1;
  return [arr[i], arr[j]];
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
  const [left, right] = pickTwoDistinct(POSES);
  const posePair: PosePair = { left, right };
  return { a, b, product, distractor, correctSide, posePair };
}

type Phase = "asking" | "revealed";

// Auto-mode timing per phase (ms): time to take a position, then to see the answer.
type Speed = "slow" | "normal" | "fast";

const SPEEDS: Record<Speed, { label: string; ask: number; reveal: number }> = {
  slow: { label: "Pomaly", ask: 8000, reveal: 4000 },
  normal: { label: "Stredne", ask: 6000, reveal: 3000 },
  fast: { label: "Rýchlo", ask: 4000, reveal: 2000 },
};

const SPEED_ORDER: Speed[] = ["slow", "normal", "fast"];

export default function NasobilkaPage() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [phase, setPhase] = useState<Phase>("asking");
  const [auto, setAuto] = useState(false);
  const [speed, setSpeed] = useState<Speed>("normal");

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

  // Auto-mode: reveal after the "ask" delay, then advance after the "reveal" delay.
  useEffect(() => {
    if (!auto || !problem) return;
    const ms = phase === "asking" ? SPEEDS[speed].ask : SPEEDS[speed].reveal;
    const timer = setTimeout(advance, ms);
    return () => clearTimeout(timer);
  }, [auto, phase, speed, problem, advance]);

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

  const phaseMs = revealed ? SPEEDS[speed].reveal : SPEEDS[speed].ask;

  return (
    <div
      className="flex min-h-screen cursor-pointer select-none flex-col bg-gradient-to-b from-amber-100 to-orange-50 font-sans text-slate-800"
      onClick={advance}
    >
      <div className="h-2 w-full bg-orange-200/40">
        {auto && !revealed && (
          <div
            key={phase}
            className="h-full origin-left bg-orange-500"
            style={{ animation: `nasobilka-progress ${phaseMs}ms linear forwards` }}
          />
        )}
      </div>

      <div
        className="flex flex-wrap items-center justify-end gap-2 px-4 pt-3 sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setAuto((a) => !a)}
          className={cn(
            "min-h-11 rounded-xl border-2 px-4 py-2 text-base font-bold transition",
            auto
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-orange-300 bg-white text-orange-600 hover:border-orange-400",
          )}
        >
          {auto ? "⏸ Auto: zap." : "▶ Auto: vyp."}
        </button>

        {auto && (
        <div className="flex gap-1.5">
          {SPEED_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={cn(
                "min-h-11 rounded-xl border-2 px-3 py-2 text-base font-semibold transition",
                speed === s
                  ? "border-orange-500 bg-orange-100 text-orange-700"
                  : "border-orange-200 bg-white text-slate-500 hover:border-orange-300",
              )}
            >
              {SPEEDS[s].label}
            </button>
          ))}
        </div>
        )}
      </div>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-10 px-4 py-8">
        <div className="rounded-3xl bg-white/95 px-12 py-6 shadow-sm">
          <p className="text-7xl font-black tracking-tight text-orange-600 sm:text-8xl">
            {problem.a} × {problem.b}
          </p>
        </div>

        <div className="flex w-full max-w-5xl gap-6 sm:gap-10">
          {panel("left", problem.posePair.left, leftValue)}
          {panel("right", problem.posePair.right, rightValue)}
        </div>
      </main>
    </div>
  );
}
