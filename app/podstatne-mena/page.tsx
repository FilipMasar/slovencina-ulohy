"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DATA_PODSTATNE_MENA } from "@/src/data/podstatne-mena";
import { cn } from "@/src/lib/cn";
import { shuffleArray } from "@/src/lib/shuffle";

const NUM_SENTENCES = 5;
const PRAISE_MESSAGES = ["Super práca!", "Perfektne!", "Skvelé!", "Výborne!", "Len tak ďalej!"];
const TRY_AGAIN_MESSAGES = ["Skús to ešte raz.", "Nevadí, ideš ďalej.", "Poďme na ďalšie slovo."];

type Sentence = (typeof DATA_PODSTATNE_MENA)[number];
type FeedbackTone = "" | "good" | "bad" | "complete";
type WordState = "idle" | "correct" | "wrongPick" | "missed";

type SentenceResult = {
  words: string[];
  nouns: number[];
  clicked: number[];
};

function pickSentences(): Sentence[] {
  return shuffleArray(DATA_PODSTATNE_MENA).slice(0, NUM_SENTENCES);
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

export default function PodstatneMenaPage() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [totalNouns, setTotalNouns] = useState(0);
  const [clicksLeft, setClicksLeft] = useState(0);
  const [wordStates, setWordStates] = useState<WordState[]>([]);
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>("");
  const [showNext, setShowNext] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<SentenceResult[]>([]);

  const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSentence = sentences[currentIndex];

  const pct = totalNouns > 0 ? Math.round((score / totalNouns) * 100) : 0;
  const summary = useMemo(() => getStarsAndMessage(pct), [pct]);

  const hasErrors = useMemo(
    () =>
      results.some(
        (result) =>
          !result.nouns.every((idx) => result.clicked.includes(idx)) ||
          result.clicked.some((idx) => !result.nouns.includes(idx)),
      ),
    [results],
  );

  const clearFinishTimeout = () => {
    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = null;
    }
  };

  const setUpRound = (index: number, nextSentences: Sentence[], baseResults: SentenceResult[]) => {
    const sentence = nextSentences[index];
    const nextResults = [...baseResults];
    nextResults[index] = { words: sentence.words, nouns: sentence.nouns, clicked: [] };

    setCurrentIndex(index);
    setClicksLeft(sentence.nouns.length);
    setWordStates(Array(sentence.words.length).fill("idle"));
    setFeedback("");
    setFeedbackTone("");
    setShowNext(false);
    setResults(nextResults);
  };

  const restart = () => {
    clearFinishTimeout();
    const nextSentences = pickSentences();
    const nextTotalNouns = nextSentences.reduce((sum, sentence) => sum + sentence.nouns.length, 0);

    setSentences(nextSentences);
    setScore(0);
    setTotalNouns(nextTotalNouns);
    setShowResults(false);
    setUpRound(0, nextSentences, []);
  };

  useEffect(() => {
    restart();

    return () => {
      clearFinishTimeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finishSentence = (result: SentenceResult, baseWordStates: WordState[]) => {
    if (!currentSentence) return;

    const nextWordStates = [...baseWordStates];
    currentSentence.nouns.forEach((idx) => {
      if (!result.clicked.includes(idx)) {
        nextWordStates[idx] = "missed";
      }
    });
    setWordStates(nextWordStates);

    const allCorrect = currentSentence.nouns.every((idx) => result.clicked.includes(idx));
    if (allCorrect) {
      setFeedback(`${pickRandomMessage(PRAISE_MESSAGES)} Všetky správne!`);
      setFeedbackTone("complete");
    } else {
      setFeedback(`Dobrý pokus. ${pickRandomMessage(TRY_AGAIN_MESSAGES)}`);
      setFeedbackTone("bad");
    }

    if (currentIndex < sentences.length - 1) {
      setShowNext(true);
      return;
    }

    clearFinishTimeout();
    finishTimeoutRef.current = setTimeout(() => {
      setShowResults(true);
    }, 1200);
  };

  const handleWordClick = (index: number) => {
    if (!currentSentence || clicksLeft <= 0 || wordStates[index] !== "idle") return;

    const roundResult = results[currentIndex] ?? {
      words: currentSentence.words,
      nouns: currentSentence.nouns,
      clicked: [],
    };

    const nextResult: SentenceResult = {
      ...roundResult,
      clicked: [...roundResult.clicked, index],
    };

    const nextWordStates = [...wordStates];
    const nextClicksLeft = clicksLeft - 1;

    setResults((prev) => {
      const next = [...prev];
      next[currentIndex] = nextResult;
      return next;
    });
    setClicksLeft(nextClicksLeft);

    if (currentSentence.nouns.includes(index)) {
      nextWordStates[index] = "correct";
      setScore((prev) => prev + 1);
      setFeedback(`Správne! ${pickRandomMessage(PRAISE_MESSAGES)}`);
      setFeedbackTone("good");
    } else {
      nextWordStates[index] = "wrongPick";
      setFeedback("Skús ešte raz, toto nie je podstatné meno.");
      setFeedbackTone("bad");
    }

    setWordStates(nextWordStates);

    if (nextClicksLeft === 0) {
      finishSentence(nextResult, nextWordStates);
    }
  };

  const nextSentence = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= sentences.length) return;
    setUpRound(nextIndex, sentences, results);
  };

  if (!currentSentence) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 to-amber-50 font-sans text-slate-800">
      {!showResults ? (
        <div>
          <div className="mx-auto mt-4 flex max-w-5xl justify-center gap-2 px-4">
            {sentences.map((_, i) => (
              <div
                key={`dot-${i}`}
                className={cn(
                  "h-3.5 w-3.5 rounded-full transition",
                  i < currentIndex && "bg-emerald-500",
                  i === currentIndex && "scale-125 bg-orange-400",
                  i > currentIndex && "bg-orange-200/80",
                )}
              />
            ))}
          </div>

          <main className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-5xl flex-col items-center justify-center px-4 py-8 sm:px-6">
            <p className="mb-2 rounded-xl bg-white/70 px-4 py-2 text-center text-lg font-semibold text-slate-500 sm:text-xl">
              Klikni na slová, ktoré sú podstatné mená
            </p>
            <p className="mb-7 text-center text-base font-medium text-orange-700">Každá správna voľba je bod navyše.</p>

            <div className="mb-8 flex w-full flex-wrap justify-center gap-3">
              {currentSentence.words.map((word, index) => {
                const state = wordStates[index];
                return (
                  <button
                    key={`${word}-${index}`}
                    type="button"
                    className={cn(
                      "min-h-16 min-w-28 rounded-2xl border-4 bg-white px-5 py-3 text-2xl font-bold text-slate-700 transition sm:min-w-32 sm:px-6",
                      state === "idle" &&
                        "border-orange-300 hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-50",
                      state === "correct" && "cursor-default border-emerald-400 bg-emerald-100 text-emerald-700",
                      state === "wrongPick" && "cursor-default border-rose-300 bg-rose-100 text-rose-700",
                      state === "missed" && "cursor-default border-amber-300 bg-amber-100 text-amber-800",
                    )}
                    onClick={() => handleWordClick(index)}
                  >
                    {word}
                  </button>
                );
              })}
            </div>

            <div
              className={cn(
                "min-h-12 text-center text-2xl font-extrabold",
                feedbackTone === "good" && "text-emerald-600",
                feedbackTone === "bad" && "text-rose-600",
                feedbackTone === "complete" && "text-orange-600",
              )}
            >
              {feedback}
            </div>

            {showNext && (
              <button
                type="button"
                className="mt-3 min-h-14 rounded-2xl bg-orange-400 px-10 py-3 text-xl font-bold text-white transition hover:-translate-y-0.5 hover:bg-orange-500"
                onClick={nextSentence}
              >
                Ďalšia veta →
              </button>
            )}
          </main>
        </div>
      ) : (
        <section className="mx-auto w-full max-w-4xl px-4 py-12 text-center">
          <h2 className="text-4xl font-black text-orange-500">Hotovo!</h2>
          <p className="mt-3 text-5xl">{summary.stars}</p>
          <p className="mt-2 text-5xl font-black text-emerald-600">
            {score} / {totalNouns}
          </p>
          <p className="mt-2 text-xl font-semibold text-slate-600">{summary.message}</p>

          <div className="mx-auto mt-8 max-w-3xl text-left">
            {hasErrors && (
              <p className="mb-3 text-center text-lg font-extrabold text-rose-600">Pozri si svoje odpovede:</p>
            )}

            {results.map((result, resultIdx) => {
              const isAllCorrect =
                result.nouns.every((idx) => result.clicked.includes(idx)) &&
                result.clicked.every((idx) => result.nouns.includes(idx));

              return (
                <div
                  key={`review-${resultIdx}`}
                  className={cn(
                    "mb-2 rounded-xl px-4 py-3 text-lg leading-9",
                    isAllCorrect ? "bg-emerald-100" : "bg-rose-100",
                  )}
                >
                  {result.words.map((word, wordIdx) => {
                    const isNoun = result.nouns.includes(wordIdx);
                    const wasClicked = result.clicked.includes(wordIdx);

                    if (isNoun && wasClicked) {
                      return (
                        <span key={`${word}-${wordIdx}`} className="font-extrabold text-emerald-700 underline decoration-2">
                          {word}{" "}
                        </span>
                      );
                    }

                    if (isNoun && !wasClicked) {
                      return (
                        <span
                          key={`${word}-${wordIdx}`}
                          className="font-extrabold text-rose-700 underline decoration-dashed decoration-2"
                        >
                          {word}{" "}
                        </span>
                      );
                    }

                    if (!isNoun && wasClicked) {
                      return (
                        <span key={`${word}-${wordIdx}`} className="text-rose-700 line-through">
                          {word}{" "}
                        </span>
                      );
                    }

                    return <span key={`${word}-${wordIdx}`}>{word} </span>;
                  })}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="mt-6 min-h-14 rounded-2xl bg-orange-400 px-12 py-3 text-xl font-bold text-white transition hover:-translate-y-0.5 hover:bg-orange-500"
            onClick={restart}
          >
            Skúsiť znova
          </button>
        </section>
      )}
    </div>
  );
}
