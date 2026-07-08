"""
音声抽出 と ローカル文字起こし を担当するモジュール。

将来的に whisper.cpp や large-v3-turbo などのモデルへ切り替えやすいように、
外部から呼び出す関数のインタフェース（引数・戻り値の形）を変えないことを意識している。

- extract_audio(): FFmpegで動画から16kHzモノラルWAVを抽出する
- transcribe_audio(): 音声ファイルから start / end / text のセグメント配列を返す
"""

import subprocess
from pathlib import Path
from typing import Dict, List


def extract_audio(input_path: Path, audio_path: Path) -> None:
    """FFmpegで動画から16kHz・モノラルのWAVを抽出する（Whisper系の推奨フォーマット）"""
    cmd = [
        "ffmpeg", "-y",
        "-i", str(input_path),
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        str(audio_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"音声抽出(FFmpeg)に失敗しました:\n{result.stderr[-2000:]}")


# faster-whisperのモデルはロードに時間がかかるため、プロセス内でキャッシュする
_MODEL_CACHE: Dict[str, object] = {}


def _get_model(model_size: str):
    """
    faster-whisperのモデルを取得する（初回のみロードしてキャッシュ）。

    model_size: "tiny" | "base" | "small" | "medium" | "large-v3" | "large-v3-turbo" など
    Mac M3 / 16GBメモリを想定し、デフォルトはCPU + int8量子化で動作させる。
    """
    try:
        from faster_whisper import WhisperModel
    except ImportError as e:
        raise RuntimeError(
            "faster-whisper がインストールされていません。"
            "backend/requirements.txt を参考に `pip install -r requirements.txt` を実行してください。"
        ) from e

    if model_size not in _MODEL_CACHE:
        _MODEL_CACHE[model_size] = WhisperModel(
            model_size,
            device="cpu",
            compute_type="int8",
        )
    return _MODEL_CACHE[model_size]


def transcribe_audio(audio_path: Path, model_size: str = "medium") -> List[dict]:
    """
    ローカルのfaster-whisperで日本語音声を文字起こしし、
    [{"id": ..., "start": ..., "end": ..., "text": ...}, ...] 形式で返す。

    ※ whisper.cpp へ切り替える場合は、この関数の中身だけを差し替え、
      戻り値の形式（id/start/end/text の配列）を維持すればよい。
    """
    if not audio_path.exists():
        raise RuntimeError(f"音声ファイルが見つかりません: {audio_path}")

    model = _get_model(model_size)

    segments_iter, _info = model.transcribe(
        str(audio_path),
        language="ja",
        vad_filter=True,  # 無音区間を除外して精度を上げる
    )

    segments: List[dict] = []
    for i, seg in enumerate(segments_iter):
        text = seg.text.strip()
        if not text:
            continue
        segments.append({
            "id": f"segment-{i + 1}",
            "start": round(seg.start, 2),
            "end": round(seg.end, 2),
            "text": text,
        })

    if not segments:
        raise RuntimeError("文字起こし結果が空でした。音声が無音、または短すぎる可能性があります。")

    return segments
