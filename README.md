# 自動字幕付け Webアプリ（MVP）

動画をアップロードすると、**ローカル環境の音声認識のみ**で文字起こしを行い、字幕の見た目（色・縁取り・サイズ・位置など）を指定して、字幕付き動画をダウンロードできるWebアプリです。

**有料API・有料クラウドは一切使用しません。** 音声認識には faster-whisper（ローカル実行のWhisper系モデル）を使用します。

---

## 概要

- フロントエンド: Next.js (App Router) + TypeScript + Tailwind CSS
- バックエンド: FastAPI + Python
- 動画処理: FFmpeg（音声抽出・字幕焼き込み）
- 音声認識: faster-whisper（ローカル実行、CPU + int8量子化）
- 字幕形式: ASS（見た目の細かい指定が可能）。SRTも同時に生成します

対応範囲（MVP）: 5分以内・1080p程度の動画を想定しています。長尺動画は将来対応予定です。

---

## 必要環境

- Mac (M3 / メモリ16GB 想定。それ以外のMac/Linuxでも基本的には動作します)
- Python 3.10以上
- Node.js 18以上
- FFmpeg
- ディスク空き容量: モデルファイル + 動画の一時ファイル分（数GB程度の余裕を推奨）

---

## FFmpegのインストール方法（Mac / Homebrew）

```bash
brew install ffmpeg
```

インストール後、以下でバージョンが表示されることを確認してください。

```bash
ffmpeg -version
```

---

## バックエンドのセットアップと起動方法

```bash
cd backend

# 仮想環境の作成（初回のみ）
python3 -m venv .venv
source .venv/bin/activate

# 依存パッケージのインストール（初回のみ。数分〜十数分かかることがあります）
pip install -r requirements.txt

# サーバー起動
uvicorn main:app --reload --port 8000
```

起動後、ブラウザで `http://localhost:8000` にアクセスし、
`{"status":"ok", ...}` が表示されれば正常に起動しています。

---

## フロントエンドのセットアップと起動方法

別のターミナルを開いて実行してください。

```bash
cd frontend

# 依存パッケージのインストール（初回のみ）
npm install

# 開発サーバー起動
npm run dev
```

起動後、ブラウザで `http://localhost:3000` を開いてください。

バックエンドのURLを変更したい場合は、`frontend/.env.local` を作成し以下を設定してください。

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## iPhoneなど同じWi-Fi上のスマホで試す方法

重い処理（Whisperでの文字起こし、FFmpegでの書き出し）はMac側で実行し、スマホは操作画面として使います。

1. MacのIPアドレスを確認します。

```bash
ipconfig getifaddr en0
```

2. バックエンドを外部端末から見える形で起動します。

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

3. フロントエンドのAPI接続先をMacのIPにします。

```bash
cd frontend
cat > .env.local <<'EOF'
NEXT_PUBLIC_API_BASE_URL=http://MacのIPアドレス:8000
EOF
```

例:

```bash
NEXT_PUBLIC_API_BASE_URL=http://192.168.1.20:8000
```

4. フロントエンドも外部端末から見える形で起動します。

```bash
npm run dev:host
```

5. iPhoneのSafariまたはChromeで以下を開きます。

```text
http://MacのIPアドレス:3000
```

スマホ側では動画の選択、アップロード進捗、文字起こし待機、字幕編集、スタイル調整、書き出し待機、完成動画の確認とダウンロードができます。動画処理自体はMac側で行われるため、スマホ単体でWhisperやFFmpegを動かす必要はありません。

---

## Whisperモデルの準備方法

faster-whisperはモデルを**初回実行時に自動でダウンロード**します（Hugging Face経由、無料）。
手動でのダウンロード作業は不要です。初回の文字起こし実行時にネットワーク接続が必要な点のみご注意ください（2回目以降はキャッシュされます）。

- デフォルトのモデルサイズは `medium` です（`backend/main.py` の `/transcribe` エンドポイントで指定）
- 将来的に `large-v3-turbo` 等に切り替えたい場合は、フロントエンドから送る `model_size` クエリパラメータ、
  または `backend/transcribe.py` の `_get_model()` の呼び出し箇所を変更してください
- Mac M3 / 16GBメモリでは、`medium` モデルはCPU実行でも実用的な速度で動作します

### whisper.cppへの切り替えについて（将来対応）

現在の実装は `faster-whisper` を使用しています（pipだけでインストールでき、MVPとして最も導入しやすいため）。
`whisper.cpp` に切り替えたい場合は、`backend/transcribe.py` の `transcribe_audio()` 関数の中身だけを
whisper.cppバイナリの呼び出し（subprocess経由）に差し替えてください。戻り値の形式
（`id` / `start` / `end` / `text` を持つセグメント配列）を維持すれば、他のコードは変更不要です。

---

## 使い方

1. `http://localhost:3000` を開く
2. 「動画をアップロード」から動画ファイル（mp4 / mov / m4v / webm、5分以内・1080p程度を推奨）を選択
3. 「文字起こしを開始」を押す（音声抽出→ローカルWhisperでの文字起こしが実行されます）
4. 文字起こし結果が下部の編集エリアに表示されるので、必要に応じてテキストを修正する
5. 右側のパネルで文字色・縁取り色・文字サイズ・縁取りの太さ・位置・影・背景ボックスの有無を指定する
6. 「字幕を焼き込んで書き出す」を押す（FFmpegによる再エンコードが実行されます）
7. 完了したら「完成した動画をダウンロード」から字幕付きMP4を取得する

---

## 画質についての注意

- 字幕を動画に焼き込む（ハードサブ）場合、**映像の再エンコードが必須**です（字幕をピクセルとして描画するため）
- 画質劣化をなるべく抑えるため、`CRF 16` ・ `preset slow` の高画質設定を使用しています
  - CRF値は小さいほど高画質・ファイルサイズも大きくなります
- 音声は可能な限り無劣化コピー（`-c:a copy`）を行い、コンテナ非対応などでコピーに失敗した場合のみ
  AAC（192kbps）への再エンコードにフォールバックします
- 将来的に「映像を再エンコードしないソフト字幕版（字幕ファイルを動画に多重化するだけの方式）」にも
  対応できるよう、字幕生成（`subtitles.py`）と焼き込み（`render.py`）の処理を分離しています

---

## 一時ファイルについての注意

- アップロードされた動画・抽出した音声・生成した字幕ファイル・書き出した動画は、
  すべて `backend/temp/{job_id}/` 以下に保存されます
- `DELETE /cleanup/{job_id}` を呼ぶと、そのジョブの一時ファイルは削除されます
  （フロントエンドは新しい動画をアップロードした際に、直前のジョブを自動的にクリーンアップします）
- サーバーを停止・再起動すると、ジョブの処理状況（メモリ上のステータス）はリセットされます。
  ディスク上のファイル自体は残るため、不要な `backend/temp/` 配下のフォルダは定期的に手動削除することをおすすめします

---

## APIエンドポイント一覧

| メソッド | パス | 内容 |
|---|---|---|
| POST | `/upload` | 動画をアップロードし、`job_id` を発行 |
| POST | `/transcribe/{job_id}` | 音声抽出＋ローカル文字起こしを実行し、字幕セグメントを返す |
| POST | `/render/{job_id}` | 編集済み字幕とスタイル設定からASS字幕を生成し、動画に焼き込む |
| GET | `/status/{job_id}` | 現在の処理状況を取得 |
| GET | `/download/{job_id}` | 完成した字幕付き動画をダウンロード |
| DELETE | `/cleanup/{job_id}` | そのジョブの一時ファイルを削除 |

---

## 今後追加できる機能

- ソフト字幕版の書き出し（映像を再エンコードしない多重化方式）
- 字幕タイミングの手動調整（開始・終了時刻のドラッグ編集など）
- 単語ごとのハイライト表示
- TikTok/Reels風の字幕プリセット
- 複数スタイルプリセットの保存・切り替え
- 文字起こしモデル（tiny〜large-v3-turbo）の選択UI
- 長尺動画への対応（チャンク分割処理など）
- 非同期ジョブキュー対応（Celery / RQ等）
- 動画プレビュー上でのリアルタイム字幕表示
- 字幕ファイル（SRT/ASS）単体でのダウンロード

---

## Gitでのプロジェクト管理について

このリポジトリをgitで管理する場合は、プロジェクトルートで以下を実行してください。

```bash
cd subtitle-video-app
git init
git add .
git commit -m "Initial commit: subtitle video app MVP"
```

`.gitignore` により、`node_modules/`・`backend/.venv/`・`backend/temp/` 配下の一時ファイル
（動画・音声・生成物など）はコミット対象から除外されています。
