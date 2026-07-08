"use client";

import { SubtitleSegment } from "@/lib/types";

interface SubtitleEditorProps {
  segments: SubtitleSegment[];
  onChangeSegment: (id: string, text: string) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(1);
  return `${m}:${s.padStart(4, "0")}`;
}

export default function SubtitleEditor({
  segments,
  onChangeSegment,
}: SubtitleEditorProps) {
  if (segments.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-sm text-gray-400">
        文字起こしを実行すると、ここに字幕テキストの編集欄が表示されます。
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-sm font-medium text-gray-700 mb-3">
        字幕テキストを編集（{segments.length}件）
      </p>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {segments.map((seg) => (
          <div
            key={seg.id}
            className="flex items-start gap-3 border border-gray-100 rounded-md p-2"
          >
            <span className="text-xs text-gray-400 whitespace-nowrap pt-2 w-24">
              {formatTime(seg.start)} - {formatTime(seg.end)}
            </span>
            <textarea
              value={seg.text}
              onChange={(e) => onChangeSegment(seg.id, e.target.value)}
              rows={1}
              className="flex-1 text-sm border border-gray-200 rounded-md px-2 py-1
                focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
