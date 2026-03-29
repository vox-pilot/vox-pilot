> This is a Japanese translation of README.md
> English version: [../README.md](../README.md)

# Vox Pilot

**Your voice flies your desktop.**

Vox Pilot は、AI が Windows の画面を見たり、クリックしたり、文字を入力したりできるようにする道具です。

## すごく簡単にいうと

役割はこうです。

- 音声入力ソフト: あなたの声を文字にする
- Claude Code: その文字を読んで考える
- Vox Pilot: 画面を見たり、マウスやキーボードを動かす

## 最初の設定は1回だけ

最初に1回だけ、これを実行します。

```bash
npx vox-pilot
```

これで Claude Code または Codex に Vox Pilot を登録します。

Claude Code では、あわせて安全用の skill も入ります。

- 新しい会話では、最初は `OFF`
- `ボックスパイロット開始` と言うと操作開始
- `ボックスパイロット終了` と言うと操作停止

つまり、Claude Code を閉じてまた開いても、毎回最初から設定し直す必要はありません。

## Claude Code での使い方

1. Claude Code を開く
2. `ボックスパイロット開始` と言う
3. そのあと普通に指示する

```text
Downloads フォルダを開いて
この画面を下にスクロールして
メモ帳にこんにちはと入力して
```

4. 終わりたいときは、こう言う

```text
ボックスパイロット終了
```

これで、その会話ではデスクトップ操作をやめます。

## 手動で登録する方法

### Claude Code

```bash
claude mcp add vox-pilot-screen -- npx @vox-pilot/screen
claude mcp add vox-pilot-hands -- npx @vox-pilot/hands
```

### Codex

```bash
codex mcp add vox-pilot-screen -- npx @vox-pilot/screen
codex mcp add vox-pilot-hands -- npx @vox-pilot/hands
```

## 使える主な道具

### Screen (`@vox-pilot/screen`)

- `screenshot`
- `screenshot_region`
- `list_windows`
- `get_window_info`

### Hands (`@vox-pilot/hands`)

- `mouse_click`
- `mouse_double_click`
- `mouse_right_click`
- `mouse_scroll`
- `mouse_move`
- `type_text`
- `press_key`
- `hotkey`
- `open_path`
- `focus_window`
- `perform_actions`

## 必要なもの

- Node.js 20+
- Windows 10/11
- Claude Code または Codex CLI

## License

元の [License section](../README.md#license) を参照してください。
