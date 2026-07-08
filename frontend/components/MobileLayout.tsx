"use client";

import { ReactNode } from "react";
import StepIndicator from "@/components/StepIndicator";
import { AppStatus, STATUS_LABELS } from "@/lib/types";

interface MobileLayoutProps {
  status: AppStatus;
  children: ReactNode;
}

export default function MobileLayout({ status, children }: MobileLayoutProps) {
  return (
    <main className="min-h-dvh bg-slate-50 pb-28 text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                Subtitle Studio
              </p>
              <h1 className="text-lg font-bold leading-tight text-slate-950">
                自動字幕付け
              </h1>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-right text-xs font-medium text-slate-600">
              {STATUS_LABELS[status]}
            </div>
          </div>
          <StepIndicator status={status} />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-4 md:px-6 md:py-6">
        {children}
      </div>
    </main>
  );
}
