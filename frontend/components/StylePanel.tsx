"use client";

import { FONT_OPTIONS, SubtitlePosition, SubtitleStyle } from "@/lib/types";

interface StylePanelProps {
  style: SubtitleStyle;
  onChange: (style: SubtitleStyle) => void;
  disabled: boolean;
}

const POSITIONS: { value: SubtitlePosition; label: string }[] = [
  { value: "bottom", label: "下" },
  { value: "middle", label: "中央" },
  { value: "top", label: "上" },
];

export default function StylePanel({
  style,
  onChange,
  disabled,
}: StylePanelProps) {
  const update = (partial: Partial<SubtitleStyle>) => {
    onChange({ ...style, ...partial });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <p className="text-sm font-medium text-gray-700">字幕デザイン設定</p>

      <div>
        <label className="block text-xs text-gray-600 mb-1">フォント</label>
        <select
          value={style.fontFamily}
          disabled={disabled}
          onChange={(e) => update({ fontFamily: e.target.value })}
          className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5
            focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">文字色</label>
        <input
          type="color"
          value={style.textColor}
          disabled={disabled}
          onChange={(e) => update({ textColor: e.target.value })}
          className="w-12 h-8"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">縁取り色</label>
        <input
          type="color"
          value={style.outlineColor}
          disabled={disabled}
          onChange={(e) => update({ outlineColor: e.target.value })}
          className="w-12 h-8"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">
          文字サイズ（{style.fontSize}px相当）
        </label>
        <input
          type="range"
          min={32}
          max={96}
          step={2}
          value={style.fontSize}
          disabled={disabled}
          onChange={(e) => update({ fontSize: Number(e.target.value) })}
          className="w-full accent-accent"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">
          縁取りの太さ（{style.outlineWidth}）
        </label>
        <input
          type="range"
          min={0}
          max={8}
          step={1}
          value={style.outlineWidth}
          disabled={disabled}
          onChange={(e) => update({ outlineWidth: Number(e.target.value) })}
          className="w-full accent-accent"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">字幕の位置</label>
        <div className="flex gap-2">
          {POSITIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              disabled={disabled}
              onClick={() => update({ position: p.value })}
              className={`text-xs px-3 py-1.5 rounded-md border transition
                ${
                  style.position === p.value
                    ? "bg-accent text-white border-accent"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                } disabled:opacity-50`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={style.shadow}
          disabled={disabled}
          onChange={(e) => update({ shadow: e.target.checked })}
        />
        影をつける
      </label>

      <label className="flex items-center gap-2 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={style.backgroundBox}
          disabled={disabled}
          onChange={(e) => update({ backgroundBox: e.target.checked })}
        />
        背景ボックスをつける
      </label>
    </div>
  );
}
