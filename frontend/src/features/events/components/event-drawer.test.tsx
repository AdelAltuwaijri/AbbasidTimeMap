import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { EventDetail, RelatedNavigationTarget } from "../types";
import { EventDrawer } from "./event-drawer";

const IDS = {
  event: "00000000-0000-0000-0000-000000000001",
  person: "00000000-0000-0000-0000-000000000002",
  place: "00000000-0000-0000-0000-000000000003",
  state: "00000000-0000-0000-0000-000000000004",
  source: "00000000-0000-0000-0000-000000000005",
};

const DETAIL = {
  id: IDS.event,
  slug: "al-muqanna-revolt",
  title_ar: "بداية حركة المقنع وأصحاب البياض",
  title_en: "Revolt of al-Muqannaʿ and the White-Clad",
  start_date: {
    calendar: "hijri",
    year: 159,
    month: null,
    day: null,
    precision: "approximate",
    circa: true,
    display_label_ar: "نحو 159هـ",
    display_label_en: "c. 775–776 CE",
  },
  end_date: {
    calendar: "hijri",
    year: 163,
    month: null,
    day: null,
    precision: "disputed",
    circa: true,
    display_label_ar: "إلى 163هـ أو بعده بقليل",
    display_label_en: "to 780 CE or later",
  },
  date_display_ar: "نحو 159هـ",
  date_display_en: "c. 775–776 CE",
  year_start_hijri: 159,
  year_end_hijri: 163,
  gregorian_reference: "c. 775–776 CE",
  event_type: { code: "revolt", name_ar: "ثورة", name_en: "Revolt" },
  summary_ar: "ملخص تاريخي موثق.",
  summary_en: null,
  causes_ar: "سبب تاريخي موثق.",
  consequences_ar: "نتيجة تاريخية موثقة.",
  importance: 4,
  confidence: "disputed",
  primary_place: {
    id: IDS.place,
    slug: "transoxiana",
    name_ar: "ما وراء النهر",
    name_en: "Transoxiana",
  },
  related_people: [{
    id: IDS.person,
    slug: "al-muqanna",
    name_ar: "المقنع الخراساني",
    name_en: "al-Muqannaʿ",
    role_code: "movement_leader",
  }],
  related_places: [{
    id: "00000000-0000-0000-0000-000000000006",
    slug: "transoxiana-region",
    name_ar: "إقليم ما وراء النهر",
    name_en: "Transoxiana region",
    relation_type: "movement_region",
  }],
  related_states: [{
    id: IDS.state,
    slug: "khurramiyya-movements",
    name_ar: "الحركات الخرمية وأصحاب البياض",
    name_en: "Khurramiyya and White-Clad movements",
    relation_type: "rebel_movement",
  }],
  sources: [{
    id: IDS.source,
    source_type: "modern_academic",
    title: "A scholarly source",
    author: "Historian",
    edition: "Second edition",
    publication_data: "Academic Press, 2020",
    url: "https://example.test/source",
    citation_locator: "pp. 10–12",
    support_type: "direct",
    reliability_note: "Peer-reviewed synthesis.",
  }],
} satisfies EventDetail;

function renderDrawer({
  detail = DETAIL,
  onClose = vi.fn(),
  onNavigateRelated = vi.fn(),
  relatedNavigationState = { status: "idle" } as const,
}: {
  detail?: EventDetail;
  onClose?: () => void;
  onNavigateRelated?: (target: RelatedNavigationTarget) => void;
  relatedNavigationState?:
    | { status: "idle" }
    | { status: "loading"; key: string }
    | { status: "error"; key: string };
} = {}) {
  return render(
    <EventDrawer
      onClose={onClose}
      onNavigateRelated={onNavigateRelated}
      onRetry={vi.fn()}
      relatedNavigationState={relatedNavigationState}
      state={{ status: "ready", detail }}
      targetSlug={detail.slug}
    />,
  );
}

describe("EventDrawer", () => {
  afterEach(cleanup);

  it("renders every populated historical section with uncertainty and no raw relation codes", () => {
    renderDrawer();

    expect(screen.getByRole("dialog", { name: "بداية حركة المقنع وأصحاب البياض" })).toHaveAttribute("dir", "rtl");
    expect(screen.getByRole("heading", { name: "ماذا حدث؟" })).toBeInTheDocument();
    expect(screen.getByText(DETAIL.summary_ar!)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "لماذا حدث؟" })).toBeInTheDocument();
    expect(screen.getByText(DETAIL.causes_ar!)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ماذا نتج عنه؟" })).toBeInTheDocument();
    expect(screen.getByText(DETAIL.consequences_ar!)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "الشخصيات المرتبطة" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "الكيانات السياسية المرتبطة" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "المكان" })).toBeInTheDocument();
    expect(screen.getByText("ما وراء النهر")).toBeInTheDocument();
    expect(screen.getByText("إقليم ما وراء النهر")).toBeInTheDocument();
    expect(screen.queryByText("movement_leader")).not.toBeInTheDocument();
    expect(screen.queryByText("rebel_movement")).not.toBeInTheDocument();
    expect(screen.getByText("4 من 5")).toBeInTheDocument();
    expect(screen.getByText("مختلف عليه")).toBeInTheDocument();
    expect(screen.getByText(/دقة التاريخ أو المكان أو الرواية/)).toBeInTheDocument();
    expect(screen.getByText("توجد روايات أو تقديرات مختلفة حول بعض تفاصيل هذا الحدث.")).toBeInTheDocument();
  });

  it("preserves stored range labels and exposes endpoint-specific uncertainty", () => {
    renderDrawer();

    expect(screen.getByText("نحو 159هـ")).toBeInTheDocument();
    expect(screen.getByText("إلى 163هـ أو بعده بقليل")).toBeInTheDocument();
    expect(screen.getByText("تاريخ تقريبي")).toBeInTheDocument();
    expect(screen.getByText("تاريخ مختلف عليه")).toBeInTheDocument();
    expect(screen.getAllByText("تأريخ تقريبي")).toHaveLength(2);
  });

  it.each([
    ["exact", false, "تاريخ دقيق"],
    ["month", false, "محدد بالشهر"],
    ["year", false, "سنة فقط"],
    ["approximate", false, "تاريخ تقريبي"],
    ["disputed", false, "تاريخ مختلف عليه"],
  ] as const)("explains %s date precision", (precision, circa, label) => {
    renderDrawer({
      detail: {
        ...DETAIL,
        end_date: null,
        year_end_hijri: null,
        start_date: { ...DETAIL.start_date, precision, circa, display_label_ar: "159هـ" },
      },
    });

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("shows the neutral notice for disputed date precision even when event confidence is high", () => {
    renderDrawer({
      detail: {
        ...DETAIL,
        confidence: "high",
        end_date: null,
        year_end_hijri: null,
        start_date: { ...DETAIL.start_date, precision: "disputed", circa: false },
      },
    });

    expect(screen.getByText("توجد روايات أو تقديرات مختلفة حول بعض تفاصيل هذا الحدث.")).toBeInTheDocument();
    expect(screen.getByText("موثق بدرجة عالية")).toBeInTheDocument();
  });

  it("omits every empty optional section without a historical placeholder", () => {
    renderDrawer({
      detail: {
        ...DETAIL,
        title_en: null,
        summary_ar: null,
        causes_ar: null,
        consequences_ar: null,
        importance: null,
        primary_place: null,
        related_people: [],
        related_places: [],
        related_states: [],
      },
    });

    expect(screen.queryByRole("heading", { name: "ماذا حدث؟" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "لماذا حدث؟" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "ماذا نتج عنه؟" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "الشخصيات المرتبطة" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "الكيانات السياسية المرتبطة" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "المكان" })).not.toBeInTheDocument();
    expect(screen.queryByText(/غير متوفر|غير محدد/)).not.toBeInTheDocument();
  });

  it("shows rich, distinct, Bidi-safe source cards and suppresses unsafe links", () => {
    renderDrawer({
      detail: {
        ...DETAIL,
        sources: [
          DETAIL.sources[0],
          { ...DETAIL.sources[0] },
          {
            ...DETAIL.sources[0],
            id: "00000000-0000-0000-0000-000000000007",
            title: "مصدر عربي",
            edition: null,
            publication_data: null,
            citation_locator: null,
            reliability_note: null,
            support_type: "chronological",
            url: "javascript:alert(1)",
          },
          {
            ...DETAIL.sources[0],
            id: "00000000-0000-0000-0000-000000000008",
            title: "مصدر ببيانات اعتماد",
            edition: null,
            publication_data: null,
            citation_locator: null,
            reliability_note: null,
            support_type: "contextual",
            url: "https://user:secret@example.com/source",
          },
          {
            ...DETAIL.sources[0],
            id: "00000000-0000-0000-0000-000000000009",
            title: "مصدر بلا سلطة HTTP",
            edition: null,
            publication_data: null,
            citation_locator: null,
            reliability_note: null,
            support_type: "unsafe_test",
            url: "http:example.test/source",
          },
          {
            ...DETAIL.sources[0],
            id: "00000000-0000-0000-0000-000000000010",
            title: "مصدر بلا سلطة HTTPS",
            edition: null,
            publication_data: null,
            citation_locator: null,
            reliability_note: null,
            support_type: "unsafe_test",
            url: "https:example.test/source",
          },
          {
            ...DETAIL.sources[0],
            id: "00000000-0000-0000-0000-000000000011",
            title: "مصدر بمنفذ فارغ",
            edition: null,
            publication_data: null,
            citation_locator: null,
            reliability_note: null,
            support_type: "unsafe_test",
            url: "https://example.test:/source",
          },
        ],
      },
    });

    expect(screen.getAllByText("A scholarly source")).toHaveLength(1);
    expect(screen.getByText("Second edition")).toHaveAttribute("dir", "auto");
    expect(screen.getByText("Academic Press, 2020")).toHaveAttribute("dir", "auto");
    expect(screen.getByText("pp. 10–12")).toHaveAttribute("dir", "auto");
    expect(screen.getByText("دعم مباشر")).toBeInTheDocument();
    expect(screen.getByText("دعم للتأريخ")).toBeInTheDocument();
    expect(screen.getByText("Peer-reviewed synthesis.")).toHaveAttribute("dir", "auto");
    expect(screen.getByRole("link", { name: /عرض المصدر A scholarly source/ })).toHaveAttribute(
      "href",
      "https://example.test/source",
    );
    expect(screen.queryByRole("link", { name: /مصدر ببيانات اعتماد/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("renders one navigation action per related identity when API metadata has multiple roles", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      renderDrawer({
        detail: {
          ...DETAIL,
          related_people: [
            DETAIL.related_people[0],
            { ...DETAIL.related_people[0], role_code: "patron" },
          ],
          related_states: [
            DETAIL.related_states[0],
            { ...DETAIL.related_states[0], relation_type: "claimant" },
          ],
        },
      });

      expect(screen.getAllByRole("button", {
        name: "الانتقال إلى سياق المقنع الخراساني",
      })).toHaveLength(1);
      expect(screen.getAllByRole("button", {
        name: "الانتقال إلى سياق الحركات الخرمية وأصحاب البياض",
      })).toHaveLength(1);
      expect(consoleError.mock.calls.flat().join(" ")).not.toContain("same key");
    } finally {
      consoleError.mockRestore();
    }
  });

  it("invokes typed Person and State navigation and announces loading or failure", () => {
    const onNavigateRelated = vi.fn();
    const { rerender } = renderDrawer({ onNavigateRelated });

    fireEvent.click(screen.getByRole("button", { name: "الانتقال إلى سياق المقنع الخراساني" }));
    expect(onNavigateRelated).toHaveBeenCalledWith({
      entityType: "person",
      nameAr: "المقنع الخراساني",
      slug: "al-muqanna",
    });
    fireEvent.click(screen.getByRole("button", { name: "الانتقال إلى سياق الحركات الخرمية وأصحاب البياض" }));
    expect(onNavigateRelated).toHaveBeenLastCalledWith({
      entityType: "state",
      nameAr: "الحركات الخرمية وأصحاب البياض",
      slug: "khurramiyya-movements",
    });

    rerender(
      <EventDrawer
        onClose={vi.fn()}
        onNavigateRelated={onNavigateRelated}
        onRetry={vi.fn()}
        relatedNavigationState={{ status: "loading", key: "person:al-muqanna" }}
        state={{ status: "ready", detail: DETAIL }}
        targetSlug={DETAIL.slug}
      />,
    );
    expect(screen.getByRole("status", { name: "حالة التنقل المرتبط" })).toHaveTextContent("جارٍ الانتقال");
    expect(screen.getByRole("button", { name: "الانتقال إلى سياق المقنع الخراساني" })).toBeDisabled();

    rerender(
      <EventDrawer
        onClose={vi.fn()}
        onNavigateRelated={onNavigateRelated}
        onRetry={vi.fn()}
        relatedNavigationState={{ status: "error", key: "person:al-muqanna" }}
        state={{ status: "ready", detail: DETAIL }}
        targetSlug={DETAIL.slug}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("تعذّر الانتقال");
    expect(screen.getByRole("heading", { name: DETAIL.title_ar })).toBeInTheDocument();
  });

  it("uses dialog semantics, contains Tab focus, closes with Escape, and restores initiator focus", () => {
    const onClose = vi.fn();
    const initiator = document.createElement("button");
    initiator.textContent = "open";
    document.body.appendChild(initiator);
    initiator.focus();
    const { unmount } = renderDrawer({ onClose });

    const close = screen.getByRole("button", { name: "إغلاق تفاصيل الحدث" });
    const lastLink = screen.getByRole("link", { name: /عرض المصدر/ });
    expect(close).toHaveFocus();

    lastLink.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();

    close.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(lastLink).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
    unmount();
    expect(initiator).toHaveFocus();
    initiator.remove();
  });

  it("restores the latest outside initiator after replacing the open Event", () => {
    const firstInitiator = document.createElement("button");
    const replacementInitiator = document.createElement("button");
    document.body.append(firstInitiator, replacementInitiator);
    firstInitiator.focus();
    const { rerender, unmount } = renderDrawer();
    const replacementDetail = {
      ...DETAIL,
      id: "00000000-0000-0000-0000-000000000009",
      slug: "replacement-event",
      title_ar: "حدث بديل",
    } satisfies EventDetail;

    replacementInitiator.focus();
    rerender(
      <EventDrawer
        onClose={vi.fn()}
        onNavigateRelated={vi.fn()}
        onRetry={vi.fn()}
        relatedNavigationState={{ status: "idle" }}
        state={{ status: "ready", detail: replacementDetail }}
        targetSlug={replacementDetail.slug}
      />,
    );
    expect(screen.getByRole("button", { name: "إغلاق تفاصيل الحدث" })).toHaveFocus();

    unmount();
    expect(replacementInitiator).toHaveFocus();
    firstInitiator.remove();
    replacementInitiator.remove();
  });

  it("uses a scroll-contained mobile bottom sheet and tablet/desktop side surface", () => {
    renderDrawer();

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("bottom-0", "max-h-[85%]", "rounded-t-3xl");
    expect(dialog.className).toContain("md:inset-y-0");
    expect(dialog.className).toContain("md:max-w-md");
    expect(screen.getByTestId("event-drawer-scroll-region")).toHaveClass(
      "overflow-y-auto",
      "overscroll-contain",
    );
    expect(screen.getByTestId("event-drawer-header")).toHaveClass("shrink-0");
  });
});
