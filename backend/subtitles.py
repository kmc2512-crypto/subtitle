"""
字幕データ（セグメント）とスタイル設定から ASS / SRT 字幕ファイルを生成するモジュール。
"""

from dataclasses import dataclass
from pathlib import Path
from typing import List


@dataclass
class Segment:
    id: str
    start: float
    end: float
    text: str


@dataclass
class StyleSettings:
    fontFamily: str = "Hiragino Sans"
    fontSize: int = 64
    textColor: str = "#FFFFFF"
    outlineColor: str = "#000000"
    outlineWidth: int = 4
    shadow: bool = True
    position: str = "bottom"  # "bottom" | "middle" | "top"
    backgroundBox: bool = False


def _hex_to_ass_color(hex_color: str) -> str:
    """#RRGGBB 形式の色を ASS の &H00BBGGRR& 形式に変換する（アルファ00=不透明）"""
    hex_color = hex_color.lstrip("#")
    if len(hex_color) != 6:
        hex_color = "FFFFFF"
    r, g, b = hex_color[0:2], hex_color[2:4], hex_color[4:6]
    return f"&H00{b}{g}{r}".upper()


def _alignment_from_position(position: str) -> int:
    """ASSのAlignmentはnumpad方式: 2=下中央, 5=中央, 8=上中央"""
    return {"bottom": 2, "middle": 5, "top": 8}.get(position, 2)


def wrap_japanese_text(text: str, max_chars_per_line: int = 20) -> str:
    """
    日本語字幕を読みやすい長さで改行する。
    句読点（。、！？）の位置を優先して改行し、それでも長い場合は文字数で強制改行する。
    改行はASSの強制改行コード \\N を使う。
    """
    text = text.strip()
    if len(text) <= max_chars_per_line:
        return text

    break_chars = "。、！？"
    lines: List[str] = []
    current = ""
    for ch in text:
        current += ch
        if len(current) >= max_chars_per_line and ch in break_chars:
            lines.append(current)
            current = ""
        elif len(current) >= max_chars_per_line + 5:
            lines.append(current)
            current = ""
    if current:
        lines.append(current)

    return "\\N".join(lines) if lines else text


def _format_ass_time(seconds: float) -> str:
    seconds = max(0.0, seconds)
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    return f"{h:d}:{m:02d}:{s:05.2f}"


def generate_ass(segments: List[Segment], style: StyleSettings, output_path: Path) -> None:
    """
    セグメントとスタイル設定からASS字幕ファイルを生成する。
    デフォルトはSNS動画向け（白文字・黒縁・やや太め・下中央・大きめ文字）。
    """
    primary_color = _hex_to_ass_color(style.textColor)
    outline_color = _hex_to_ass_color(style.outlineColor)
    alignment = _alignment_from_position(style.position)
    shadow_depth = 2 if style.shadow else 0
    # BorderStyle: 1=アウトライン+影, 3=不透明の背景ボックス
    border_style = 3 if style.backgroundBox else 1

    header = (
        "[Script Info]\n"
        "Title: Auto-generated subtitles\n"
        "ScriptType: v4.00+\n"
        "WrapStyle: 2\n"
        "ScaledBorderAndShadow: yes\n"
        "PlayResX: 1920\n"
        "PlayResY: 1080\n"
        "\n"
        "[V4+ Styles]\n"
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, "
        "BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, "
        "BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
        f"Style: Default,Noto Sans JP,{style.fontSize},{primary_color},&H000000FF,"
        f"{outline_color},&H00000000,1,0,0,0,100,100,0,0,{border_style},"
        f"{style.outlineWidth},{shadow_depth},{alignment},40,40,60,1\n"
        "\n"
        "[Events]\n"
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
    )

    lines = [header]
    for seg in segments:
        if seg.end <= seg.start:
            continue
        start = _format_ass_time(seg.start)
        end = _format_ass_time(seg.end)
        text = wrap_japanese_text(seg.text)
        # ASSの予約文字（改行など）はwrap_japanese_text側で処理済み
        lines.append(f"Dialogue: 0,{start},{end},Default,,0,0,0,,{text}\n")

    output_path.write_text("".join(lines), encoding="utf-8")


def generate_srt(segments: List[Segment], output_path: Path) -> None:
    """将来のSRT単体ダウンロード機能などに備え、SRT形式も生成できるようにしておく"""

    def srt_time(seconds: float) -> str:
        seconds = max(0.0, seconds)
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int(round((seconds - int(seconds)) * 1000))
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    lines: List[str] = []
    for i, seg in enumerate(segments, start=1):
        if seg.end <= seg.start:
            continue
        lines.append(str(i))
        lines.append(f"{srt_time(seg.start)} --> {srt_time(seg.end)}")
        lines.append(seg.text.strip())
        lines.append("")

    output_path.write_text("\n".join(lines), encoding="utf-8")
