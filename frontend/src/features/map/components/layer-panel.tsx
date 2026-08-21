interface LayerPanelProps {
  boundariesVisible: boolean;
  eventsVisible: boolean;
  onToggleBoundaries: () => void;
  onToggleEvents: () => void;
}

export function LayerPanel({
  boundariesVisible,
  eventsVisible,
  onToggleBoundaries,
  onToggleEvents,
}: LayerPanelProps) {
  return (
    <aside
      aria-label="طبقات الخريطة"
      className="absolute end-4 top-4 z-10 w-52 rounded-2xl border border-[var(--border-subtle)] bg-[color:var(--background-elevated)]/95 p-4 shadow-2xl backdrop-blur"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">الطبقات</h2>
        <span className="text-[10px] tracking-widest text-[var(--text-muted)]" dir="ltr">
          MAP LAYERS
        </span>
      </div>
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-black/15 px-3 py-2.5">
        <span className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
          <span aria-hidden className="h-3 w-3 rotate-45 border border-[var(--gold-primary)] bg-[var(--event-political)]" />
          الأحداث
        </span>
        <input
          aria-label="إظهار الأحداث"
          checked={eventsVisible}
          className="h-4 w-4 accent-[var(--gold-primary)]"
          onChange={onToggleEvents}
          type="checkbox"
        />
      </label>
      <label className="mt-2 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-black/15 px-3 py-2.5">
        <span className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
          <span aria-hidden className="h-3 w-3 rounded-sm border border-[var(--gold-primary)] bg-[var(--event-political)]/30" />
          الحدود السياسية التاريخية
        </span>
        <input
          aria-label="إظهار الحدود السياسية التاريخية"
          checked={boundariesVisible}
          className="h-4 w-4 accent-[var(--gold-primary)]"
          onChange={onToggleBoundaries}
          type="checkbox"
        />
      </label>
      <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">
        خريطة الأساس مرجع جغرافي طبيعي محايد؛ لا تعرض أسماء أو حدودًا سياسية حديثة.
      </p>
    </aside>
  );
}
