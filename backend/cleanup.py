"""job_idに紐づく一時ディレクトリを削除するモジュール"""

import shutil
from pathlib import Path


def cleanup_job(job_dir: Path) -> None:
    """
    temp/{job_id} ディレクトリ以下（input.mp4 / audio.wav / subtitle.ass / output.mp4 など）
    をまとめて削除する。存在しない場合は何もしない。
    """
    if job_dir.exists():
        shutil.rmtree(job_dir, ignore_errors=True)
