# Ultimate Pokemon Quiz

A Pokemon trivia app with 30 quiz modes (breeding compatibility, types, abilities,
stats, evolutions, cries, silhouettes, locations, and more) plus an "Ultimate" mode
that mixes all of them at random, and a Daily Challenge — 10 questions, the same
for everyone each day, resetting at midnight Pacific time, with a Wordle-style
results grid you can copy and paste to compare with friends. Streaks are tracked
per quiz and never repeat a question within a streak until every other question
has been asked.

This app is distributed three ways. Pick whichever fits you — they all play the
exact same game.

| Version | Best for | Setup required |
|---|---|---|
| [Windows App](#windows-app) | Windows users who want a native app window | None — just run the `.exe` |
| [Web Version](#web-version-windows--mac--linux) | Anyone, any OS, zero hassle | None — double-click a file |
| [Mac Source Build](#mac-source-build) | Mac users who want a native `.app` | ~1 minute, one command |

---

## Windows App

**Get it:** `Ultimate Pokemon Quiz - Windows App.zip`

1. Unzip it anywhere.
2. Double-click `Ultimate Pokemon Quiz.exe`.

That's it — everything (images, data, game logic) is bundled inside the single
`.exe`, so there's nothing else to install. It opens in its own native window
(built with [pywebview](https://pywebview.flowrl.com/), using Windows' built-in
WebView2 runtime, which ships with Windows 10/11 by default).

**First-run note:** Windows SmartScreen may warn that the app is from an
"unrecognized publisher" since it isn't code-signed. Click **More info → Run
anyway**. This is normal for any unsigned indie `.exe` — the file isn't malicious,
it's just not been through Microsoft's paid signing program.

The file is large (~550 MB) because every Pokemon sprite is embedded directly
inside it for fully offline play (Pokemon cries are the one exception — those
still stream from a remote server, so you'll need internet for the Cry quiz).

---

## Web Version (Windows / Mac / Linux)

**Get it:** `Ultimate Pokemon Quiz - Web (Windows+Mac).zip`

The simplest downloadable option — the game is just a self-contained folder of
web files, so it runs identically on any operating system with no build step.

1. Unzip it anywhere.
2. Double-click `index.html`.
3. It opens in your default browser and plays fully offline (again, except
   Pokemon cries, which need internet).

If your browser is configured strictly and refuses to load local files
(uncommon, but some corporate/locked-down setups do this), serve the folder
instead of double-clicking it:

```bash
cd path/to/unzipped-folder
python3 -m http.server 8000
```

Then visit `http://localhost:8000` in your browser.

---

## Mac Source Build

**Get it:** `Ultimate Pokemon Quiz - Mac Source.zip`

I can't cross-compile a native macOS app from Windows — the packaging tool
([PyInstaller](https://pyinstaller.org/)) only builds for whatever OS it's
running on. This bundle lets you build a proper `Ultimate Pokemon Quiz.app`
yourself in about a minute. You'll need Python 3 (macOS usually has it; if
not, install from [python.org](https://python.org) or run
`xcode-select --install` in Terminal).

1. Unzip the bundle.
2. Open Terminal and `cd` into the unzipped folder (you can type `cd ` and
   then drag the folder into the Terminal window).
3. Run:
   ```bash
   bash build_mac.command
   ```
4. Wait for it to finish — it installs `pywebview` and `pyinstaller`, then
   builds the app.
5. Find `Ultimate Pokemon Quiz.app` inside the new `dist` folder. Drag it to
   **Applications**. Double-click to play.

**Gatekeeper note:** since the app isn't notarized through Apple's Developer
Program, macOS will block it the first time with an "unidentified developer"
warning. Right-click the app → **Open** → **Open** once to bypass this — a
standard step for any non-App-Store app.

**Don't want to build anything?** Just double-click `index.html` in the same
folder instead — see [Web Version](#web-version-windows--mac--linux) above.
The native `.app` only buys you a proper app window instead of a browser tab;
the game itself is identical either way.

---

## Running from source (for development)

The full project (source files, all 40+ raw CSV data files the quizzes are
generated from, and the PyInstaller build config) lives outside these
distributable bundles, in the main project folder.

- `index.html`, `style.css`, `app.js`, `data.js` — the game itself. Serve
  this folder with any static file server (or just open `index.html`) to run
  it in a browser.
- `launcher.py` — wraps the same files in a `pywebview` native window.
  Run with `python launcher.py` (requires `pip install pywebview`).
- `Ultimate Pokemon Quiz.spec` — the PyInstaller build config used to
  produce the Windows `.exe`. Rebuild with `pyinstaller "Ultimate Pokemon Quiz.spec"`.
- The `*.csv` files and `pokemon_national_dex.xlsx` are the raw source data
  (Pokemon stats, moves, items, abilities, egg groups, locations, etc.) that
  `data.js` was generated from — not needed to run the game, only to
  regenerate its data.

## Notes

- All game data is pre-baked into `data.js` at build time — none of the
  versions need a network connection except for playing Pokemon cries
  (streamed from a remote CDN) and, in the Mac Source Build's case, the
  one-time `pip install` during setup.
- The **Move PP** quiz uses each move's real Generation IX base PP value.
- The **Daily Challenge** is deterministic: everyone who opens it on the same
  calendar date (Pacific time) gets the identical 10 questions in the
  identical order, so scores are genuinely comparable when shared.
- The **Move Set** quiz excludes Mew from its accepted answers — Mew's
  movepool is broad enough to trivially answer almost any four-move
  combination, so it's rejected with a prompt to pick a different Pokemon.
