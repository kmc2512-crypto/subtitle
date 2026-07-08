"use client";

import { SubtitlePosition, SubtitleStyle } from "@/lib/types";

interface MobileStylePanelProps {
  style: SubtitleStyle;
  onChange: (style: SubtitleStyle) => void;
  disabled: boolean;
}

const POSITIONS: { value: SubtitlePosition; label: string }[] = [
  { value: "top", label: "上" },
  { value: "middle", label: "中央" },
  { value: "bottom", label: "下" },
];

export default function MobileStylePanel({
  style,
  onChange,
  disabled,
}: MobileStylePanelProps) {
  const update = (partial: Partial<SubtitleStyle>) => {
    onChange({ ...style, ...partial });
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <details className="group" open>
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-4 text-sm font-semibold text-slate-900">
          字幕デザイン
          <span className="text-xs text-slate-400 group-open:hidden">開く</span>
          <span className="hidden text-xs text-slate-400 group-open:inline">閉じる</span>
        </summary>
        <div className="space-y-5 border-t border-slate-100 p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              文字色
              <input
                type="color"
                value={style.textColor}
                disabled={disabled}
                onChange={(event) => update({ textColor: event.target.value })}
                className="mt-2 h-11 w-full rounded-lg"
              />
            </label>
            <label className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              縁取り色
              <input
                type="color"
                value={style.outlineColor}
                disabled={disabled}
                onChange={(event) => update({ outlineColor: event.target.value })}
                className="mt-2 h-11 w-full rounded-lg"
              />
            </label>
          </div>

          <label className="block text-xs font-medium text-slate-600">
            文字サイズ: {style.fontSize}
            <input
              type="range"
              min={32}
              max={96}
              step={2}
              value={style.fontSize}
              disabled={disabled}
              onChange={(event) => update({ fontSize: Number(event.target.value) })}
              className="mt-2 w-full accent-indigo-600"
            />
          </label>

          <label className="block text-xs font-medium text-slate-600">
            縁取り太さ: {style.outlineWidth}
            <input
              type="range"
              min={0}
              max={8}
              step={1}
              value={style.outlineWidth}
              disabled={disabled}
              onChange={(event) => update({ outlineWidth: Number(event.target.value) })}
              className="mt-2 w-full accent-indigo-600"
            />
          </label>

          <div>
            <p className="mb-2 text-xs font-medium text-slate-600">字幕位置</p>
            <div className="grid grid-cols-3 gap-2">
              {POSITIONS.map((position) => (
                <button
                  key={position.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => update({ position: position.value })}
                  className={`min-h-11 rounded-xl border text-sm font-medium ${
                    style.position === position.value
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-200 bg-white text-slate-600"
                  } disabled:opacity-50`}
                >
                  {position.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <label className="flex min-h-11 items-center justify-between rounded-xl border border-slate-200 px-3 text-sm text-slate-700">
              影をつける
              <input
                type="checkbox"
                checked={style.shadow}
                disabled={disabled}
                onChange={(event) => update({ shadow: event.target.checked })}
                className="h-5 w-5 accent-indigo-600"
              />
            </label>
            <label className="flex min-h-11 items-center justify-between rounded-xl border border-slate-200 px-3 text-sm text-slate-700">
              背景ボックス
              <input
                type="checkbox"
                checked={style.backgroundBox}
                disabled={disabled}
                onChange={(event) => update({ backgroundBox: event.target.checked })}
                className="h-5 w-5 accent-indigo-600"
              />
            </label>
          </div>
        </div>
      </details>
    </section>
  );
}
