import Link from "next/link";

const exercises = [
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
];

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 via-emerald-50 to-amber-100 px-4 py-10 font-sans text-slate-800">
      <section className="mx-auto w-full max-w-5xl rounded-3xl bg-white/95 p-6 shadow-xl sm:p-10">
        <h1 className="text-center text-4xl font-black tracking-tight text-sky-900 sm:text-5xl">
          Slovenčina - cvičenia
        </h1>
        <p className="mt-3 text-center text-lg font-medium text-slate-600 sm:text-xl">
          Vyber si cvičenie a poďme trénovať. Každý krok sa počíta.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
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
    </main>
  );
}
