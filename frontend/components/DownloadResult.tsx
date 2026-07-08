"use client";

interface DownloadResultProps {
  downloadUrl: string | null;
}

export default function DownloadResult({ downloadUrl }: DownloadResultProps) {
  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  const handleShare = async () => {
    if (!downloadUrl || !navigator.share) return;
    await navigator.share({
      title: "字幕付き動画",
      text: "字幕付き動画が完成しました",
      url: downloadUrl,
    });
  };

  if (!downloadUrl) return null;

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
      <p className="text-sm font-semibold text-emerald-900">完成しました</p>
      <p className="mt-1 text-xs leading-5 text-emerald-800">
        iPhoneで保存できない場合は、下のプレビューを開いて共有ボタンから保存してください。
      </p>
      <div className="mt-4 overflow-hidden rounded-2xl bg-slate-950">
        <video src={downloadUrl} controls playsInline className="max-h-[70dvh] w-full object-contain" />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <a
          href={downloadUrl}
          download
          className="flex min-h-12 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white"
        >
          動画をダウンロード
        </a>
        {canShare && (
          <button
            type="button"
            onClick={handleShare}
            className="min-h-12 rounded-xl border border-emerald-300 bg-white px-4 text-sm font-semibold text-emerald-700"
          >
            共有する
          </button>
        )}
      </div>
    </section>
  );
}
