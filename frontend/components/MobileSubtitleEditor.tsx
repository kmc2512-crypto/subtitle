"use client";

import { SubtitleSegment } from "@/lib/types";

interface MobileSubtitleEditorProps {
  segments: SubtitleSegment[];
  onChangeSegment: (id: string, text: string) => void;
  disabled?: boolean;
}

function formatTime(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = (seconds % 60).toFixed(1).padStart(4, "0");
  return `${min}:${sec}`;
}

export default function MobileSubtitleEditor({
  segments,
  onChangeSegment,
  disabled = false,
}: MobileSubtitleEditorProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-semibold text-slate-900">字幕を編集</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          スマホではタイムラインではなく、字幕ごとのカードで確認・修正します。
        </p>
      </div>

      {segments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
          文字起こしが終わると、開始時間・終了時間つきの字幕カードがここに表示されます。
        </div>
      ) : (
        <div className="space-y-3">
          {segments.map((segment, index) => (
            <article
              key={segment.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  #{index + 1}
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs tabular-nums text-slate-500">
                  {formatTime(segment.start)} - {formatTime(segment.end)}
                </span>
              </div>
              <textarea
                value={segment.text}
                disabled={disabled}
                onChange={(event) => onChangeSegment(segment.id, event.target.value)}
                rows={3}
                className="min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-3 text-base leading-7 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
              />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
