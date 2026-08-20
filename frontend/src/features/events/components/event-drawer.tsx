"use client";

import { useEffect, useRef } from "react";

import type { EventDetail } from "../types";

type DetailState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; detail: EventDetail };

export function EventDrawer({ onClose, onRetry, state }: {
  onClose: () => void;
  onRetry: () => void;
  state: DetailState;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { closeRef.current?.focus(); }, []);

  return (
    <aside
      aria-label="تفاصيل الحدث التاريخي"
      className="absolute inset-y-0 end-0 z-20 flex w-full max-w-md flex-col overflow-y-auto border-s border-[var(--border-subtle)] bg-[color:var(--background-elevated)]/98 p-5 shadow-2xl backdrop-blur"
      dir="rtl"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <p className="text-xs tracking-wide text-[var(--gold-primary)]">تفاصيل الحدث</p>
        <button ref={closeRef} aria-label="إغلاق تفاصيل الحدث" className="rounded-lg border border-[var(--border-subtle)] px-3 py-1 text-lg text-[var(--text-primary)] hover:border-[var(--gold-primary)]" onClick={onClose} type="button">×</button>
      </div>
      {state.status === "loading" && <p role="status" className="text-sm text-[var(--text-muted)]">جارٍ تحميل تفاصيل الحدث…</p>}
      {state.status === "error" && (
        <div role="alert" className="space-y-3 text-sm text-[var(--text-primary)]">
          <p>تعذّر تحميل تفاصيل الحدث. بقيت السنة المختارة دون تغيير.</p>
          <button className="rounded-lg border border-[var(--gold-primary)] px-3 py-2 text-[var(--gold-primary)]" onClick={onRetry} type="button">إعادة المحاولة</button>
        </div>
      )}
      {state.status === "ready" && <DrawerContent detail={state.detail} />}
    </aside>
  );
}

function DrawerContent({ detail }: { detail: EventDetail }) {
  return <div className="space-y-6">
    <header>
      <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{detail.title_ar}</h2>
      {detail.title_en && <p className="mt-1 text-sm text-[var(--text-muted)]" dir="ltr">{detail.title_en}</p>}
    </header>
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
      <dt className="text-[var(--text-muted)]">التاريخ</dt><dd className="text-[var(--text-primary)]">{detail.date_display_ar}</dd>
      {detail.gregorian_reference && <><dt className="text-[var(--text-muted)]">مرجع ميلادي</dt><dd dir="ltr">{detail.gregorian_reference}</dd></>}
      {detail.primary_place && <><dt className="text-[var(--text-muted)]">المكان</dt><dd>{detail.primary_place.name_ar}</dd></>}
      {detail.event_type && <><dt className="text-[var(--text-muted)]">التصنيف</dt><dd>{detail.event_type.name_ar}</dd></>}
      <dt className="text-[var(--text-muted)]">درجة الثقة</dt><dd>{confidenceLabel(detail.confidence)}</dd>
    </dl>
    {detail.summary_ar && <section><h3 className="mb-2 font-semibold">الملخص التاريخي</h3><p className="text-sm leading-7 text-[var(--text-primary)]">{detail.summary_ar}</p></section>}
    <section aria-labelledby="sources-heading">
      <h3 id="sources-heading" className="mb-3 font-semibold text-[var(--gold-primary)]">المصادر التاريخية</h3>
      <ul className="space-y-3">
        {detail.sources.map((source) => <li key={`${source.title}-${source.url}`} className="rounded-xl border border-[var(--border-subtle)] p-3 text-sm">
          <p className="font-medium" dir="ltr">{source.title}</p>
          {source.author && <p className="mt-1 text-[var(--text-muted)]" dir="ltr">{source.author}</p>}
          {source.publication_data && <p className="mt-1 text-xs text-[var(--text-muted)]" dir="ltr">{source.publication_data}</p>}
          {source.citation_locator && <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]" dir="ltr">{source.citation_locator}</p>}
          {source.url && <a className="mt-2 inline-block text-[var(--gold-primary)] underline" href={source.url} rel="noreferrer" target="_blank">عرض المصدر</a>}
        </li>)}
      </ul>
    </section>
  </div>;
}

function confidenceLabel(confidence: string | null) {
  if (confidence === "high") return "موثق بدرجة عالية";
  if (confidence === "medium") return "مرجّح";
  if (confidence === "disputed") return "مختلف عليه";
  return confidence ?? "غير محددة";
}
