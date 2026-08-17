import { BackendStatus } from "@/components/backend-status";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16">
      <section className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="mb-4 text-sm font-medium tracking-wide text-slate-500" dir="ltr">
          PROJECT FOUNDATION
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
          Abbasid TimeMap
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-700" dir="rtl">
          منصة تفاعلية لاستكشاف التاريخ العباسي عبر الزمن والخريطة.
        </p>
        <div className="mt-8 border-t border-slate-200 pt-5">
          <BackendStatus />
        </div>
      </section>
    </main>
  );
}
