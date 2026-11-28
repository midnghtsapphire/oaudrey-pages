# Browser cut cleaner

A static, browser-only version of the Emmyliette cut cleaner. It needs no server, no Python, and no paid services. All work happens in your browser. The song is not uploaded anywhere.

This folder can be served as-is, including from Cloudflare Pages, by publishing `web/cleaner/` as the site root.

## Use it

1. Serve this folder with any static file host, or locally:

   ```bash
   python3 -m http.server 8766 --bind 127.0.0.1 --directory web/cleaner
   ```

   Then open http://127.0.0.1:8766/.

2. Choose a WAV or MP3.
3. Listen to flagged spots. Leave a spot on **Cut**, or press **Keep**.
4. Optionally cut a section (3, 5, or 10 seconds, or a typed range), fix a bad note, or try a polish preset. Preview first.
5. Download the report (`.md` or `.json`). If anything changed, download the cleaned WAV. Your original file is never changed.

If nothing changed, the report says **No artifacts found, nothing was changed** and the cleaned WAV download stays off.

Polish presets (our names): **Full lift** (about -9 LUFS), **Even lift** (about -12 LUFS), **Soft lift** (about -16 LUFS), **Voice forward**, and **Band forward**.

There is no tracking, analytics, CDN, or affiliate code. There is no agent branding.

## Gaps compared with the Python tool

The Python tool (`bash scripts/cleaner.sh` or `python -m emmyliette.cleaner`) still does more, because it can use ffmpeg, rubberband, and (if installed) demucs. This browser version is a free, local approximation.

- **No MP3 output.** Download is 16-bit PCM WAV only. The Python tool can also write a 32-bit float WAV and an MP3.
- **No save-next-to-original.** The browser can only download a new file. It cannot write beside the song on disk.
- **No CLI.** There is no `--cut`, `--pitch`, or `--lift` command line.
- **Pitch quality.** Pitch uses a plain JavaScript phase vocoder, not ffmpeg rubberband. Snap uses a local YIN tracker, not librosa.pyin. A short region still works; quality may be lower than the Python tool.
- **Loudness.** Full / Even / Soft lift use an in-browser BS.1770-style LUFS estimate, not ffmpeg loudnorm. The targets are still about -9, -12, and -16 LUFS, but the measured value can differ slightly from the Python tool.
- **No demucs split.** Voice forward and Band forward always use mid/side balance. The optional slower stem split from the Python tool is not available here.
- **Auto-detect frames** are rounded up to a power of two for the in-browser FFT, so flagged times can differ slightly from the Python tool. Auto cuts are still capped at 3 seconds and still get an equal-power crossfade. Manual cuts can be any length.
- **Formats.** WAV and MP3 are supported when the browser can decode them. Other types only work if this browser already knows them. There is no ffmpeg fallback.
- **Long songs** can take a few seconds to analyze or polish, because everything runs in the tab.

The Python tool remains the more accurate local editor when you can install ffmpeg and run it on your computer.
