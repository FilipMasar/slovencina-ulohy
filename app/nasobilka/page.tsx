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
