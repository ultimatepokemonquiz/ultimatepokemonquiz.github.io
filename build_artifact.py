"""Bundles index.html/style.css/app.js/data.js into a single self-contained
web-artifact-source.html for hosting as a Claude Artifact.

Pokemon sprites are re-encoded as small embedded PNG thumbnails (data: URIs)
since a published Artifact page can't reference the local "Pokemon images"
folder or any external image host. Cry and Item Icon are disabled in this
build (window.__ARTIFACT_BUILD__) since embedding cry audio or item icons
for the full roster would make the page too large.

Re-run this after editing app.js/style.css/index.html, then republish
web-artifact-source.html via the Artifact tool (pass the existing artifact's
`url` to update it in place instead of minting a new one).
"""
import io, os, json, base64
from PIL import Image

MAX_DIM = 64

with io.open("data.js", encoding="utf-8") as f:
    data = json.loads(f.read()[len("const POKEMON_DATA = "):-2])

print("Encoding %d Pokemon sprites as %dpx thumbnails..." % (len(data["pokemon"]), MAX_DIM))
for p in data["pokemon"]:
    path = os.path.join("Pokemon images", p["file"])
    with Image.open(path) as im:
        im = im.convert("RGBA")
        w, h = im.size
        scale = MAX_DIM / max(w, h)
        im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, format="PNG", optimize=True)
        p["img"] = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")
    del p["file"]

for it in data["items"]:
    it["spriteUrl"] = None  # not embedded in this build; Item Icon quiz is disabled

datajs = "const POKEMON_DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
print("Embedded data.js size: %.2f MB" % (len(datajs.encode("utf-8")) / 1024 / 1024))

with io.open("style.css", encoding="utf-8") as f:
    css = f.read()
with io.open("app.js", encoding="utf-8") as f:
    appjs = f.read()

body = """<div class="app">
    <div class="app-brand">Ultimate Pokemon Quiz</div>
    <h1 id="pageTitle">Do They Breed?</h1>
    <p class="subtitle" id="pageSubtitle">Can these two Pokémon produce an egg together?</p>

    <div class="mode-switcher" id="modeSwitcher"></div>

    <section class="mode-panel active" id="quizPanel">
      <div class="streaks" id="streaksBox">
        <div class="streak-box">
          <div class="streak-label">Current Streak</div>
          <div class="streak-value" id="qCurrentStreak">0</div>
        </div>
        <div class="streak-box">
          <div class="streak-label">Previous Streak</div>
          <div class="streak-value" id="qPreviousStreak">0</div>
        </div>
        <div class="streak-box">
          <div class="streak-label">Longest Streak</div>
          <div class="streak-value" id="qLongestStreak">0</div>
        </div>
      </div>

      <div class="daily-progress" id="dailyProgress"></div>

      <div class="pairing" id="qPairing"></div>

      <div class="question" id="qQuestion">—</div>

      <div class="choices" id="qChoices"></div>

      <div class="result" id="qResult"></div>

      <button class="next-btn" id="qBtnNext">Next</button>
    </section>

    <p class="artifact-footnote">Playing 28 of 30 quiz modes here &mdash; Cry and Item Icon need audio/extra images too large to bundle into a shared page.</p>
  </div>
"""

parts = [
    '<meta charset="UTF-8">\n',
    "<style>\n" + css + "\n</style>\n",
    body,
    "<script>window.__ARTIFACT_BUILD__ = true;</script>\n",
    "<script>\n" + datajs + "\n</script>\n",
    "<script>\n" + appjs + "\n</script>\n",
]

with io.open("web-artifact-source.html", "w", encoding="utf-8") as f:
    f.write("".join(parts))

size = os.path.getsize("web-artifact-source.html")
print("Wrote web-artifact-source.html (%.2f MB)" % (size / 1024 / 1024))
