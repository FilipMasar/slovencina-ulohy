"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DATA_ROD_CISLO_PAD } from "@/src/data/rod-cislo-pad";
import { cn } from "@/src/lib/cn";
import { shuffleArray } from "@/src/lib/shuffle";

const rody = ["mužský", "ženský", "stredný"];
const cisla = ["jednotné", "množné"];
const pady = ["nominatív", "genitív", "datív", "akuzatív", "lokál", "inštrumentál"];

const NUM_QUESTIONS = 5;
const PRAISE_MESSAGES = ["Super!", "Skvelá práca!", "Výborne!", "Perfektne!", "Len tak ďalej!"];
const TRY_AGAIN_MESSAGES = ["Nevadí, pokračujeme.", "Ideme ďalej.", "Nabudúce to vyjde."];

type Question = (typeof DATA_ROD_CISLO_PAD)[number];
type FeedbackTone = "" | "good" | "bad";

type Selected = {
  rod: string | null;
  cislo: string | null;
  pad: number | null;
};

type Mistake = {
  word: string;
  details: { cat: string; yours: string; correct: string }[];
};

function pickQuestions(): Question[] {
  return shuffleArray(DATA_ROD_CISLO_PAD).slice(0, NUM_QUESTIONS);
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

function renderHighlightedSentence(sentence: string) {
  const match = sentence.match(/^(.*)<(.+?)>(.*)$/);
  if (!match) {
    return sentence;
  }

  return (
    <>
      {match[1]}
      <span className="font-extrabold text-sky-600 underline decoration-4">{match[2]}</span>
      {match[3]}
    </>
  );
}

export default function RodCisloPadPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<Selected>({ rod: null, cislo: null, pad: null });
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

  const setUpQuestion = (index: number, baseQuestions: Question[]) => {
    setCurrentIndex(index);
    setSelected({ rod: null, cislo: null, pad: null });
    setChecked(false);
    setFeedback("");
    setFeedbackTone("");
    setShowNext(false);
    setQuestions(baseQuestions);
  };

  const restart = () => {
    clearFinishTimeout();
    const nextQuestions = pickQuestions();

    setScore(0);
    setMistakes([]);
    setShowResults(false);
    setUpQuestion(0, nextQuestions);
  };

  useEffect(() => {
    restart();

    return () => {
      clearFinishTimeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAnswer = () => {
    if (!currentQuestion || checked) return;
    if (selected.rod === null || selected.cislo === null || selected.pad === null) return;

    setChecked(true);

    const answer = currentQuestion.answer;
    const rodOk = selected.rod === answer.rod;
    const cisloOk = selected.cislo === answer.cislo;
    const padOk = selected.pad === answer.pad;

    if (rodOk && cisloOk && padOk) {
      setScore((prev) => prev + 1);
      setFeedback(`Správne! ${pickRandomMessage(PRAISE_MESSAGES)}`);
      setFeedbackTone("good");
    } else {
      const word = currentQuestion.sentence.match(/<(.+?)>/)?.[1] ?? "slovo";
      const detail: Mistake["details"] = [];

      if (!rodOk) {
        detail.push({ cat: "rod", yours: selected.rod, correct: answer.rod });
      }
      if (!cisloOk) {
        detail.push({ cat: "číslo", yours: selected.cislo, correct: answer.cislo });
      }
      if (!padOk) {
        detail.push({
          cat: "pád",
          yours: selected.pad !== null ? pady[selected.pad] : "-",
          correct: pady[answer.pad],
        });
      }

      setMistakes((prev) => [...prev, { word, details: detail }]);
      setFeedback(`Nesprávne — chyba: ${detail.map((d) => d.cat).join(", ")}. ${pickRandomMessage(TRY_AGAIN_MESSAGES)}`);
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
    setSelected({ rod: null, cislo: null, pad: null });
    setChecked(false);
    setFeedback("");
    setFeedbackTone("");
    setShowNext(false);
  };

  const isCheckDisabled =
    checked || selected.rod === null || selected.cislo === null || selected.pad === null;

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-sky-50 font-sans text-slate-800">
      {!showResults ? (
        <div>
          <div className="mx-auto mt-4 flex max-w-5xl justify-center gap-2 px-4">
            {questions.map((_, i) => (
              <div
                key={`dot-${i}`}
                className={cn(
                  "h-3.5 w-3.5 rounded-full transition",
                  i < currentIndex && "bg-emerald-500",
                  i === currentIndex && "scale-125 bg-sky-500",
                  i > currentIndex && "bg-sky-200/80",
                )}
              />
            ))}
          </div>

          <main className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-5xl flex-col items-center justify-center px-4 py-8 sm:px-6">
            <p className="mb-3 rounded-xl bg-white/75 px-4 py-2 text-center text-2xl font-bold text-slate-700 sm:text-3xl">
              {renderHighlightedSentence(currentQuestion.sentence)}
            </p>
            <p className="mb-7 text-center text-lg font-medium text-slate-500">
              Vyber správny rod, číslo a pád zvýrazneného slova
            </p>

            <div className="mb-6 w-full max-w-3xl space-y-4">
              <div className="rounded-2xl bg-white/95 p-4 shadow-sm">
                <p className="mb-3 text-lg font-extrabold uppercase tracking-wide text-sky-600">Rod</p>
                <div className="flex flex-wrap gap-2">
                  {rody.map((option) => {
                    const isSelected = selected.rod === option;
                    const isCorrect = checked && option === currentQuestion.answer.rod;
                    const isWrong = checked && option === selected.rod && selected.rod !== currentQuestion.answer.rod;

                    return (
                      <button
                        key={option}
                        type="button"
                        className={cn(
                          "min-h-12 rounded-xl border-2 px-5 py-2 text-xl font-semibold transition",
                          !checked && "border-sky-200 bg-white hover:border-sky-400 hover:bg-sky-50",
                          !checked && isSelected && "border-sky-500 bg-sky-100 text-sky-700",
                          isCorrect && "border-emerald-400 bg-emerald-100 text-emerald-700",
                          isWrong && "border-rose-300 bg-rose-100 text-rose-700",
                        )}
                        disabled={checked}
                        onClick={() => setSelected((prev) => ({ ...prev, rod: option }))}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl bg-white/95 p-4 shadow-sm">
                <p className="mb-3 text-lg font-extrabold uppercase tracking-wide text-sky-600">Číslo</p>
                <div className="flex flex-wrap gap-2">
                  {cisla.map((option) => {
                    const isSelected = selected.cislo === option;
                    const isCorrect = checked && option === currentQuestion.answer.cislo;
                    const isWrong =
                      checked && option === selected.cislo && selected.cislo !== currentQuestion.answer.cislo;

                    return (
                      <button
                        key={option}
                        type="button"
                        className={cn(
                          "min-h-12 rounded-xl border-2 px-5 py-2 text-xl font-semibold transition",
                          !checked && "border-sky-200 bg-white hover:border-sky-400 hover:bg-sky-50",
                          !checked && isSelected && "border-sky-500 bg-sky-100 text-sky-700",
                          isCorrect && "border-emerald-400 bg-emerald-100 text-emerald-700",
                          isWrong && "border-rose-300 bg-rose-100 text-rose-700",
                        )}
                        disabled={checked}
                        onClick={() => setSelected((prev) => ({ ...prev, cislo: option }))}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl bg-white/95 p-4 shadow-sm">
                <p className="mb-3 text-lg font-extrabold uppercase tracking-wide text-sky-600">Pád</p>
                <div className="flex flex-wrap gap-2">
                  {pady.map((option, index) => {
                    const isSelected = selected.pad === index;
                    const isCorrect = checked && index === currentQuestion.answer.pad;
                    const isWrong = checked && index === selected.pad && selected.pad !== currentQuestion.answer.pad;

                    return (
                      <button
                        key={option}
                        type="button"
                        className={cn(
                          "min-h-12 rounded-xl border-2 px-5 py-2 text-xl font-semibold transition",
                          !checked && "border-sky-200 bg-white hover:border-sky-400 hover:bg-sky-50",
                          !checked && isSelected && "border-sky-500 bg-sky-100 text-sky-700",
                          isCorrect && "border-emerald-400 bg-emerald-100 text-emerald-700",
                          isWrong && "border-rose-300 bg-rose-100 text-rose-700",
                        )}
                        disabled={checked}
                        onClick={() => setSelected((prev) => ({ ...prev, pad: index }))}
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
                className="min-h-14 rounded-2xl bg-sky-500 px-10 py-3 text-xl font-bold text-white transition hover:-translate-y-0.5 hover:bg-sky-600 disabled:cursor-default disabled:bg-sky-300"
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
                className="mt-2 min-h-14 rounded-2xl bg-sky-500 px-10 py-3 text-xl font-bold text-white transition hover:-translate-y-0.5 hover:bg-sky-600"
                onClick={nextQuestion}
              >
                Ďalšia úloha →
              </button>
            )}
          </main>
        </div>
      ) : (
        <section className="mx-auto w-full max-w-4xl px-4 py-12 text-center">
          <h2 className="text-4xl font-black text-sky-600">Hotovo!</h2>
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
                <span className="font-extrabold text-rose-700">{mistake.word}</span>
                <br />
                {mistake.details.map((detail, detailIdx) => (
                  <span key={`${mistake.word}-${detail.cat}-${detailIdx}`}>
                    {detail.cat}: dal/a si <span className="text-slate-500 line-through">{detail.yours}</span>, správne: {" "}
                    <span className="font-extrabold text-emerald-700">{detail.correct}</span>
                    {detailIdx < mistake.details.length - 1 ? <br /> : null}
                  </span>
                ))}
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mt-6 min-h-14 rounded-2xl bg-sky-500 px-12 py-3 text-xl font-bold text-white transition hover:-translate-y-0.5 hover:bg-sky-600"
            onClick={restart}
          >
            Skúsiť znova
          </button>
        </section>
      )}
    </div>
  );
}
