"use client";

interface MobileVideoPreviewProps {
  videoUrl: string | null;
  title?: string;
  helperText?: string;
}

export default function MobileVideoPreview({
  videoUrl,
  title = "動画プレビュー",
  helperText = "9:16動画は縦長のまま、横動画は画面幅に収まるように表示します。",
}: MobileVideoPreviewProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500">
          Reels / TikTok / Shorts
        </span>
      </div>
      <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl bg-slate-950">
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            playsInline
            className="max-h-[70dvh] w-full object-contain"
          />
        ) : (
          <p className="px-6 text-center text-sm leading-6 text-slate-400">
            動画を選択すると、ここでスマホ向けにプレビューできます。
          </p>
        )}
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{helperText}</p>
    </section>
  );
}
