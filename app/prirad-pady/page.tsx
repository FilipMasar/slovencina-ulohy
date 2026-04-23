"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DATA_PADY } from "@/src/data/pady";
import { cn } from "@/src/lib/cn";
import { shuffleArray } from "@/src/lib/shuffle";

const padNames = ["nominatív", "genitív", "datív", "akuzatív", "lokál", "inštrumentál"];

const NUM_PADS = 6;
const NUM_SETS = 1;
const TOTAL_WORDS = NUM_SETS * 3 * NUM_PADS;
const PRAISE_MESSAGES = ["Paráda!", "Skvelá práca!", "Výborne!", "Perfektne!", "Len tak ďalej!"];
const TRY_AGAIN_MESSAGES = ["Skús to ešte raz.", "Nevadí, pokračuj ďalej.", "O chvíľu to bude úplne presné."];

type Round = {
  baseWord: string;
  words: { word: string; pad: number }[];
};

type ShuffledWord = {
  word: string;
  pad: number;
  origIdx: number;
};

type FeedbackTone = "" | "good" | "bad";

type SlotState = "correct" | "wrong";

type Mistake = {
  baseWord: string;
  word: string;
  yourPad: string;
  correctPad: string;
};

function pickRounds(): Round[] {
  const m = shuffleArray(DATA_PADY.muzsky).slice(0, NUM_SETS);
  const z = shuffleArray(DATA_PADY.zensky).slice(0, NUM_SETS);
  const s = shuffleArray(DATA_PADY.stredny).slice(0, NUM_SETS);

  const result: Round[] = [];
  for (let i = 0; i < NUM_SETS; i += 1) {
    result.push(m[i], z[i], s[i]);
  }

  return result;
}

function getStarsAndMessage(pct: number) {
  if (pct >= 90) {
    return { stars: "⭐⭐⭐", message: "Si majster pádov!" };
  }
  if (pct >= 70) {
    return { stars: "⭐⭐", message: "Veľmi dobre! Skús to ešte raz pre plný počet!" };
  }
  return { stars: "⭐", message: "Dobrý pokus! Skús to znova!" };
}

function pickRandomMessage(messages: string[]) {
  return messages[Math.floor(Math.random() * messages.length)];
}

export default function PriradPadyPage() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [assignments, setAssignments] = useState<Partial<Record<number, number>>>({});
  const [slotStates, setSlotStates] = useState<Partial<Record<number, SlotState>>>({});
  const [checked, setChecked] = useState(false);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>("");
  const [showNext, setShowNext] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [shuffledWords, setShuffledWords] = useState<ShuffledWord[]>([]);
  const [dragging, setDragging] = useState<{ origIdx: number; fromPad: number | null } | null>(null);
  const [dragOverPad, setDragOverPad] = useState<number | null>(null);
  const [selectedWord, setSelectedWord] = useState<{ origIdx: number; fromPad: number | null } | null>(
    null,
  );

  const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const round = rounds[currentRound];
  const pct = Math.round((totalCorrect / TOTAL_WORDS) * 100);
  const summary = useMemo(() => getStarsAndMessage(pct), [pct]);

  const clearFinishTimeout = () => {
    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = null;
    }
  };

  const setUpRound = (index: number, nextRounds: Round[]) => {
    const nextRound = nextRounds[index];
    const nextShuffled = shuffleArray(nextRound.words.map((word, origIdx) => ({ ...word, origIdx })));

    setCurrentRound(index);
    setShuffledWords(nextShuffled);
    setAssignments({});
    setSlotStates({});
    setChecked(false);
    setFeedback("");
    setFeedbackTone("");
    setShowNext(false);
    setDragOverPad(null);
    setDragging(null);
    setSelectedWord(null);
    setRounds(nextRounds);
  };

  const restart = () => {
    clearFinishTimeout();
    const nextRounds = pickRounds();

    setTotalCorrect(0);
    setMistakes([]);
    setShowResults(false);
    setUpRound(0, nextRounds);
  };

  useEffect(() => {
    restart();

    return () => {
      clearFinishTimeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const placeToPad = (padIdx: number, origIdx: number, fromPad: number | null) => {
    if (checked) return;

    const nextAssignments: Partial<Record<number, number>> = { ...assignments };

    if (nextAssignments[padIdx] !== undefined) {
      delete nextAssignments[padIdx];
    }

    if (fromPad !== null) {
      delete nextAssignments[fromPad];
    }

    Object.entries(nextAssignments).forEach(([pad, wordIdx]) => {
      if (wordIdx === origIdx) {
        delete nextAssignments[Number(pad)];
      }
    });

    nextAssignments[padIdx] = origIdx;
    setAssignments(nextAssignments);
  };

  const returnToPool = (padIdx: number) => {
    const nextAssignments = { ...assignments };
    delete nextAssignments[padIdx];
    setAssignments(nextAssignments);
  };

  const checkAnswer = () => {
    if (!round || checked) return;

    setChecked(true);

    const acceptableByPad: Record<number, string[]> = {};
    padNames.forEach((_, padIdx) => {
      acceptableByPad[padIdx] = round.words.filter((w) => w.pad === padIdx).map((w) => w.word);
    });

    padNames.forEach((_, padIdx) => {
      const correctTexts = acceptableByPad[padIdx];
      round.words.forEach((word) => {
        if (correctTexts.includes(word.word) && !acceptableByPad[padIdx].includes(word.word)) {
          acceptableByPad[padIdx].push(word.word);
        }
      });
    });

    let correctCount = 0;
    const nextSlotStates: Partial<Record<number, SlotState>> = {};
    const nextMistakes: Mistake[] = [];

    padNames.forEach((_, padIdx) => {
      const wordIdx = assignments[padIdx];

      if (wordIdx !== undefined && acceptableByPad[padIdx].includes(round.words[wordIdx].word)) {
        nextSlotStates[padIdx] = "correct";
        correctCount += 1;
      } else if (wordIdx !== undefined) {
        nextSlotStates[padIdx] = "wrong";
        nextMistakes.push({
          baseWord: round.baseWord,
          word: round.words[wordIdx].word,
          yourPad: padNames[padIdx],
          correctPad: padNames[round.words[wordIdx].pad],
        });
      }
    });

    setSlotStates(nextSlotStates);
    setMistakes((prev) => [...prev, ...nextMistakes]);
    setTotalCorrect((prev) => prev + correctCount);

    if (correctCount === NUM_PADS) {
      setFeedback(`${pickRandomMessage(PRAISE_MESSAGES)} Všetko správne!`);
      setFeedbackTone("good");
    } else {
      setFeedback(`${correctCount} zo ${NUM_PADS} správne. ${pickRandomMessage(TRY_AGAIN_MESSAGES)}`);
      setFeedbackTone("bad");
    }

    if (currentRound < rounds.length - 1) {
      setShowNext(true);
      return;
    }

    clearFinishTimeout();
    finishTimeoutRef.current = setTimeout(() => {
      setShowResults(true);
    }, 1200);
  };

  const nextRound = () => {
    const nextIndex = currentRound + 1;
    if (nextIndex >= rounds.length) return;
    setUpRound(nextIndex, rounds);
  };

  if (!round) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-100 to-emerald-50 font-sans text-slate-800">
      {!showResults ? (
        <div>
          <div className="mx-auto mt-4 flex max-w-5xl justify-center gap-2 px-4">
            {rounds.map((_, i) => (
              <div
                key={`dot-${i}`}
                className={cn(
                  "h-3.5 w-3.5 rounded-full transition",
                  i < currentRound && "bg-emerald-500",
                  i === currentRound && "scale-125 bg-emerald-600",
                  i > currentRound && "bg-emerald-200/80",
                )}
              />
            ))}
          </div>

          <main className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-5xl flex-col items-center justify-center px-4 py-8 sm:px-6">
            <p className="mb-2 rounded-xl bg-white/75 px-5 py-2 text-4xl font-black text-emerald-600">{round.baseWord}</p>
            <p className="mb-6 text-center text-lg font-medium text-slate-500">
              Pretiahni tvary slova k správnemu pádu
            </p>

            <div className="w-full space-y-5">
              <div
                className="flex min-h-20 flex-wrap justify-center gap-2 rounded-2xl bg-emerald-100/90 p-4"
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const fromPad = dragging?.fromPad;
                  if (fromPad !== null && fromPad !== undefined) {
                    returnToPool(fromPad);
                  }
                  setDragging(null);
                  setDragOverPad(null);
                  setSelectedWord(null);
                }}
                onClick={() => {
                  if (!selectedWord || checked) return;
                  if (selectedWord.fromPad !== null) {
                    returnToPool(selectedWord.fromPad);
                    setSelectedWord(null);
                  }
                }}
              >
                {shuffledWords.map((item) => {
                  const isPlaced = Object.values(assignments).includes(item.origIdx);
                  const isSelected = selectedWord?.origIdx === item.origIdx && selectedWord?.fromPad === null;

                  return (
                    <div
                      key={`${item.word}-${item.origIdx}`}
                      className={cn(
                        "min-h-12 rounded-xl border-2 bg-white px-5 py-2 text-2xl font-semibold text-slate-700",
                        "border-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-50",
                        isPlaced && "hidden",
                        isSelected && "ring-4 ring-emerald-300",
                      )}
                      draggable={!checked}
                      onDragStart={() => {
                        if (checked) return;
                        setDragging({ origIdx: item.origIdx, fromPad: null });
                        setSelectedWord(null);
                      }}
                      onDragEnd={() => {
                        setDragging(null);
                        setDragOverPad(null);
                      }}
                      onClick={() => {
                        if (checked) return;
                        setSelectedWord({ origIdx: item.origIdx, fromPad: null });
                      }}
                    >
                      {item.word}
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                {padNames.map((name, padIdx) => {
                  const assignedWordIdx = assignments[padIdx];
                  const assignedWord =
                    assignedWordIdx !== undefined ? round.words[assignedWordIdx].word : undefined;

                  return (
                    <div key={name} className="flex flex-col gap-2 rounded-xl p-1 sm:flex-row sm:items-center sm:gap-3">
                      <span className="text-xl font-extrabold text-emerald-600 sm:min-w-32 sm:text-right">{name}</span>
                      <div
                        className={cn(
                          "flex min-h-14 flex-1 items-center rounded-xl border-2 border-dashed px-3",
                          "border-emerald-300 bg-white",
                          dragOverPad === padIdx && !checked && "border-emerald-500 bg-emerald-100",
                          slotStates[padIdx] === "correct" && "border-solid border-emerald-500 bg-emerald-100",
                          slotStates[padIdx] === "wrong" && "border-solid border-rose-300 bg-rose-100",
                        )}
                        onDragOver={(e) => {
                          if (checked) return;
                          e.preventDefault();
                          setDragOverPad(padIdx);
                        }}
                        onDragLeave={() => {
                          if (dragOverPad === padIdx) {
                            setDragOverPad(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (!dragging || checked) return;

                          placeToPad(padIdx, dragging.origIdx, dragging.fromPad);
                          setDragOverPad(null);
                          setDragging(null);
                          setSelectedWord(null);
                        }}
                        onClick={() => {
                          if (!selectedWord || checked) return;
                          placeToPad(padIdx, selectedWord.origIdx, selectedWord.fromPad);
                          setSelectedWord(null);
                        }}
                      >
                        {assignedWord !== undefined && (
                          <span
                            className={cn(
                              "min-h-10 rounded-lg px-4 py-1 text-xl font-bold",
                              slotStates[padIdx] === "wrong" && "bg-rose-200 text-rose-700",
                              slotStates[padIdx] !== "wrong" && "bg-emerald-200 text-emerald-900",
                              selectedWord?.origIdx === assignedWordIdx &&
                                selectedWord?.fromPad === padIdx &&
                                "ring-4 ring-emerald-300",
                            )}
                            draggable={!checked}
                            onDoubleClick={() => {
                              if (!checked) {
                                returnToPool(padIdx);
                              }
                            }}
                            onDragStart={() => {
                              if (checked || assignedWordIdx === undefined) return;
                              setDragging({ origIdx: assignedWordIdx, fromPad: padIdx });
                              setSelectedWord(null);
                            }}
                            onDragEnd={() => {
                              setDragging(null);
                              setDragOverPad(null);
                            }}
                            onClick={() => {
                              if (checked || assignedWordIdx === undefined) return;
                              setSelectedWord({ origIdx: assignedWordIdx, fromPad: padIdx });
                            }}
                          >
                            {assignedWord}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {!checked && (
              <button
                type="button"
                className="mt-5 min-h-14 rounded-2xl bg-emerald-500 px-10 py-3 text-xl font-bold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600 disabled:cursor-default disabled:bg-emerald-300"
                disabled={Object.keys(assignments).length < NUM_PADS}
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
                className="mt-2 min-h-14 rounded-2xl bg-emerald-500 px-10 py-3 text-xl font-bold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600"
                onClick={nextRound}
              >
                Ďalšia sada →
              </button>
            )}
          </main>
        </div>
      ) : (
        <section className="mx-auto w-full max-w-4xl px-4 py-12 text-center">
          <h2 className="text-4xl font-black text-emerald-600">Hotovo!</h2>
          <p className="mt-3 text-5xl">{summary.stars}</p>
          <p className="mt-2 text-5xl font-black text-emerald-600">
            {totalCorrect} / {TOTAL_WORDS}
          </p>
          <p className="mt-2 text-xl font-semibold text-slate-600">{summary.message}</p>

          <div className="mx-auto mt-8 max-w-3xl text-left">
            {mistakes.length > 0 && (
              <p className="mb-3 text-center text-lg font-extrabold text-rose-600">Tvoje chyby:</p>
            )}

            {mistakes.map((mistake, idx) => (
              <div key={`mistake-${idx}`} className="mb-2 rounded-xl bg-rose-100 px-4 py-3 text-lg leading-8">
                <span className="font-extrabold text-rose-700">{mistake.word}</span> - dal/a si:{" "}
                <span className="text-slate-500 line-through">{mistake.yourPad}</span>, správne:{" "}
                <span className="font-extrabold text-emerald-700">{mistake.correctPad}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mt-6 min-h-14 rounded-2xl bg-emerald-500 px-12 py-3 text-xl font-bold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600"
            onClick={restart}
          >
            Skúsiť znova
          </button>
        </section>
      )}
    </div>
  );
}
