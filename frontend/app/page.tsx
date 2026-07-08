"use client";

import { useCallback, useState } from "react";
import VideoUploader from "@/components/VideoUploader";
import VideoPreview from "@/components/VideoPreview";
import SubtitleEditor from "@/components/SubtitleEditor";
import StylePanel from "@/components/StylePanel";
import ExportButton from "@/components/ExportButton";
import ProgressStatus from "@/components/ProgressStatus";
import {
  cleanupJob,
  getDownloadUrl,
  renderVideo,
  transcribeVideo,
  uploadVideo,
} from "@/lib/api";
import { AppStatus, DEFAULT_STYLE, SubtitleSegment, SubtitleStyle } from "@/lib/types";

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [segments, setSegments] = useState<SubtitleSegment[]>([]);
  const [style, setStyle] = useState<SubtitleStyle>(DEFAULT_STYLE);
  const [status, setStatus] = useState<AppStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const isBusy = [
    "uploading",
    "extracting_audio",
    "transcribing",
    "generating_subtitle",
    "rendering",
  ].includes(status);

  const handleFileSelected = useCallback(async (file: File) => {
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setSegments([]);
    setDownloadUrl(null);
    setErrorMessage(null);

    // 前のジョブが残っていればクリーンアップしてから新規アップロード
    if (jobId) {
      await cleanupJob(jobId);
    }

    setStatus("uploading");
    try {
      const res = await uploadVideo(file);
      setJobId(res.job_id);
      setStatus("uploaded");
    } catch (e) {
      setStatus("error");
      setErrorMessage(e instanceof Error ? e.message : "アップロードに失敗しました");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const handleTranscribe = useCallback(async () => {
    if (!jobId) return;
    setErrorMessage(null);
    setStatus("transcribing");
    try {
      const res = await transcribeVideo(jobId, "medium");
      setSegments(res.segments);
      setStatus("transcribed");
    } catch (e) {
      setStatus("error");
      setErrorMessage(e instanceof Error ? e.message : "文字起こしに失敗しました");
    }
  }, [jobId]);

  const handleChangeSegment = useCallback((id: string, text: string) => {
    setSegments((prev) =>
      prev.map((seg) => (seg.id === id ? { ...seg, text } : seg))
    );
  }, []);

  const handleExport = useCallback(async () => {
    if (!jobId || segments.length === 0) return;
    setErrorMessage(null);
    setDownloadUrl(null);
    setStatus("rendering");
    try {
      await renderVideo(jobId, segments, style);
      setDownloadUrl(getDownloadUrl(jobId));
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setErrorMessage(e instanceof Error ? e.message : "書き出しに失敗しました");
    }
  }, [jobId, segments, style]);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">
          自動字幕付け Webアプリ
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          動画をアップロード → ローカルで自動文字起こし → 字幕を編集・デザイン →
          字幕付き動画をダウンロード
        </p>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-4">
        <ProgressStatus status={status} errorMessage={errorMessage} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 左側: 動画プレビューとアップロード */}
          <div className="lg:col-span-2 space-y-4">
            <VideoUploader
              onFileSelected={handleFileSelected}
              disabled={isBusy}
              hasFile={!!videoFile}
            />
            <VideoPreview videoUrl={videoUrl} />

            {status === "uploaded" && (
              <button
                type="button"
                onClick={handleTranscribe}
                disabled={isBusy}
                className="w-full py-2.5 rounded-md bg-accent text-white text-sm font-medium
                  hover:bg-accent-hover transition disabled:opacity-50"
              >
                2. 文字起こしを開始
              </button>
            )}

            <SubtitleEditor segments={segments} onChangeSegment={handleChangeSegment} />
          </div>

          {/* 右側: 字幕デザイン設定と書き出し */}
          <div className="space-y-4">
            <StylePanel style={style} onChange={setStyle} disabled={isBusy} />
            <ExportButton
              onExport={handleExport}
              disabled={isBusy || segments.length === 0}
              isRendering={status === "rendering"}
              downloadUrl={downloadUrl}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
