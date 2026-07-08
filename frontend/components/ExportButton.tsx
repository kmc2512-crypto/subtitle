"use client";

interface ExportButtonProps {
  onExport: () => void;
  disabled: boolean;
  isRendering: boolean;
  downloadUrl: string | null;
}

export default function ExportButton({
  onExport,
  disabled,
  isRendering,
  downloadUrl,
}: ExportButtonProps) {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onExport}
        disabled={disabled}
        className="w-full py-2.5 rounded-md bg-accent text-white text-sm font-medium
          hover:bg-accent-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRendering ? "書き出し中..." : "字幕を焼き込んで書き出す"}
      </button>

      {downloadUrl && (
        <a
          href={downloadUrl}
          download
          className="w-full text-center py-2.5 rounded-md border border-accent text-accent
            text-sm font-medium hover:bg-accent/5 transition"
        >
          完成した動画をダウンロード
        </a>
      )}
    </div>
  );
}
