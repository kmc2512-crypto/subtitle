"use client";

import { AppStatus, STATUS_LABELS } from "@/lib/types";

interface ProgressStatusProps {
  status: AppStatus;
  errorMessage: string | null;
}

const BUSY_STATUSES: AppStatus[] = [
  "uploading",
  "extracting_audio",
  "transcribing",
  "generating_subtitle",
  "rendering",
];

export default function ProgressStatus({
  status,
  errorMessage,
}: ProgressStatusProps) {
  if (status === "idle") return null;

  const isBusy = BUSY_STATUSES.includes(status);
  const isError = status === "error";
  const isDone = status === "done";

  return (
    <div
      className={`rounded-lg border p-3 flex items-center gap-3 text-sm
        ${
          isError
            ? "bg-red-50 border-red-200 text-red-700"
            : isDone
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-blue-50 border-blue-200 text-blue-700"
        }`}
    >
      {isBusy && (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      <span>
        {isError && errorMessage ? errorMessage : STATUS_LABELS[status]}
      </span>
    </div>
  );
}
