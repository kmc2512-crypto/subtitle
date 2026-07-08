"use client";

import { AppStatus } from "@/lib/types";

interface StickyActionBarProps {
  status: AppStatus;
  canTranscribe: boolean;
  canExport: boolean;
  isBusy: boolean;
  onTranscribe: () => void;
  onExport: () => void;
}

export default function StickyActionBar({
  status,
  canTranscribe,
  canExport,
  isBusy,
  onTranscribe,
  onExport,
}: StickyActionBarProps) {
  const showTranscribe = status === "uploaded";
  const label = showTranscribe
    ? "文字起こしを開始"
    : status === "rendering"
    ? "書き出し中..."
    : "字幕付き動画を書き出す";
  const disabled = isBusy || (showTranscribe ? !canTranscribe : !canExport);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
      <button
        type="button"
        disabled={disabled}
        onClick={showTranscribe ? onTranscribe : onExport}
        className="min-h-12 w-full rounded-2xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {label}
      </button>
    </div>
  );
}
