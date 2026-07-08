"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DownloadResult from "@/components/DownloadResult";
import MobileLayout from "@/components/MobileLayout";
import MobileStylePanel from "@/components/MobileStylePanel";
import MobileSubtitleEditor from "@/components/MobileSubtitleEditor";
import MobileVideoPreview from "@/components/MobileVideoPreview";
import MobileVideoUploader from "@/components/MobileVideoUploader";
import ProgressStatus from "@/components/ProgressStatus";
import StickyActionBar from "@/components/StickyActionBar";
import {
  cleanupJob,
  getDownloadUrl,
  renderVideo,
  transcribeVideo,
  uploadVideo,
} from "@/lib/api";
import { AppStatus, DEFAULT_STYLE, SubtitleSegment, SubtitleStyle } from "@/lib/types";

const BUSY_STATUSES: AppStatus[] = [
  "uploading",
  "extracting_audio",
  "transcribing",
  "generating_subtitle",
  "rendering",
];

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [segments, setSegments] = useState<SubtitleSegment[]>([]);
  const [style, setStyle] = useState<SubtitleStyle>(DEFAULT_STYLE);
  const [status, setStatus] = useState<AppStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isBusy = BUSY_STATUSES.includes(status);
  const canTranscribe = Boolean(jobId) && status === "uploaded";
  const canExport = Boolean(jobId) && segments.length > 0 && !isBusy;

  const helperText = useMemo(() => {
    if (!videoFile) return "動画を選択すると、スマホでも確認しやすいプレビューが表示されます。";
    return `${videoFile.name} / ${(videoFile.size / 1024 / 1024).toFixed(1)}MB`;
  }, [videoFile]);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const handleFileSelected = useCallback(
    async (file: File) => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setSegments([]);
      setDownloadUrl(null);
      setErrorMessage(null);
      setUploadProgress(0);

      if (jobId) {
        await cleanupJob(jobId);
      }

      setStatus("uploading");
      try {
        const response = await uploadVideo(file, setUploadProgress);
        setJobId(response.job_id);
        setStatus("uploaded");
      } catch (error) {
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "アップロードに失敗しました。Mac側のバックエンドを確認してください。");
      }
    },
    [jobId, videoUrl]
  );

  const handleTranscribe = useCallback(async () => {
    if (!jobId) return;
    setErrorMessage(null);
    setStatus("transcribing");
    try {
      const response = await transcribeVideo(jobId, "medium");
      setSegments(response.segments);
      setStatus("transcribed");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "文字起こしに失敗しました。動画の音声やバックエンドログを確認してください。");
    }
  }, [jobId]);

  const handleChangeSegment = useCallback((id: string, text: string) => {
    setSegments((prev) =>
      prev.map((segment) => (segment.id === id ? { ...segment, text } : segment))
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
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "書き出しに失敗しました。字幕内容やMac側のFFmpegを確認してください。");
    }
  }, [jobId, segments, style]);

  return (
    <MobileLayout status={status}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:items-start">
        <div className="space-y-4">
          <ProgressStatus status={status} errorMessage={errorMessage} />
          <MobileVideoUploader
            onFileSelected={handleFileSelected}
            disabled={isBusy}
            hasFile={Boolean(videoFile)}
            uploadProgress={uploadProgress}
          />
          <MobileVideoPreview videoUrl={videoUrl} helperText={helperText} />

          {status === "uploaded" && (
            <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 md:hidden">
              <p className="text-sm font-semibold text-indigo-950">次は文字起こしです</p>
              <p className="mt-1 text-xs leading-5 text-indigo-800">
                処理はMac側で行います。スマホでは待機状態を確認できます。
              </p>
            </section>
          )}

          <MobileSubtitleEditor
            segments={segments}
            onChangeSegment={handleChangeSegment}
            disabled={isBusy}
          />
          <DownloadResult downloadUrl={downloadUrl} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28">
          <MobileStylePanel style={style} onChange={setStyle} disabled={isBusy} />

          <section className="hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:block">
            <p className="text-sm font-semibold text-slate-900">実行</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              スマホでは下部固定ボタン、PCではこのパネルから操作できます。
            </p>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={handleTranscribe}
                disabled={!canTranscribe || isBusy}
                className="min-h-12 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                音声を文字起こしする
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={!canExport}
                className="min-h-12 rounded-xl border border-indigo-200 bg-white px-4 text-sm font-semibold text-indigo-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
              >
                字幕付き動画を書き出す
              </button>
            </div>
          </section>
        </aside>
      </div>

      <StickyActionBar
        status={status}
        canTranscribe={canTranscribe}
        canExport={canExport}
        isBusy={isBusy}
        onTranscribe={handleTranscribe}
        onExport={handleExport}
      />
    </MobileLayout>
  );
}
