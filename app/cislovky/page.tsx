"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DATA_CISLOVKY } from "@/src/data/cislovky";
import { cn } from "@/src/lib/cn";
import { shuffleArray } from "@/src/lib/shuffle";

const druhy = ["základná", "radová"] as const;

const NUM_QUESTIONS = 8;
const PRAISE_MESSAGES = ["Super!", "Skvelá práca!", "Výborne!", "Perfektne!", "Len tak ďalej!"];
const TRY_AGAIN_MESSAGES = ["Skús to ešte raz.", "Nevadí, poďme ďalej.", "Ďalšia úloha sa určite podarí."];

type Question = (typeof DATA_CISLOVKY)[number];
type Druh = (typeof druhy)[number];
type FeedbackTone = "" | "good" | "bad";

type Mistake = {
  word: string;
  yours: string;
  correct: string;
};

function pickQuestions(): Question[] {
  return shuffleArray(DATA_CISLOVKY).slice(0, NUM_QUESTIONS);
}

function getStarsAndMessage(pct: number) {
  if (pct >= 90) {
    return { stars: "⭐⭐⭐", message: "Si majster číslovek!" };
  }
  if (pct >= 70) {
    return { stars: "⭐⭐", message: "Veľmi dobre! Skús to ešte raz pre plný počet!" };
  }
  return { stars: "⭐", message: "Dobrý pokus! Skús to znova!" };
}

function pickRandomMessage(messages: string[]) {
  return messages[Math.floor(Math.random() * messages.length)];
}

function renderHighlightedSentence(sentence: string) {
  const match = sentence.match(/^(.*)<(.+?)>(.*)$/);
  if (!match) {
    return sentence;
  }

  return (
    <>
      {match[1]}
      <span className="font-extrabold text-violet-600 underline decoration-4">{match[2]}</span>
      {match[3]}
    </>
  );
}

export default function CisloVkyPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<Druh | null>(null);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [checked, setChecked] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>("");
  const [showNext, setShowNext] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQuestion = questions[currentIndex];
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const summary = useMemo(() => getStarsAndMessage(pct), [pct]);

  const clearFinishTimeout = () => {
    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = null;
    }
  };

  const restart = () => {
    clearFinishTimeout();
    const nextQuestions = pickQuestions();

    setScore(0);
    setMistakes([]);
    setShowResults(false);
    setQuestions(nextQuestions);
    setCurrentIndex(0);
    setSelected(null);
    setChecked(false);
    setFeedback("");
    setFeedbackTone("");
    setShowNext(false);
  };

  useEffect(() => {
    restart();

    return () => {
      clearFinishTimeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAnswer = () => {
    if (!currentQuestion || checked || selected === null) return;

    setChecked(true);

    if (selected === currentQuestion.answer) {
      setScore((prev) => prev + 1);
      setFeedback(`Správne! ${pickRandomMessage(PRAISE_MESSAGES)}`);
      setFeedbackTone("good");
    } else {
      const word = currentQuestion.sentence.match(/<(.+?)>/)?.[1] ?? "slovo";
      setMistakes((prev) => [...prev, { word, yours: selected, correct: currentQuestion.answer }]);
      setFeedback(`Skús ešte raz. ${pickRandomMessage(TRY_AGAIN_MESSAGES)}`);
      setFeedbackTone("bad");
    }

    if (currentIndex < questions.length - 1) {
      setShowNext(true);
      return;
    }

    clearFinishTimeout();
    finishTimeoutRef.current = setTimeout(() => {
      setShowResults(true);
    }, 1200);
  };

  const nextQuestion = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) return;

    setCurrentIndex(nextIndex);
    setSelected(null);
    setChecked(false);
    setFeedback("");
    setFeedbackTone("");
    setShowNext(false);
  };

  const isCheckDisabled = checked || selected === null;

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-100 to-violet-50 font-sans text-slate-800">
      {!showResults ? (
        <div>
          <div className="mx-auto mt-4 flex max-w-5xl justify-center gap-2 px-4">
            {questions.map((_, i) => (
              <div
                key={`dot-${i}`}
                className={cn(
                  "h-3.5 w-3.5 rounded-full transition",
                  i < currentIndex && "bg-emerald-500",
                  i === currentIndex && "scale-125 bg-violet-500",
                  i > currentIndex && "bg-violet-200/80",
                )}
              />
            ))}
          </div>

          <main className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-5xl flex-col items-center justify-center px-4 py-8 sm:px-6">
            <p className="mb-3 rounded-xl bg-white/75 px-4 py-2 text-center text-2xl font-bold text-slate-700 sm:text-3xl">
              {renderHighlightedSentence(currentQuestion.sentence)}
            </p>
            <p className="mb-7 text-center text-lg font-medium text-slate-500">
              Aký druh číslovky je zvýraznené slovo?
            </p>

            <div className="mb-6 w-full max-w-3xl">
              <div className="rounded-2xl bg-white/95 p-4 shadow-sm">
                <p className="mb-3 text-lg font-extrabold uppercase tracking-wide text-violet-600">Druh</p>
                <div className="flex flex-wrap gap-2">
                  {druhy.map((option) => {
                    const isSelected = selected === option;
                    const isCorrect = checked && option === currentQuestion.answer;
                    const isWrong = checked && option === selected && selected !== currentQuestion.answer;

                    return (
                      <button
                        key={option}
                        type="button"
                        className={cn(
                          "min-h-12 rounded-xl border-2 px-5 py-2 text-xl font-semibold transition",
                          !checked && "border-violet-200 bg-white hover:border-violet-400 hover:bg-violet-50",
                          !checked && isSelected && "border-violet-500 bg-violet-100 text-violet-700",
                          isCorrect && "border-emerald-400 bg-emerald-100 text-emerald-700",
                          isWrong && "border-rose-300 bg-rose-100 text-rose-700",
                        )}
                        disabled={checked}
                        onClick={() => setSelected(option)}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {!checked && (
              <button
                type="button"
                className="min-h-14 rounded-2xl bg-violet-500 px-10 py-3 text-xl font-bold text-white transition hover:-translate-y-0.5 hover:bg-violet-600 disabled:cursor-default disabled:bg-violet-300"
                disabled={isCheckDisabled}
                onClick={checkAnswer}
              >
                Skontrolovať
              </button>
            )}

            <div
              className={cn(
                "mt-4 min-h-12 text-center text-2xl font-extrabold",
                feedbackTone === "good" && "text-emerald-600",
                feedbackTone === "bad" && "text-rose-600",
              )}
            >
              {feedback}
            </div>

            {showNext && (
              <button
                type="button"
                className="mt-2 min-h-14 rounded-2xl bg-violet-500 px-10 py-3 text-xl font-bold text-white transition hover:-translate-y-0.5 hover:bg-violet-600"
                onClick={nextQuestion}
              >
                Ďalšia úloha →
              </button>
            )}
          </main>
        </div>
      ) : (
        <section className="mx-auto w-full max-w-4xl px-4 py-12 text-center">
          <h2 className="text-4xl font-black text-violet-600">Hotovo!</h2>
          <p className="mt-3 text-5xl">{summary.stars}</p>
          <p className="mt-2 text-5xl font-black text-emerald-600">
            {score} / {questions.length}
          </p>
          <p className="mt-2 text-xl font-semibold text-slate-600">{summary.message}</p>

          <div className="mx-auto mt-8 max-w-3xl text-left">
            {mistakes.length > 0 && (
              <p className="mb-3 text-center text-lg font-extrabold text-rose-600">Tvoje chyby:</p>
            )}

            {mistakes.map((mistake, idx) => (
              <div key={`mistake-${idx}`} className="mb-2 rounded-xl bg-rose-100 px-4 py-3 text-lg leading-8">
                <span className="font-extrabold text-rose-700">{mistake.word}</span> - dal/a si{" "}
                <span className="text-slate-500 line-through">{mistake.yours}</span>, správne:{" "}
                <span className="font-extrabold text-emerald-700">{mistake.correct}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mt-6 min-h-14 rounded-2xl bg-violet-500 px-12 py-3 text-xl font-bold text-white transition hover:-translate-y-0.5 hover:bg-violet-600"
            onClick={restart}
          >
            Skúsiť znova
          </button>
        </section>
      )}
    </div>
  );
}
