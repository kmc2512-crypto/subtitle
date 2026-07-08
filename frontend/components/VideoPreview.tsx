"use client";

interface VideoPreviewProps {
  videoUrl: string | null;
}

export default function VideoPreview({ videoUrl }: VideoPreviewProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full flex flex-col">
      <p className="text-sm font-medium text-gray-700 mb-2">動画プレビュー</p>
      <div className="flex-1 flex items-center justify-center bg-gray-900 rounded-md overflow-hidden min-h-[240px]">
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            className="max-h-[480px] w-full"
          />
        ) : (
          <p className="text-gray-400 text-sm px-4 text-center">
            動画をアップロードするとここにプレビューが表示されます
          </p>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-2">
        ※ このプレビューには字幕は表示されません。字幕付き動画は書き出し後にダウンロードできます。
      </p>
    </div>
  );
}
