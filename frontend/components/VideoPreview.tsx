"use client";

import { useEffect, useRef, useState } from "react";
import { SubtitleSegment, SubtitleStyle } from "@/lib/types";

interface VideoPreviewProps {
  videoUrl: string | null;
  segments: SubtitleSegment[];
  style: SubtitleStyle;
}

const SAMPLE_TEXT = "字幕プレビュー：サイズ・色・位置はここで確認できます";

// バックエンドのASS生成はPlayResY=1080を前提にしているため、
// プレビュー欄の表示高さに比例させることで実際の書き出しサイズに近づける
const ASS_PLAY_RES_Y = 1080;

export default function VideoPreview({
  videoUrl,
  segments,
  style,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [displayHeight, setDisplayHeight] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const updateSize = () => setDisplayHeight(videoEl.clientHeight);
    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(videoEl);
    videoEl.addEventListener("loadedmetadata", updateSize);

    return () => {
      resizeObserver.disconnect();
      videoEl.removeEventListener("loadedmetadata", updateSize);
    };
  }, [videoUrl]);

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  // 再生位置に該当する字幕があればそれを表示、なければ先頭の字幕、
  // 字幕がまだ無ければサンプルテキストでスタイルだけ確認できるようにする
  const activeSegment =
    segments.find((seg) => currentTime >= seg.start && currentTime <= seg.end) ??
    segments[0];
  const previewText = activeSegment ? activeSegment.text : SAMPLE_TEXT;

  const scale = displayHeight > 0 ? displayHeight / ASS_PLAY_RES_Y : 0;
  const previewFontSize = Math.max(8, style.fontSize * scale);
  const previewOutlineWidth = Math.max(0, style.outlineWidth * scale);

  // 縁取りを複数方向のtext-shadowを重ねて疑似的に再現する
  const shadowLayers: string[] = [];
  if (previewOutlineWidth > 0) {
    const w = previewOutlineWidth;
    const offsets = [
      [-w, -w], [w, -w], [-w, w], [w, w],
      [0, -w], [0, w], [-w, 0], [w, 0],
    ];
    offsets.forEach(([x, y]) =>
      shadowLayers.push(`${x}px ${y}px 0 ${style.outlineColor}`)
    );
  }
  if (style.shadow) {
    shadowLayers.push("2px 2px 6px rgba(0,0,0,0.6)");
  }

  const alignItems =
    style.position === "top"
      ? "flex-start"
      : style.position === "middle"
      ? "center"
      : "flex-end";

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full flex flex-col">
      <p className="text-sm font-medium text-gray-700 mb-2">動画プレビュー</p>
      <div className="flex-1 flex items-center justify-center bg-gray-900 rounded-md overflow-hidden min-h-[240px]">
        {videoUrl ? (
          <div className="relative w-full">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleTimeUpdate}
              className="max-h-[480px] w-full"
            />
            {displayHeight > 0 && (
              <div
                className="absolute inset-0 flex justify-center px-6 pointer-events-none"
                style={{ alignItems, paddingTop: "4%", paddingBottom: "4%" }}
              >
                <span
                  style={{
                    fontSize: `${previewFontSize}px`,
                    color: style.textColor,
                    textShadow: shadowLayers.join(", "),
                    fontWeight: 700,
                    lineHeight: 1.3,
                    textAlign: "center",
                    maxWidth: "90%",
                    whiteSpace: "pre-wrap",
                    backgroundColor: style.backgroundBox
                      ? "rgba(0,0,0,0.6)"
                      : "transparent",
                    padding: style.backgroundBox ? "0.1em 0.4em" : 0,
                    borderRadius: style.backgroundBox ? "4px" : 0,
                  }}
                >
                  {previewText}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400 text-sm px-4 text-center">
            動画をアップロードするとここにプレビューが表示されます
          </p>
        )}
      </div>
      {videoUrl && (
        <p className="text-xs text-gray-400 mt-2">
          ※ サイズ・色・位置の確認用シミュレーションです。実際の焼き込み結果とは改行位置などが若干異なる場合があります。
        </p>
      )}
    </div>
  );
}
