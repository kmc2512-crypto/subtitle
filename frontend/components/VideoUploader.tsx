"use client";

import { useRef } from "react";

interface VideoUploaderProps {
  onFileSelected: (file: File) => void;
  disabled: boolean;
  hasFile: boolean;
}

export default function VideoUploader({
  onFileSelected,
  disabled,
  hasFile,
}: VideoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-white">
      <p className="text-sm font-medium text-gray-700 mb-2">
        1. 動画をアップロード
      </p>
      <p className="text-xs text-gray-500 mb-3">
        対応形式: mp4 / mov / m4v / webm（MVPでは5分以内・1080p程度を推奨）
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/x-m4v,video/webm"
        onChange={handleChange}
        disabled={disabled}
        className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-4
          file:rounded-md file:border-0 file:text-sm file:font-medium
          file:bg-accent file:text-white hover:file:bg-accent-hover
          disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {hasFile && (
        <p className="text-xs text-green-600 mt-2">
          動画を選択しました。次に「文字起こしを開始」を押してください。
        </p>
      )}
    </div>
  );
}
