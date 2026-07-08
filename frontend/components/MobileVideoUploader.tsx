"use client";

import { useMemo, useRef, useState } from "react";

const MAX_RECOMMENDED_BYTES = 500 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${Math.round(bytes / 1024 / 1024)}MB`;
}

interface MobileVideoUploaderProps {
  onFileSelected: (file: File) => void;
  disabled: boolean;
  hasFile: boolean;
  uploadProgress: number;
}

export default function MobileVideoUploader({
  onFileSelected,
  disabled,
  hasFile,
  uploadProgress,
}: MobileVideoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const progressLabel = useMemo(() => {
    if (uploadProgress <= 0) return "アップロード待ち";
    if (uploadProgress >= 100) return "アップロード完了";
    return `アップロード中 ${uploadProgress}%`;
  }, [uploadProgress]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_RECOMMENDED_BYTES) {
      setWarning(`ファイルサイズが大きめです（${formatBytes(file.size)}）。まずは5分以内・500MB以内を推奨します。`);
    } else {
      setWarning(null);
    }
    onFileSelected(file);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-semibold text-slate-900">動画アップロード</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          mp4 / mov / m4v / webm に対応。まずは5分以内・1080p・500MB以内がおすすめです。
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="flex min-h-12 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        動画を選択
      </button>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{hasFile ? progressLabel : "動画未選択"}</span>
          <span>{uploadProgress > 0 ? `${uploadProgress}%` : ""}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${Math.min(100, Math.max(0, uploadProgress))}%` }}
          />
        </div>
      </div>

      {warning && (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
          {warning}
        </p>
      )}
    </section>
  );
}
