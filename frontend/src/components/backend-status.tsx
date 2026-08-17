"use client";

import { useEffect, useState } from "react";

type BackendState = "checking" | "available" | "unavailable";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export function BackendStatus() {
  const [state, setState] = useState<BackendState>("checking");

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${apiBaseUrl}/health`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Health check failed");
        return response.json();
      })
      .then((payload: { status?: string }) => {
        setState(payload.status === "ok" ? "available" : "unavailable");
      })
      .catch(() => setState("unavailable"));

    return () => controller.abort();
  }, []);

  const label = {
    checking: "جارٍ التحقق من اتصال الخادم…",
    available: "الخادم متصل",
    unavailable: "الخادم غير متاح محليًا",
  }[state];

  return (
    <p aria-live="polite" className="text-sm text-slate-600">
      {label}
    </p>
  );
}
