import type { BoundaryFeatureCollection } from "../types";

interface BoundaryDetailsProps {
  boundaries: BoundaryFeatureCollection;
}

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "ثقة عالية",
  medium: "ثقة متوسطة",
  approximate: "تقريبي",
  disputed: "مختلف عليه",
};

const PRECISION_LABELS: Record<string, string> = {
  exact: "دقة مكانية عالية",
  approximate: "نطاق مكاني تقريبي",
  disputed: "نطاق مكاني مختلف عليه",
};

export function BoundaryDetails({ boundaries }: BoundaryDetailsProps) {
  if (boundaries.features.length === 0) return null;

  return (
    <aside
      aria-label="بيانات إعادة بناء الحدود السياسية"
      className="absolute start-4 top-4 z-10 max-h-64 w-72 max-w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border border-[var(--border-subtle)] bg-[color:var(--background-elevated)]/95 p-4 shadow-2xl backdrop-blur"
      dir="rtl"
    >
      <p className="text-[10px] font-semibold tracking-wide text-[var(--gold-primary)]">
        إعادة بناء تاريخية تقريبية
      </p>
      <div className="mt-2 space-y-3">
        {boundaries.features.map(({ id, properties }) => (
          <section className="border-t border-[var(--border-subtle)] pt-3 first:border-0 first:pt-0" key={id}>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {properties.state_name_ar}
            </h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              الفترة: <bdi dir="ltr">{properties.valid_from_hijri}–{properties.valid_to_hijri} هـ</bdi>
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {CONFIDENCE_LABELS[properties.confidence] ?? properties.confidence}
              {" · "}
              {PRECISION_LABELS[properties.spatial_precision] ?? properties.spatial_precision}
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--text-primary)]">
              {properties.reconstruction_note_ar}
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              المصدر الرئيس: {properties.primary_source_url ? (
                <a
                  className="text-[var(--gold-primary)] underline underline-offset-2"
                  href={properties.primary_source_url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {properties.primary_source_title}
                </a>
              ) : properties.primary_source_title}
              {" · "}عدد المصادر: <bdi dir="ltr">{properties.source_count}</bdi>
            </p>
          </section>
        ))}
      </div>
    </aside>
  );
}
