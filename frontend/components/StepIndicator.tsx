"use client";

import { AppStatus, WorkflowStep } from "@/lib/types";

const STEPS: { key: WorkflowStep; label: string }[] = [
  { key: "upload", label: "アップロード" },
  { key: "transcribe", label: "文字起こし" },
  { key: "edit", label: "字幕編集" },
  { key: "export", label: "書き出し" },
  { key: "done", label: "完成" },
];

function stepFromStatus(status: AppStatus): WorkflowStep {
  if (status === "idle" || status === "uploading" || status === "uploaded") return "upload";
  if (status === "extracting_audio" || status === "transcribing") return "transcribe";
  if (status === "transcribed") return "edit";
  if (status === "generating_subtitle" || status === "rendering") return "export";
  if (status === "done") return "done";
  return "upload";
}

export default function StepIndicator({ status }: { status: AppStatus }) {
  const current = stepFromStatus(status);
  const currentIndex = STEPS.findIndex((step) => step.key === current);

  return (
    <div className="overflow-x-auto pb-1" aria-label="現在の処理ステップ">
      <ol className="flex min-w-max gap-2">
        {STEPS.map((step, index) => {
          const active = step.key === current;
          const complete = index < currentIndex;
          return (
            <li key={step.key}>
              <span
                className={`flex min-h-11 items-center rounded-full border px-3 text-xs font-medium ${
                  active
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : complete
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                {index + 1}. {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
