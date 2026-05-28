"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DATA_CASOVANIE_SLOVIES } from "@/src/data/casovanie-slovies";
import { cn } from "@/src/lib/cn";
import { shuffleArray } from "@/src/lib/shuffle";

const osobaLabels: Record<number, string> = { 1: "1. osoba", 2: "2. osoba", 3: "3. osoba" };

const NUM_QUESTIONS = 8;
const PRAISE_MESSAGES = ["Super!", "Skvelá práca!", "Výborne!", "Perfektne!", "Len tak ďalej!"];
const TRY_AGAIN_MESSAGES = ["Nevadí, pokračujeme.", "Ideme ďalej.", "Nabudúce to vyjde."];

type BaseQuestion = (typeof DATA_CASOVANIE_SLOVIES)[number];
type Question = BaseQuestion & { shuffledOptions: string[] };
type FeedbackTone = "" | "good" | "bad";

type Mistake = {
  prompt: string;
  yours: string;
  correct: string;
};

function pickQuestions(): Question[] {
  return shuffleArray(DATA_CASOVANIE_SLOVIES)
    .slice(0, NUM_QUESTIONS)
    .map((q) => ({ ...q, shuffledOptions: shuffleArray(q.options) }));
}

function getStarsAndMessage(pct: number) {
  if (pct >= 90) {
    return { stars: "⭐⭐⭐", message: "Si majster slovenčiny!" };
  }
  if (pct >= 70) {
    return { stars: "⭐⭐", message: "Veľmi dobre! Skús to ešte raz pre plný počet!" };
  }
  return { stars: "⭐", message: "Dobrý pokus! Skús to znova!" };
}

function pickRandomMessage(messages: string[]) {
  return messages[Math.floor(Math.random() * messages.length)];
}

function describe(question: BaseQuestion) {
  return `${question.cas} čas · ${osobaLabels[question.osoba]} · ${question.cislo} číslo`;
}

export default function CasovanieSloviesPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
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

    setQuestions(nextQuestions);
    setCurrentIndex(0);
    setScore(0);
    setMistakes([]);
    setSelected(null);
    setChecked(false);
    setFeedback("");
    setFeedbackTone("");
    setShowNext(false);
    setShowResults(false);
  };

  useEffect(() => {
    restart();

    return () => {
      clearFinishTimeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOptionClick = (option: string) => {
    if (!currentQuestion || checked) return;

    setSelected(option);
    setChecked(true);

    if (option === currentQuestion.answer) {
      setScore((prev) => prev + 1);
      setFeedback(`Správne! ${pickRandomMessage(PRAISE_MESSAGES)}`);
      setFeedbackTone("good");
    } else {
      setMistakes((prev) => [
        ...prev,
        {
          prompt: `${currentQuestion.infinitive} (${describe(currentQuestion)})`,
          yours: option,
          correct: currentQuestion.answer,
        },
      ]);
      setFeedback(`Nesprávne. ${pickRandomMessage(TRY_AGAIN_MESSAGES)}`);
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

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-fuchsia-100 to-fuchsia-50 font-sans text-slate-800">
      {!showResults ? (
        <div>
          <div className="mx-auto mt-4 flex max-w-5xl justify-center gap-2 px-4">
            {questions.map((_, i) => (
              <div
                key={`dot-${i}`}
                className={cn(
                  "h-3.5 w-3.5 rounded-full transition",
                  i < currentIndex && "bg-emerald-500",
                  i === currentIndex && "scale-125 bg-fuchsia-500",
                  i > currentIndex && "bg-fuchsia-200/80",
                )}
              />
            ))}
          </div>

          <main className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-5xl flex-col items-center justify-center px-4 py-8 sm:px-6">
            <p className="mb-2 text-center text-lg font-medium text-slate-500">Vyčasuj sloveso</p>
            <p className="mb-3 rounded-xl bg-white/75 px-6 py-3 text-center text-3xl font-black text-fuchsia-700 sm:text-4xl">
              {currentQuestion.infinitive}
            </p>
            <p className="mb-7 text-center text-xl font-semibold text-slate-600">{describe(currentQuestion)}</p>

            <div className="mb-6 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
              {currentQuestion.shuffledOptions.map((option) => {
                const isSelected = selected === option;
                const isCorrect = checked && option === currentQuestion.answer;
                const isWrong = checked && isSelected && option !== currentQuestion.answer;

                return (
                  <button
                    key={option}
                    type="button"
                    className={cn(
                      "min-h-16 rounded-2xl border-4 bg-white px-6 py-3 text-2xl font-bold text-slate-700 transition",
                      !checked && "border-fuchsia-300 hover:-translate-y-0.5 hover:border-fuchsia-400 hover:bg-fuchsia-50",
                      isCorrect && "cursor-default border-emerald-400 bg-emerald-100 text-emerald-700",
                      isWrong && "cursor-default border-rose-300 bg-rose-100 text-rose-700",
                      checked && !isCorrect && !isWrong && "cursor-default opacity-60",
                    )}
                    disabled={checked}
                    onClick={() => handleOptionClick(option)}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            <div
              className={cn(
                "min-h-12 text-center text-2xl font-extrabold",
                feedbackTone === "good" && "text-emerald-600",
                feedbackTone === "bad" && "text-rose-600",
              )}
            >
              {feedback}
            </div>

            {showNext && (
              <button
                type="button"
                className="mt-2 min-h-14 rounded-2xl bg-fuchsia-500 px-10 py-3 text-xl font-bold text-white transition hover:-translate-y-0.5 hover:bg-fuchsia-600"
                onClick={nextQuestion}
              >
                Ďalšia úloha →
              </button>
            )}
          </main>
        </div>
      ) : (
        <section className="mx-auto w-full max-w-4xl px-4 py-12 text-center">
          <h2 className="text-4xl font-black text-fuchsia-600">Hotovo!</h2>
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
                <span className="font-extrabold text-rose-700">{mistake.prompt}</span>
                <br />
                dal/a si <span className="text-slate-500 line-through">{mistake.yours}</span>, správne: {" "}
                <span className="font-extrabold text-emerald-700">{mistake.correct}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mt-6 min-h-14 rounded-2xl bg-fuchsia-500 px-12 py-3 text-xl font-bold text-white transition hover:-translate-y-0.5 hover:bg-fuchsia-600"
            onClick={restart}
          >
            Skúsiť znova
          </button>
        </section>
      )}
    </div>
  );
}
