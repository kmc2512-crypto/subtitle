import { JobStatusResponse, SubtitleSegment, SubtitleStyle } from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
  } catch {
    // JSONでない場合はそのまま無視
  }
  return `サーバーエラーが発生しました (status: ${res.status})`;
}

export async function uploadVideo(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ job_id: string }> {
  const formData = new FormData();
  formData.append("file", file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/upload`);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve(JSON.parse(xhr.responseText));
        return;
      }

      try {
        const data = JSON.parse(xhr.responseText);
        reject(new Error(typeof data?.detail === "string" ? data.detail : `サーバーエラーが発生しました (status: ${xhr.status})`));
      } catch {
        reject(new Error(`サーバーエラーが発生しました (status: ${xhr.status})`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("アップロードに失敗しました。Mac側のバックエンドが起動しているか確認してください。"));
    };

    xhr.send(formData);
  });
}

export async function transcribeVideo(
  jobId: string,
  modelSize: string = "medium"
): Promise<{ segments: SubtitleSegment[] }> {
  const res = await fetch(
    `${API_BASE}/transcribe/${jobId}?model_size=${encodeURIComponent(
      modelSize
    )}`,
    { method: "POST" }
  );

  if (!res.ok) {
    throw new Error(await extractErrorMessage(res));
  }
  return res.json();
}

export async function renderVideo(
  jobId: string,
  segments: SubtitleSegment[],
  style: SubtitleStyle
): Promise<{ job_id: string; status: string; download_url: string }> {
  const res = await fetch(`${API_BASE}/render/${jobId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ segments, style }),
  });

  if (!res.ok) {
    throw new Error(await extractErrorMessage(res));
  }
  return res.json();
}

export function getDownloadUrl(jobId: string): string {
  return `${API_BASE}/download/${jobId}`;
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const res = await fetch(`${API_BASE}/status/${jobId}`);
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res));
  }
  return res.json();
}

export async function cleanupJob(jobId: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/cleanup/${jobId}`, { method: "DELETE" });
  } catch {
    // クリーンアップの失敗はユーザー操作をブロックしない
  }
}
