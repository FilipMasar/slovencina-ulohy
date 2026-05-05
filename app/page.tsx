"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Exercise = {
  href: string;
  title: string;
  description: string;
  color: string;
};

const QR_SIZE = 360;

const exercises: Exercise[] = [
  {
    href: "/podstatne-mena",
    title: "Nájdi podstatné mená",
    description: "Klikni na slová, ktoré sú podstatné mená.",
    color: "bg-amber-100/80 border-amber-300 hover:border-amber-400",
  },
  {
    href: "/prirad-pady",
    title: "Priraď k správnemu pádu",
    description: "Pretiahni alebo kliknutím priraď tvary slova k pádom.",
    color: "bg-emerald-100/80 border-emerald-300 hover:border-emerald-400",
  },
  {
    href: "/rod-cislo-pad",
    title: "Rod, číslo a pád",
    description: "Vyber správny rod, číslo a pád zvýrazneného slova.",
    color: "bg-sky-100/80 border-sky-300 hover:border-sky-400",
  },
  {
    href: "/cislovky",
    title: "Číslovky: základné a radové",
    description: "Rozhodni, či je zvýraznená číslovka základná alebo radová.",
    color: "bg-violet-100/80 border-violet-300 hover:border-violet-400",
  },
];

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

export default function Home() {
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [runtimeOrigin, setRuntimeOrigin] = useState("");

  const appOriginFromEnv = process.env.NEXT_PUBLIC_APP_URL
    ? trimTrailingSlash(process.env.NEXT_PUBLIC_APP_URL)
    : "";
  const appOrigin = useMemo(() => {
    if (appOriginFromEnv) return appOriginFromEnv;
    if (!runtimeOrigin) return "";
    return trimTrailingSlash(runtimeOrigin);
  }, [appOriginFromEnv, runtimeOrigin]);

  const activeExercise = exercises[activeExerciseIndex];
  const activeExerciseUrl = `${appOrigin}${activeExercise.href}`;

  const qrImageUrl = useMemo(() => {
    if (!activeExerciseUrl) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=${QR_SIZE}x${QR_SIZE}&margin=16&data=${encodeURIComponent(activeExerciseUrl)}`;
  }, [activeExerciseUrl]);

  useEffect(() => {
    setRuntimeOrigin(window.location.origin);
  }, []);

  const showPreviousQr = () => {
    setActiveExerciseIndex((prev) => (prev - 1 + exercises.length) % exercises.length);
  };

  const showNextQr = () => {
    setActiveExerciseIndex((prev) => (prev + 1) % exercises.length);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 via-emerald-50 to-amber-100 px-4 py-10 font-sans text-slate-800">
      <section className="mx-auto w-full max-w-5xl rounded-3xl bg-white/95 p-6 shadow-xl sm:p-10">
        <div className="relative">
          <button
            type="button"
            className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 sm:absolute sm:right-0 sm:top-0 sm:mt-0 sm:w-auto sm:text-base"
            onClick={() => setShowQrModal(true)}
          >
            Zobraziť QR kódy
          </button>
          <h1 className="text-center text-4xl font-black tracking-tight text-sky-900 sm:text-5xl">
            Slovenčina - cvičenia
          </h1>
        </div>
        <p className="mt-3 text-center text-lg font-medium text-slate-600 sm:text-xl">
          Vyber si cvičenie a poďme trénovať. Každý krok sa počíta.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {exercises.map((exercise) => (
            <Link
              key={exercise.href}
              href={exercise.href}
              className={`rounded-2xl border-2 p-6 transition-transform duration-150 hover:-translate-y-1 hover:shadow-md ${exercise.color}`}
            >
              <h2 className="text-2xl font-bold text-slate-900">{exercise.title}</h2>
              <p className="mt-3 text-lg leading-relaxed text-slate-700">{exercise.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {showQrModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4 backdrop-blur-[2px]"
          onClick={() => setShowQrModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-modal-title"
            className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.55)] sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 h-9 w-9 rounded-full text-3xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              onClick={() => setShowQrModal(false)}
              aria-label="Zavrieť QR okno"
            >
              ×
            </button>

            <div className="flex items-center justify-between gap-3 pr-9">
              <button
                type="button"
                className="h-12 w-12 rounded-2xl border border-slate-300 bg-white text-2xl font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                onClick={showPreviousQr}
                aria-label="Predošlé cvičenie"
              >
                ←
              </button>
              <h2 id="qr-modal-title" className="text-center text-3xl font-black text-slate-900">
                {activeExercise.title}
              </h2>
              <button
                type="button"
                className="h-12 w-12 rounded-2xl border border-slate-300 bg-white text-2xl font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                onClick={showNextQr}
                aria-label="Ďalšie cvičenie"
              >
                →
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 sm:p-6">
              <img
                src={qrImageUrl}
                alt={`QR kód pre cvičenie ${activeExercise.title}`}
                className="mx-auto aspect-square w-full max-w-[420px] rounded-xl bg-white p-2 ring-1 ring-slate-200"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
