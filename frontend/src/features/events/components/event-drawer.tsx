"use client";

import { useEffect, useId, useRef } from "react";

import type {
  EventDetail,
  EventSourceDetail,
  HistoricalDateDetail,
  NamedEventEntity,
  RelatedNavigationState,
  RelatedNavigationTarget,
} from "../types";
import { safeHttpUrl } from "../utils/safe-http-url";

type DetailState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; detail: EventDetail };

interface EventDrawerProps {
  onClose: () => void;
  onNavigateRelated: (target: RelatedNavigationTarget) => void;
  onRetry: () => void;
  relatedNavigationState: RelatedNavigationState;
  state: DetailState;
  targetSlug: string;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const DATE_PRECISION_LABELS: Record<HistoricalDateDetail["precision"], string> = {
  exact: "تاريخ دقيق",
  month: "محدد بالشهر",
  year: "سنة فقط",
  approximate: "تاريخ تقريبي",
  disputed: "تاريخ مختلف عليه",
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "موثق بدرجة عالية",
  medium: "مرجّح",
  approximate: "تقريبي",
  disputed: "مختلف عليه",
  legendary: "رواية متأخرة أو أسطورية",
  late_tradition: "رواية متأخرة",
  "legendary/late-tradition": "رواية متأخرة أو أسطورية",
};

const SUPPORT_LABELS: Record<string, string> = {
  direct: "دعم مباشر",
  chronological: "دعم للتأريخ",
  contextual: "سياق تاريخي",
};

export function EventDrawer({
  onClose,
  onNavigateRelated,
  onRetry,
  relatedNavigationState,
  state,
  targetSlug,
}: EventDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const surfaceRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const readyTitle = state.status === "ready" ? state.detail.title_ar : null;

  useEffect(() => {
    const activeElement = document.activeElement;
    returnFocusRef.current = activeElement instanceof HTMLElement ? activeElement : null;
    return () => {
      const returnTarget = returnFocusRef.current;
      if (returnTarget?.isConnected) returnTarget.focus();
    };
  }, []);

  useEffect(() => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement
      && !surfaceRef.current?.contains(activeElement)) {
      returnFocusRef.current = activeElement;
    }
    closeRef.current?.focus();
  }, [targetSlug]);

  useEffect(() => {
    const surface = surfaceRef.current;
    const activeElement = document.activeElement;
    if (surface && !surface.contains(activeElement)) {
      (closeRef.current ?? surface).focus();
    }
  }, [state.status]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const surface = surfaceRef.current;
      if (!surface) return;
      const focusable = Array.from(
        surface.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => !element.hasAttribute("disabled") && element.tabIndex !== -1);
      if (focusable.length === 0) {
        event.preventDefault();
        surface.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && (current === first || !surface.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || !surface.contains(current))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <aside
      aria-label={readyTitle ? undefined : "تفاصيل الحدث التاريخي"}
      aria-labelledby={readyTitle ? titleId : undefined}
      aria-modal="false"
      className="absolute inset-x-0 bottom-0 z-20 flex max-h-[85%] w-full flex-col overflow-hidden rounded-t-3xl border-t border-[var(--border-subtle)] bg-[color:var(--background-elevated)]/98 shadow-2xl backdrop-blur md:inset-y-0 md:start-auto md:end-0 md:max-h-none md:max-w-md md:rounded-none md:border-s md:border-t-0"
      dir="rtl"
      ref={surfaceRef}
      role="dialog"
      tabIndex={-1}
    >
      <div
        className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--border-subtle)] px-5 py-4"
        data-testid="event-drawer-header"
      >
        <p className="pt-1 text-xs tracking-wide text-[var(--gold-primary)]">
          تفاصيل الحدث
        </p>
        <button
          ref={closeRef}
          aria-label="إغلاق تفاصيل الحدث"
          className="rounded-lg border border-[var(--border-subtle)] px-3 py-1 text-lg leading-none text-[var(--text-primary)] hover:border-[var(--gold-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold-primary)]"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        data-testid="event-drawer-scroll-region"
      >
        {state.status === "loading" && (
          <p role="status" className="text-sm text-[var(--text-muted)]">
            جارٍ تحميل تفاصيل الحدث…
          </p>
        )}
        {state.status === "error" && (
          <div role="alert" className="space-y-3 text-sm text-[var(--text-primary)]">
            <p>تعذّر تحميل تفاصيل الحدث. بقيت السنة المختارة دون تغيير.</p>
            <button
              className="rounded-lg border border-[var(--gold-primary)] px-3 py-2 text-[var(--gold-primary)]"
              onClick={onRetry}
              type="button"
            >
              إعادة المحاولة
            </button>
          </div>
        )}
        {state.status === "ready" && (
          <DrawerContent
            detail={state.detail}
            onNavigateRelated={onNavigateRelated}
            relatedNavigationState={relatedNavigationState}
            titleId={titleId}
          />
        )}
      </div>
    </aside>
  );
}

function DrawerContent({
  detail,
  onNavigateRelated,
  relatedNavigationState,
  titleId,
}: {
  detail: EventDetail;
  onNavigateRelated: (target: RelatedNavigationTarget) => void;
  relatedNavigationState: RelatedNavigationState;
  titleId: string;
}) {
  const places = uniqueEntities([
    ...(detail.primary_place ? [detail.primary_place] : []),
    ...detail.related_places,
  ]);
  const people = uniqueEntities(detail.related_people);
  const states = uniqueEntities(detail.related_states);
  const sources = uniqueSources(detail.sources);
  const hasDisputedRecord = detail.confidence === "disputed"
    || detail.start_date.precision === "disputed"
    || detail.end_date?.precision === "disputed";

  return (
    <div className="space-y-7">
      <header>
        <h2 id={titleId} className="text-2xl font-semibold leading-9 text-[var(--text-primary)]">
          {detail.title_ar}
        </h2>
        {detail.title_en && (
          <p className="mt-1 text-sm text-[var(--text-muted)]" dir="ltr">
            {detail.title_en}
          </p>
        )}
        <HistoricalDatePresentation detail={detail} />
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {detail.event_type && (
            <>
              <dt className="text-[var(--text-muted)]">التصنيف</dt>
              <dd>{detail.event_type.name_ar}</dd>
            </>
          )}
          {detail.importance !== null && (
            <>
              <dt className="text-[var(--text-muted)]">الأهمية</dt>
              <dd><bdi dir="ltr">{detail.importance} من 5</bdi></dd>
            </>
          )}
        </dl>
      </header>

      {detail.summary_ar && (
        <NarrativeSection heading="ماذا حدث؟" text={detail.summary_ar} />
      )}
      {detail.causes_ar && (
        <NarrativeSection heading="لماذا حدث؟" text={detail.causes_ar} />
      )}
      {detail.consequences_ar && (
        <NarrativeSection heading="ماذا نتج عنه؟" text={detail.consequences_ar} />
      )}

      {people.length > 0 && (
        <RelatedSection heading="الشخصيات المرتبطة">
          {people.map((person) => (
            <RelatedButton
              key={person.id}
              entityKey={`person:${person.slug}`}
              nameAr={person.name_ar}
              nameEn={person.name_en}
              onNavigate={() => onNavigateRelated({
                entityType: "person",
                nameAr: person.name_ar,
                slug: person.slug,
              })}
              state={relatedNavigationState}
            />
          ))}
        </RelatedSection>
      )}

      {states.length > 0 && (
        <RelatedSection heading="الكيانات السياسية المرتبطة">
          {states.map((state) => (
            <RelatedButton
              key={state.id}
              entityKey={`state:${state.slug}`}
              nameAr={state.name_ar}
              nameEn={state.name_en}
              onNavigate={() => onNavigateRelated({
                entityType: "state",
                nameAr: state.name_ar,
                slug: state.slug,
              })}
              state={relatedNavigationState}
            />
          ))}
        </RelatedSection>
      )}

      {relatedNavigationState.status !== "idle" && (
        <p
          aria-label={relatedNavigationState.status === "loading" ? "حالة التنقل المرتبط" : undefined}
          className={`rounded-xl border px-3 py-2 text-sm ${relatedNavigationState.status === "error" ? "border-[var(--border-subtle)] text-[var(--text-primary)]" : "border-[var(--gold-primary)]/40 text-[var(--text-muted)]"}`}
          role={relatedNavigationState.status === "error" ? "alert" : "status"}
        >
          {relatedNavigationState.status === "loading"
            ? "جارٍ الانتقال إلى السياق التاريخي المرتبط…"
            : "تعذّر الانتقال إلى السياق التاريخي المرتبط. بقي هذا الحدث مفتوحًا."}
        </p>
      )}

      {places.length > 0 && (
        <section aria-labelledby={`${titleId}-places`}>
          <SectionHeading id={`${titleId}-places`}>المكان</SectionHeading>
          <ul className="mt-3 space-y-2">
            {places.map((place) => (
              <li className="rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-sm" key={place.id}>
                <span>{place.name_ar}</span>
                {place.name_en && (
                  <span className="mt-0.5 block text-xs text-[var(--text-muted)]" dir="ltr">
                    {place.name_en}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section
        aria-labelledby={`${titleId}-sources`}
        className="border-t border-[var(--gold-primary)]/40 pt-6"
      >
        <SectionHeading id={`${titleId}-sources`}>المصادر التاريخية</SectionHeading>
        <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
          المراجع التالية هي التي تدعم المعلومات التاريخية المعروضة أعلاه.
        </p>
        <ul className="mt-4 space-y-3">
          {sources.map((source) => <SourceCard key={source.id} source={source} />)}
        </ul>
      </section>

      <section aria-labelledby={`${titleId}-confidence`}>
        <SectionHeading id={`${titleId}-confidence`}>درجة الثقة</SectionHeading>
        <p className="mt-3 inline-flex rounded-full border border-[var(--border-subtle)] px-3 py-1 text-sm text-[var(--gold-primary)]">
          {confidenceLabel(detail.confidence)}
        </p>
        <p className="mt-3 text-xs leading-6 text-[var(--text-muted)]">
          تعكس درجة الثقة دقة التاريخ أو المكان أو الرواية بحسب البيانات والمصادر المتاحة، ولا تعني حكمًا ثنائيًا بالصواب أو الخطأ.
        </p>
        {hasDisputedRecord && (
          <p className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-black/10 px-3 py-2 text-sm leading-6 text-[var(--text-primary)]">
            توجد روايات أو تقديرات مختلفة حول بعض تفاصيل هذا الحدث.
          </p>
        )}
      </section>
    </div>
  );
}

function HistoricalDatePresentation({ detail }: { detail: EventDetail }) {
  return (
    <div className="mt-4 rounded-2xl border border-[var(--border-subtle)] bg-black/10 p-3">
      <p className="text-xs font-medium text-[var(--gold-primary)]">التاريخ الهجري</p>
      <div className="mt-2 space-y-2">
        <DateEndpoint date={detail.start_date} fallbackLabel={detail.date_display_ar} />
        {detail.end_date && (
          <>
            <span aria-hidden="true" className="block text-xs text-[var(--text-muted)]">—</span>
            <DateEndpoint date={detail.end_date} />
          </>
        )}
      </div>
      {(detail.gregorian_reference || detail.date_display_en) && (
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          <span>المرجع الميلادي: </span>
          <bdi dir="ltr">{detail.gregorian_reference ?? detail.date_display_en}</bdi>
        </p>
      )}
    </div>
  );
}

function DateEndpoint({ date, fallbackLabel }: {
  date: HistoricalDateDetail;
  fallbackLabel?: string;
}) {
  const label = date.display_label_ar ?? fallbackLabel ?? fallbackDateLabel(date);
  return (
    <div>
      <p className="text-sm text-[var(--text-primary)]"><bdi dir="auto">{label}</bdi></p>
      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] text-[var(--text-muted)]">
        <span className="rounded-full border border-[var(--border-subtle)] px-2 py-0.5">
          {DATE_PRECISION_LABELS[date.precision]}
        </span>
        {date.circa && (
          <span className="rounded-full border border-[var(--border-subtle)] px-2 py-0.5">
            تأريخ تقريبي
          </span>
        )}
      </div>
    </div>
  );
}

function NarrativeSection({ heading, text }: { heading: string; text: string }) {
  const id = useId();
  return (
    <section aria-labelledby={id}>
      <SectionHeading id={id}>{heading}</SectionHeading>
      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[var(--text-primary)]">
        {text}
      </p>
    </section>
  );
}

function RelatedSection({ children, heading }: {
  children: React.ReactNode;
  heading: string;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id}>
      <SectionHeading id={id}>{heading}</SectionHeading>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

function RelatedButton({
  entityKey,
  nameAr,
  nameEn,
  onNavigate,
  state,
}: {
  entityKey: string;
  nameAr: string;
  nameEn: string | null;
  onNavigate: () => void;
  state: RelatedNavigationState;
}) {
  const isBusy = state.status === "loading";
  const isCurrent = state.status !== "idle" && state.key === entityKey;
  return (
    <button
      aria-label={`الانتقال إلى سياق ${nameAr}`}
      aria-pressed={isCurrent && isBusy}
      className="rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-start text-sm text-[var(--text-primary)] hover:border-[var(--gold-primary)] disabled:cursor-wait disabled:opacity-60"
      disabled={isBusy}
      onClick={onNavigate}
      type="button"
    >
      <span>{nameAr}</span>
      {nameEn && <span className="mt-0.5 block text-[10px] text-[var(--text-muted)]" dir="ltr">{nameEn}</span>}
    </button>
  );
}

function SourceCard({ source }: { source: EventSourceDetail }) {
  const safeUrl = safeHttpUrl(source.url);
  return (
    <li className="rounded-2xl border border-[var(--border-subtle)] bg-black/10 p-4 text-sm">
      <p className="font-medium text-[var(--text-primary)]" dir="auto">{source.title}</p>
      {source.author && <p className="mt-1 text-[var(--text-muted)]" dir="auto">{source.author}</p>}
      {source.edition && (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          الطبعة: <bdi dir="auto">{source.edition}</bdi>
        </p>
      )}
      {source.publication_data && (
        <p className="mt-1 text-xs text-[var(--text-muted)]" dir="auto">
          {source.publication_data}
        </p>
      )}
      <p className="mt-3 text-xs text-[var(--gold-primary)]">
        {SUPPORT_LABELS[source.support_type] ?? "دعم تاريخي موثق"}
      </p>
      {source.citation_locator && (
        <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
          موضع الاستشهاد: <bdi dir="auto">{source.citation_locator}</bdi>
        </p>
      )}
      {source.reliability_note && (
        <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]" dir="auto">
          {source.reliability_note}
        </p>
      )}
      {safeUrl && (
        <a
          aria-label={`عرض المصدر ${source.title} (يفتح في تبويب جديد)`}
          className="mt-3 inline-block text-[var(--gold-primary)] underline underline-offset-2"
          href={safeUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          عرض المصدر <span aria-hidden="true">↗</span>
        </a>
      )}
    </li>
  );
}

function SectionHeading({ children, id }: { children: React.ReactNode; id: string }) {
  return <h3 className="font-semibold text-[var(--gold-primary)]" id={id}>{children}</h3>;
}

function confidenceLabel(confidence: string) {
  return CONFIDENCE_LABELS[confidence] ?? "تصنيف ثقة تاريخية";
}

function fallbackDateLabel(date: HistoricalDateDetail) {
  if (date.precision === "exact" && date.month !== null && date.day !== null) {
    return `${date.day}/${date.month}/${date.year}هـ`;
  }
  if (date.precision === "month" && date.month !== null) {
    return `الشهر ${date.month} من سنة ${date.year}هـ`;
  }
  if (date.precision === "approximate" || date.circa) return `حوالي ${date.year}هـ`;
  if (date.precision === "disputed") return `${date.year}هـ (مختلف عليه)`;
  return `${date.year}هـ`;
}

function uniqueEntities<T extends NamedEventEntity>(entities: T[]) {
  const seen = new Set<string>();
  return entities.filter((entity) => {
    if (seen.has(entity.id) || seen.has(`slug:${entity.slug}`)) return false;
    seen.add(entity.id);
    seen.add(`slug:${entity.slug}`);
    return true;
  });
}

function uniqueSources(sources: EventSourceDetail[]) {
  const seen = new Set<string>();
  return sources.filter((source) => {
    if (seen.has(source.id)) return false;
    seen.add(source.id);
    return true;
  });
}
