"""
字幕自動生成Webアプリ バックエンド（FastAPI）

エンドポイント:
- POST   /upload              動画アップロード -> job_id を返す
- POST   /transcribe/{job_id} 音声抽出 + 文字起こし -> 字幕セグメントを返す
- POST   /render/{job_id}     編集済み字幕 + スタイル -> 字幕焼き込み動画を生成
- GET    /status/{job_id}     現在の処理状況を返す
- GET    /download/{job_id}   完成動画をダウンロード
- DELETE /cleanup/{job_id}    一時ファイルを削除
"""

import shutil
import uuid
from pathlib import Path
from typing import List

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from cleanup import cleanup_job
from render import burn_subtitles
from subtitles import Segment, StyleSettings, generate_ass, generate_srt
from transcribe import extract_audio, transcribe_audio

BASE_DIR = Path(__file__).resolve().parent
TEMP_DIR = BASE_DIR / "temp"
TEMP_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".m4v", ".webm"}
MAX_UPLOAD_BYTES = 500 * 1024 * 1024  # MVPの目安上限（500MB）

app = FastAPI(title="Subtitle Video App API")

# Next.jsの開発サーバーと、同じWi-Fi上のスマホからの開発アクセスを許可する
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=(
        r"^http://("
        r"localhost|127\.0\.0\.1|"
        r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}|"
        r"172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|"
        r"192\.168\.\d{1,3}\.\d{1,3}"
        r")(:\d+)?$"
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ジョブの処理状況を保持する簡易ストア（MVPのためインメモリ。プロセス再起動で消える）
JOBS: dict = {}


def get_job_dir(job_id: str) -> Path:
    job_dir = TEMP_DIR / job_id
    if not job_dir.exists():
        raise HTTPException(status_code=404, detail="job_id が見つかりません（アップロードからやり直してください）")
    return job_dir


@app.get("/")
def health_check():
    return {"status": "ok", "message": "Subtitle Video App API is running"}


@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    """動画をアップロードし、以降の処理で使うjob_idを発行する"""
    original_name = file.filename or ""
    ext = Path(original_name).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"対応していない動画形式です（{ext or '不明'}）。mp4 / mov / m4v / webm をご利用ください。",
        )

    # ユーザー入力のファイル名は使わず、安全なjob_idでディレクトリ・ファイル名を決める
    job_id = uuid.uuid4().hex
    job_dir = TEMP_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    input_path = job_dir / "input.mp4"

    size = 0
    try:
        with open(input_path, "wb") as f:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=400,
                        detail="ファイルサイズが大きすぎます（MVPの上限は500MBです）",
                    )
                f.write(chunk)
    except HTTPException:
        shutil.rmtree(job_dir, ignore_errors=True)
        raise
    except Exception as e:
        shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"アップロードに失敗しました: {e}")

    JOBS[job_id] = {"status": "uploaded", "error": None}
    return {"job_id": job_id, "status": "uploaded"}


@app.post("/transcribe/{job_id}")
def transcribe(job_id: str, model_size: str = "medium"):
    """
    動画から音声を抽出し、ローカルWhisper系モデルで文字起こしを行う。
    model_size は将来 "large-v3-turbo" 等に切り替えられるようクエリパラメータにしている。
    """
    job_dir = get_job_dir(job_id)
    input_path = job_dir / "input.mp4"
    if not input_path.exists():
        raise HTTPException(status_code=404, detail="アップロード済みの動画が見つかりません")

    JOBS.setdefault(job_id, {})["status"] = "extracting_audio"
    audio_path = job_dir / "audio.wav"

    try:
        extract_audio(input_path, audio_path)

        JOBS[job_id]["status"] = "transcribing"
        segments = transcribe_audio(audio_path, model_size=model_size)

        JOBS[job_id]["status"] = "transcribed"
        JOBS[job_id]["error"] = None
        return {"job_id": job_id, "segments": segments}
    except Exception as e:
        JOBS[job_id]["status"] = "error"
        JOBS[job_id]["error"] = str(e)
        raise HTTPException(status_code=500, detail=f"文字起こしに失敗しました: {e}")


class SegmentIn(BaseModel):
    id: str
    start: float
    end: float
    text: str


class StyleIn(BaseModel):
    fontSize: int = 64
    textColor: str = "#FFFFFF"
    outlineColor: str = "#000000"
    outlineWidth: int = 4
    shadow: bool = True
    position: str = "bottom"  # "bottom" | "middle" | "top"
    backgroundBox: bool = False


class RenderRequest(BaseModel):
    segments: List[SegmentIn] = Field(..., min_length=1)
    style: StyleIn


@app.post("/render/{job_id}")
def render(job_id: str, req: RenderRequest):
    """編集済み字幕データとスタイル設定を受け取り、ASS字幕を生成して動画に焼き込む"""
    job_dir = get_job_dir(job_id)
    input_path = job_dir / "input.mp4"
    if not input_path.exists():
        raise HTTPException(status_code=404, detail="アップロード済みの動画が見つかりません")

    JOBS.setdefault(job_id, {})["status"] = "generating_subtitle"
    ass_path = job_dir / "subtitle.ass"
    srt_path = job_dir / "subtitle.srt"
    output_path = job_dir / "output.mp4"

    segments = [Segment(**s.model_dump()) for s in req.segments]
    style = StyleSettings(**req.style.model_dump())

    try:
        generate_ass(segments, style, ass_path)
        generate_srt(segments, srt_path)  # 将来のSRT単体ダウンロードに備えて生成しておく

        JOBS[job_id]["status"] = "rendering"
        burn_subtitles(input_path, ass_path, output_path, crf=16)

        JOBS[job_id]["status"] = "done"
        JOBS[job_id]["error"] = None
        return {"job_id": job_id, "status": "done", "download_url": f"/download/{job_id}"}
    except Exception as e:
        JOBS[job_id]["status"] = "error"
        JOBS[job_id]["error"] = str(e)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/status/{job_id}")
def get_status(job_id: str):
    job = JOBS.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job_id が見つかりません")
    return {"job_id": job_id, **job}


@app.get("/download/{job_id}")
def download(job_id: str):
    job_dir = get_job_dir(job_id)
    output_path = job_dir / "output.mp4"
    if not output_path.exists():
        raise HTTPException(status_code=404, detail="完成した動画がまだありません（先に/renderを実行してください）")
    return FileResponse(
        path=output_path,
        media_type="video/mp4",
        filename=f"{job_id}_subtitled.mp4",
    )


@app.delete("/cleanup/{job_id}")
def cleanup(job_id: str):
    job_dir = TEMP_DIR / job_id
    cleanup_job(job_dir)
    JOBS.pop(job_id, None)
    return {"job_id": job_id, "status": "cleaned"}
