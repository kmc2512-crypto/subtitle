export type SubtitlePosition = "bottom" | "middle" | "top";

export interface SubtitleSegment {
  id: string;
  start: number; // 秒
  end: number; // 秒
  text: string;
}

export interface FontOption {
  label: string;
  value: string;
}

// Macに標準搭載されている日本語対応フォントを中心に選択肢を用意
export const FONT_OPTIONS: FontOption[] = [
  { label: "ヒラギノ角ゴシック（標準）", value: "Hiragino Sans" },
  { label: "ヒラギノ角ゴ ProN", value: "Hiragino Kaku Gothic ProN" },
  { label: "ヒラギノ明朝 ProN", value: "Hiragino Mincho ProN" },
  { label: "游ゴシック", value: "YuGothic" },
  { label: "游明朝", value: "YuMincho" },
  { label: "Noto Sans JP", value: "Noto Sans JP" },
  { label: "Arial Bold（欧文向け）", value: "Arial" },
  { label: "Impact（インパクト太字）", value: "Impact" },
];

export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  textColor: string; // "#RRGGBB"
  outlineColor: string; // "#RRGGBB"
  outlineWidth: number;
  shadow: boolean;
  position: SubtitlePosition;
  backgroundBox: boolean;
}

export const DEFAULT_STYLE: SubtitleStyle = {
  fontFamily: "Hiragino Sans",
  fontSize: 64,
  textColor: "#FFFFFF",
  outlineColor: "#000000",
  outlineWidth: 4,
  shadow: true,
  position: "bottom",
  backgroundBox: false,
};

export type AppStatus =
  | "idle"
  | "uploading"
  | "uploaded"
  | "extracting_audio"
  | "transcribing"
  | "transcribed"
  | "generating_subtitle"
  | "rendering"
  | "done"
  | "error";

export const STATUS_LABELS: Record<AppStatus, string> = {
  idle: "待機中",
  uploading: "動画をアップロード中...",
  uploaded: "アップロード完了",
  extracting_audio: "音声を抽出中...",
  transcribing: "文字起こし中...（動画の長さによって数分かかります）",
  transcribed: "文字起こし完了。字幕を編集できます",
  generating_subtitle: "字幕ファイルを生成中...",
  rendering: "字幕付き動画を書き出し中...（画質優先のため時間がかかります）",
  done: "書き出し完了！ダウンロードできます",
  error: "エラーが発生しました",
};
