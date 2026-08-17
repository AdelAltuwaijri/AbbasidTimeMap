import { MapWorkspace } from "@/features/map/components/map-workspace";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[var(--background-primary)] px-4 py-4 text-[var(--text-primary)] sm:px-6 lg:px-8">
      <header className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-6 border-b border-[var(--border-subtle)] px-1 pb-4">
        <div>
          <p className="mb-1 text-[10px] tracking-[0.24em] text-[var(--gold-primary)]" dir="ltr">
            ABBASID TIMEMAP
          </p>
          <h1 className="text-xl font-semibold sm:text-2xl">خريطة الزمن العباسي</h1>
        </div>
        <p className="hidden max-w-md text-sm leading-6 text-[var(--text-muted)] sm:block">
          استكشف السجل التاريخي المنشور على خريطة تفاعلية.
        </p>
      </header>
      <div className="mx-auto mt-4 flex w-full max-w-[1600px] flex-1">
        <MapWorkspace />
      </div>
    </main>
  );
}
