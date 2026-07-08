"""
FFmpegを使って動画にASS字幕を焼き込む（ハードサブ）モジュール。

- なるべく画質を落とさないよう CRF 16〜18 程度の高画質設定を使う
- 音声はまず `-c:a copy` で無劣化コピーを試み、失敗した場合のみAAC再エンコードにフォールバックする
"""

import subprocess
from pathlib import Path


def _run_ffmpeg(cmd: list) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True)


def _escape_ass_path_for_filter(ass_path: Path) -> str:
    """
    FFmpegのass=フィルタに渡すパスは、Windows的なドライブレター記法と衝突しないよう
    コロンをエスケープする必要がある（Mac/Linuxでもコロンを含むパスなら念のため必要）。
    """
    path_str = str(ass_path.resolve())
    return path_str.replace("\\", "/").replace(":", "\\:")


def burn_subtitles(input_path: Path, ass_path: Path, output_path: Path, crf: int = 16) -> None:
    """
    ASS字幕を動画に焼き込み、output_pathに書き出す。

    crf: 値が小さいほど高画質・大容量（16〜18程度を推奨）
    """
    if not input_path.exists():
        raise RuntimeError(f"入力動画が見つかりません: {input_path}")
    if not ass_path.exists():
        raise RuntimeError(f"字幕ファイル(ASS)が見つかりません: {ass_path}")

    ass_filter_path = _escape_ass_path_for_filter(ass_path)

    cmd_copy = [
        "ffmpeg", "-y",
        "-i", str(input_path),
        "-vf", f"ass={ass_filter_path}",
        "-c:v", "libx264",
        "-crf", str(crf),
        "-preset", "slow",
        "-c:a", "copy",
        str(output_path),
    ]
    result = _run_ffmpeg(cmd_copy)
    if result.returncode == 0:
        return

    # 音声コピーが失敗するケース（コンテナ非対応など）はAAC再エンコードにフォールバック
    cmd_aac = [
        "ffmpeg", "-y",
        "-i", str(input_path),
        "-vf", f"ass={ass_filter_path}",
        "-c:v", "libx264",
        "-crf", str(crf),
        "-preset", "slow",
        "-c:a", "aac",
        "-b:a", "192k",
        str(output_path),
    ]
    result2 = _run_ffmpeg(cmd_aac)
    if result2.returncode != 0:
        raise RuntimeError(
            "字幕焼き込み(FFmpeg)に失敗しました。\n"
            f"--- 音声コピー時のエラー ---\n{result.stderr[-1500:]}\n"
            f"--- AAC再エンコード時のエラー ---\n{result2.stderr[-1500:]}"
        )
