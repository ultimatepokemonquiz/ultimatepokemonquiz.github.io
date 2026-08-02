const IMAGE_DIR = "Pokemon images";
const UNDISCOVERED_GROUP_ID = 15;
const DITTO_GROUP_ID = 13;
const POKE_COUNT = POKEMON_DATA.pokemon.length;
const ALL_INDICES = Array.from({ length: POKE_COUNT }, (_, i) => i);
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];

POKEMON_DATA.pokemon.forEach(p => { p.learnableMovesSet = new Set(p.learnableMoves); });
function fullMoveName(id) {
  return POKEMON_DATA.moveNames[id];
}
// Mew's absurdly broad movepool makes it a trivially-correct answer for nearly any four
// moves, so it's excluded as both a seed (to guarantee a "real" answer exists) and from
// the accepted-answers list (so guessing Mew doesn't just work by default).
const MOVE_SET_SEED_INDICES = POKEMON_DATA.pokemon
  .map((p, i) => (p.name !== "Mew" && p.learnableMoves.length >= 4 ? i : -1))
  .filter(i => i >= 0);

// Explicit pairs that can never breed, regardless of shared egg groups
// (e.g. female-only Nidorina/Nidoqueen crossed with species outside their true breeding pool).
const BREEDING_EXCEPTIONS = [
  ["nidorina", "nidoking"],
  ["nidorina", "rhydon"],
  ["nidorina", "charizard"],
  ["nidoqueen", "nidoking"],
  ["nidoqueen", "rhyperior"],
  ["nidoqueen", "aggron"],
].map(pair => pair.sort().join("|"));

function normalizeName(name) {
  return name.toLowerCase().trim();
}

function isExceptionPair(nameA, nameB) {
  const key = [normalizeName(nameA), normalizeName(nameB)].sort().join("|");
  return BREEDING_EXCEPTIONS.includes(key);
}

function canBreed(pokeA, pokeB) {
  if (isExceptionPair(pokeA.name, pokeB.name)) {
    return { result: false, reason: "special-case exclusion" };
  }
  if (pokeA.eggGroups.includes(UNDISCOVERED_GROUP_ID) || pokeB.eggGroups.includes(UNDISCOVERED_GROUP_ID)) {
    return { result: false, reason: "Undiscovered egg group" };
  }
  // Ditto is its own egg group (shared with nothing else), but in the real games it can
  // breed with any Pokemon outside the Undiscovered group, not just other Ditto.
  if (pokeA.eggGroups.includes(DITTO_GROUP_ID) || pokeB.eggGroups.includes(DITTO_GROUP_ID)) {
    return { result: true, reason: "Ditto can breed with any Pokémon outside the Undiscovered egg group" };
  }
  const shared = pokeA.eggGroups.some(g => pokeB.eggGroups.includes(g));
  return {
    result: shared,
    reason: shared ? "shared egg group" : "no shared egg group",
  };
}

function eggGroupLabel(poke) {
  return poke.eggGroups.map(id => POKEMON_DATA.eggGroupNames[id]).join(", ") || "None";
}

const TYPE_NAME_BY_ID = {};
Object.entries(POKEMON_DATA.types).forEach(([id, t]) => { TYPE_NAME_BY_ID[id] = t.name; });
const ALL_TYPES = Object.entries(POKEMON_DATA.types)
  .map(([id, t]) => ({ key: Number(id), label: t.name, swatch: t.hex }))
  .sort((a, b) => a.label.localeCompare(b.label));

function typeLabel(poke) {
  return [poke.type1, poke.type2].filter(Boolean).map(id => TYPE_NAME_BY_ID[id]).join(" / ");
}

function weakTypeLabel(poke) {
  return poke.weakTypes.map(id => TYPE_NAME_BY_ID[id]).join(", ");
}

const ALL_ABILITY_IDS = Object.keys(POKEMON_DATA.abilities).map(Number);
function abilityName(id) {
  return POKEMON_DATA.abilities[id];
}

const ALL_EGG_GROUPS = Object.entries(POKEMON_DATA.eggGroupNames)
  .map(([id, name]) => ({ key: Number(id), label: name }))
  .sort((a, b) => a.label.localeCompare(b.label));

const ALL_GENERATIONS = Array.from({ length: 9 }, (_, i) => ({ key: i + 1, label: `Generation ${ROMAN[i]}` }));

const LANGUAGE_FIELDS = [
  { key: "german", label: "German" },
  { key: "french", label: "French" },
  { key: "spanish", label: "Spanish" },
  { key: "italian", label: "Italian" },
  { key: "japanese", label: "Japanese (Romanized)" },
  { key: "korean", label: "Korean (Romanized)" },
  { key: "chinese", label: "Chinese (Romanized)" },
];

const EVOLUTION_INDICES = POKEMON_DATA.pokemon
  .map((p, i) => (p.evolvesFrom || (p.evolvesInto && p.evolvesInto.length) ? i : -1))
  .filter(i => i >= 0);

// Many Pokedex categories are shared by more than one Pokemon (e.g. Drifloon and Qwilfish
// are both "Balloon Pokemon"). Rather than excluding every Pokemon with a shared category
// from the quiz, we track every name that shares each category so any of them counts as
// a correct answer — same approach as the Move Set and Location quizzes.
const CATEGORY_TO_NAMES = {};
POKEMON_DATA.pokemon.forEach(p => {
  (CATEGORY_TO_NAMES[p.category] = CATEGORY_TO_NAMES[p.category] || []).push(p.name);
});

const STAT_ITEMS = [
  { key: "hp", label: "HP" },
  { key: "attack", label: "Attack" },
  { key: "defense", label: "Defense" },
  { key: "spAtk", label: "Sp. Atk" },
  { key: "spDef", label: "Sp. Def" },
  { key: "speed", label: "Speed" },
];

const ALL_MOVES = POKEMON_DATA.moves;
const ALL_MOVE_INDICES = Array.from({ length: ALL_MOVES.length }, (_, i) => i);
const ALL_ITEMS = POKEMON_DATA.items;
const ALL_ITEM_INDICES = Array.from({ length: ALL_ITEMS.length }, (_, i) => i);

// TMs, HMs, TRs, and the Scarlet/Violet crafting materials Pokemon drop when defeated all
// reuse a small handful of generic icons (e.g. 260 different materials share just 2 sprites
// between them), so guessing the exact item from its icon alone isn't a fair question for
// these — excluded from the Item Icon pool only; they're still fair game for Item Quiz,
// which goes by description text instead.
const ITEM_ICON_EXCLUDED_CATEGORIES = ["technical-machines", "hidden-machines", "tm-materials", "technical-records"];
// Same reasoning for these name-based families: every SV DLC legendary "Treat" shares one
// icon, every numbered "Data Card" shares one icon, and every nature Mint shares one of
// just a handful of recolored icons — none of them distinguishable from their icon alone.
const ITEM_ICON_EXCLUDED_NAME_PATTERNS = [/ Treat$/, /^Data Card \d+$/, /^\w+ Mint$/];
// The Picnic feature's cosmetic customization items (tablecloths, chairs, cups, bottles,
// dishes, picks, balls) are almost all recolors of the same handful of icons — 102 of the
// 113 Picnic items share just 2 sprites. The actual sandwich ingredients in this category
// (Ham, Banana, Noodles, etc.) each have their own distinct icon, so they stay in the pool.
const PICNIC_COSMETIC_NAME_RE = /(Chairs|Tablecloth|Cup|Bottle|Dish|Pick|Ball|Set)$/;
const ITEM_ICON_INDICES = ALL_ITEMS
  .map((it, i) => {
    if (!it.spriteUrl) return -1;
    if (ITEM_ICON_EXCLUDED_CATEGORIES.includes(it.category)) return -1;
    if (ITEM_ICON_EXCLUDED_NAME_PATTERNS.some(re => re.test(it.name))) return -1;
    if (it.category === "picnic-items" && PICNIC_COSMETIC_NAME_RE.test(it.name)) return -1;
    return i;
  })
  .filter(i => i >= 0);

const GROWTH_RATE_ITEMS = ["Erratic", "Fast", "Medium Fast", "Medium Slow", "Slow", "Fluctuating"]
  .map(name => ({ key: name, label: name }));

const GENDER_RATIO_LABELS = {
  "???": "Genderless",
  "0": "0% Male / 100% Female",
  "12.5": "12.5% Male / 87.5% Female",
  "20": "20% Male / 80% Female",
  "25": "25% Male / 75% Female",
  "50": "50% Male / 50% Female",
  "75": "75% Male / 25% Female",
  "87.5": "87.5% Male / 12.5% Female",
  "100": "100% Male / 0% Female",
};
const GENDER_RATIO_ITEMS = Object.entries(GENDER_RATIO_LABELS).map(([key, label]) => ({ key, label }));

const CONTEST_TYPE_ITEMS = ["Cool", "Beauty", "Cute", "Smart", "Tough"].map(name => ({ key: name, label: name }));
const CONTEST_MOVE_INDICES = ALL_MOVES.map((m, i) => (m.contestType ? i : -1)).filter(i => i >= 0);

const ALL_CATCH_RATES = [...new Set(POKEMON_DATA.pokemon.map(p => p.catchRate))];

const ALL_NDEX_NUMBER_STRINGS = ALL_INDICES.map(i => String(i + 1));

// Full answer-format universes for autofill datalists on typed-answer quizzes. These are
// never narrowed to the correct answer for a given question — only to real, valid values
// of the expected type — so they help with spelling/format without leaking the answer.
const ALL_POKEMON_NAMES = POKEMON_DATA.pokemon.map(p => p.name);
const ALL_ABILITY_NAMES = ALL_ABILITY_IDS.map(abilityName);
const ALL_MOVE_NAMES = ALL_MOVES.map(m => m.name);
const ALL_MOVE_POWERS = [...new Set(ALL_MOVES.filter(m => m.power != null).map(m => String(m.power)))];
const MOVE_POWER_INDICES = ALL_MOVES.map((m, i) => (m.power != null ? i : -1)).filter(i => i >= 0);
const ALL_ITEM_NAMES = ALL_ITEMS.map(it => it.name);
const ALL_MOVE_PP_VALUES = [...new Set(ALL_MOVES.filter(m => m.pp != null).map(m => String(m.pp)))];
const ALL_LOCATION_NAMES = [...new Set(POKEMON_DATA.pokemon.flatMap(p => p.locations))];
const LOCATION_INDICES = POKEMON_DATA.pokemon.map((p, i) => (p.locations.length > 0 ? i : -1)).filter(i => i >= 0);

// ---------- Answer normalization (for typed answers) ----------

const GENDER_FEMALE_RE = new RegExp(String.fromCharCode(0x2640), "g");
const GENDER_MALE_RE = new RegExp(String.fromCharCode(0x2642), "g");
const COMBINING_MARKS_RE = new RegExp("[" + String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f) + "]", "g");

function normalizeAnswer(s) {
  return (s || "")
    .normalize("NFD").replace(COMBINING_MARKS_RE, "") // strip accents/diacritics
    .toLowerCase()
    .replace(GENDER_FEMALE_RE, "f")
    .replace(GENDER_MALE_RE, "m")
    .replace(/[^a-z0-9]+/g, ""); // drop spaces, punctuation, hyphens entirely for lenient matching
}

function answersMatch(userInput, correctAnswer) {
  const a = normalizeAnswer(userInput);
  return a.length > 0 && a === normalizeAnswer(correctAnswer);
}

// ---------- Generic helpers ----------

// All randomness in the app funnels through this swappable source. Normally it's
// Math.random; the Daily Challenge temporarily swaps in a seeded generator (see
// withSeededRng) so everyone gets the same 10 questions on the same PST calendar day.
let activeRng = Math.random;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(activeRng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pick(arr) {
  return arr[Math.floor(activeRng() * arr.length)];
}

function hashStringToSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return function () {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function withSeededRng(seedStr, fn) {
  const previousRng = activeRng;
  activeRng = mulberry32(hashStringToSeed(seedStr));
  try {
    return fn();
  } finally {
    activeRng = previousRng;
  }
}

// Draws items one at a time from a shuffled copy of `items`, guaranteeing every
// item is served once before any repeat. Call reset() to reshuffle early
// (used when a streak breaks, per the "no repeat within a streak" rule).
function createItemQueue(items) {
  let queue = [];
  function refill() {
    queue = shuffle(items.slice());
  }
  refill();
  return {
    next() {
      if (queue.length === 0) refill();
      return queue.pop();
    },
    reset: refill,
  };
}

// Same guarantee as createItemQueue but over every unordered pair of the first
// `n` integers, without materializing an O(n^2) list of pair objects.
function createPairQueue(n) {
  function buildPairs() {
    const pairs = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        pairs.push(i * n + j);
      }
    }
    return shuffle(pairs);
  }
  let queue = buildPairs();
  return {
    next() {
      if (queue.length === 0) queue = buildPairs();
      const code = queue.pop();
      return [Math.floor(code / n), code % n];
    },
    reset() {
      queue = buildPairs();
    },
  };
}

function createStreakTracker(currentEl, previousEl, longestEl, storageKeyBase) {
  const previousKey = `${storageKeyBase}PreviousStreak`;
  const longestKey = `${storageKeyBase}LongestStreak`;
  const tracker = {
    current: 0,
    previous: Number(localStorage.getItem(previousKey)) || 0,
    longest: Number(localStorage.getItem(longestKey)) || 0,
    onBreak: null,
  };

  function bump(el) {
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }

  tracker.render = function render() {
    currentEl.textContent = tracker.current;
    previousEl.textContent = tracker.previous;
    longestEl.textContent = tracker.longest;
  };

  tracker.register = function register(guessedCorrectly) {
    if (guessedCorrectly) {
      tracker.current += 1;
      bump(currentEl);
      if (tracker.current > tracker.longest) {
        tracker.longest = tracker.current;
        localStorage.setItem(longestKey, String(tracker.longest));
        bump(longestEl);
      }
    } else {
      const wasActive = tracker.current > 0;
      if (wasActive) {
        tracker.previous = tracker.current;
        localStorage.setItem(previousKey, String(tracker.previous));
        bump(previousEl);
      }
      tracker.current = 0;
      if (wasActive && typeof tracker.onBreak === "function") {
        tracker.onBreak();
      }
    }
    tracker.render();
  };

  return tracker;
}

// ---------- DOM builder helpers ----------

// `placeholder: true` renders a generic, non-identifying box (no image, no name) so the
// card gives away nothing about which Pokémon it is. Call card.reveal(poke) afterward to
// swap in the real image/name once the question has been answered.
// `hidden` controls how much of the Pokémon is revealed before answering:
// false (default) shows it normally; "silhouette" shows the real image blacked out (shape
// only, for "Who's That Pokémon"); "placeholder" shows nothing identifying at all (for Cry,
// where even the shape would give it away). card.reveal(poke) restores the real image/name.
function buildPokemonCardEl(poke, { clickable = false, withStat = false, hidden = false } = {}) {
  const card = document.createElement(clickable ? "button" : "div");
  card.className = "pokemon-card" + (clickable ? " clickable" : "");
  const imgWrap = document.createElement("div");
  imgWrap.className = "img-wrap";
  card.appendChild(imgWrap);
  card.imgWrapEl = imgWrap;
  const nameEl = document.createElement("div");
  nameEl.className = "poke-name";
  card.appendChild(nameEl);
  card.nameEl = nameEl;

  function fill(p, silhouette) {
    imgWrap.innerHTML = "";
    imgWrap.classList.toggle("silhouette", !!silhouette);
    const img = document.createElement("img");
    img.src = p.img || `${IMAGE_DIR}/${p.file}`;
    img.alt = silhouette ? "???" : p.name;
    imgWrap.appendChild(img);
    nameEl.textContent = silhouette ? "???" : p.name;
  }

  if (hidden === "placeholder") {
    imgWrap.classList.add("placeholder");
    imgWrap.textContent = "?";
    nameEl.textContent = "???";
  } else if (hidden === "silhouette") {
    fill(poke, true);
  } else {
    fill(poke, false);
  }

  card.reveal = function reveal(realPoke) {
    imgWrap.classList.remove("placeholder", "silhouette");
    fill(realPoke, false);
  };

  if (withStat) {
    const stat = document.createElement("div");
    stat.className = "stat-reveal";
    card.appendChild(stat);
    card.statEl = stat;
  }
  return card;
}

function buildImagePromptEl(url) {
  const card = document.createElement("div");
  card.className = "pokemon-card";
  const imgWrap = document.createElement("div");
  imgWrap.className = "img-wrap";
  const img = document.createElement("img");
  img.src = url;
  img.alt = "";
  imgWrap.appendChild(img);
  card.appendChild(imgWrap);
  return card;
}

function buildGridChoices(container, items, onPick) {
  const map = new Map();
  items.forEach(item => {
    const btn = document.createElement("button");
    btn.className = "grid-choice-btn";
    if (item.swatch) {
      const dot = document.createElement("span");
      dot.className = "type-swatch";
      dot.style.background = item.swatch;
      btn.appendChild(dot);
    }
    const label = document.createElement("span");
    label.textContent = item.label;
    btn.appendChild(label);
    btn.addEventListener("click", () => onPick(item.key));
    container.appendChild(btn);
    map.set(item.key, btn);
  });
  return map;
}

function buildYesNoChoices(container, onYes, onNo) {
  const yesBtn = document.createElement("button");
  yesBtn.className = "choice-btn yes";
  yesBtn.textContent = "Yes";
  yesBtn.addEventListener("click", onYes);
  const noBtn = document.createElement("button");
  noBtn.className = "choice-btn no";
  noBtn.textContent = "No";
  noBtn.addEventListener("click", onNo);
  container.appendChild(yesBtn);
  container.appendChild(noBtn);
  return { yesBtn, noBtn };
}

let typeInDatalistCounter = 0;

// `answerOptions`, when provided, is the full universe of valid-format answers for this
// quiz (e.g. every real Pokémon name, every real ability name) — never narrowed to just
// the correct one, so the datalist assists spelling/format without leaking the answer.
function buildTypeInAnswer(container, onSubmit, answerOptions, noteText) {
  const form = document.createElement("form");
  form.className = "typein-form";
  const input = document.createElement("input");
  input.type = "text";
  input.className = "typein-input";
  input.placeholder = "Type your answer…";
  input.autocomplete = "off";
  input.spellcheck = false;

  if (answerOptions && answerOptions.length) {
    const listId = `typeinOptions${typeInDatalistCounter++}`;
    const datalist = document.createElement("datalist");
    datalist.id = listId;
    answerOptions.forEach(opt => {
      const optEl = document.createElement("option");
      optEl.value = opt;
      datalist.appendChild(optEl);
    });
    input.setAttribute("list", listId);
    form.appendChild(datalist);
  }

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.className = "typein-submit";
  submitBtn.textContent = "Submit";
  form.appendChild(input);
  form.appendChild(submitBtn);
  form.addEventListener("submit", e => {
    e.preventDefault();
    onSubmit(input.value);
  });
  container.appendChild(form);

  const hint = document.createElement("div");
  hint.className = "typein-hint";
  container.appendChild(hint);

  if (noteText) {
    const note = document.createElement("div");
    note.className = "typein-note";
    note.textContent = noteText;
    container.appendChild(note);
  }

  setTimeout(() => input.focus(), 0);
  return { input, submitBtn, form, hint };
}

function markGridChoice(buttonMap, pickedKey, correctKeys) {
  buttonMap.forEach((btn, key) => {
    btn.disabled = true;
    if (key === pickedKey) {
      btn.classList.add(correctKeys.includes(key) ? "picked-correct" : "picked-incorrect");
    } else if (correctKeys.includes(key)) {
      btn.classList.add("reveal-correct");
    }
  });
}

// ---------- Pure question builders ----------

function finalizeMcq(poke, correct, universe, extra, distractorCount) {
  const distractorPool = shuffle(universe.filter(item => item.key !== correct.key));
  const choices = shuffle([correct, ...distractorPool.slice(0, distractorCount || 3)]);
  return Object.assign({ poke, correctKey: correct.key, correctLabel: correct.label, choices }, extra || {});
}

function buildGridSingleQuestion(queue, getCorrectKeys) {
  const poke = POKEMON_DATA.pokemon[queue.next()];
  return { poke, correctKeys: getCorrectKeys(poke) };
}

function buildCryQuestion(queue) {
  const poke = POKEMON_DATA.pokemon[queue.next()];
  const universe = POKEMON_DATA.pokemon.map(p => ({ key: p.id, label: p.name }));
  return finalizeMcq(poke, { key: poke.id, label: poke.name }, universe, { audioUrl: poke.cryUrl }, 5);
}

function buildBreedQuestion(queue) {
  const [i, j] = queue.next();
  const a = POKEMON_DATA.pokemon[i];
  const b = POKEMON_DATA.pokemon[j];
  const { result, reason } = canBreed(a, b);
  return { a, b, canBreedResult: result, reason };
}

function buildCompareQuestion(queue) {
  const [i, j] = queue.next();
  return { a: POKEMON_DATA.pokemon[i], b: POKEMON_DATA.pokemon[j] };
}

function buildCompareStatQuestion(queue) {
  const [i, j] = queue.next();
  const stat = pick(STAT_ITEMS);
  return { a: POKEMON_DATA.pokemon[i], b: POKEMON_DATA.pokemon[j], statKey: stat.key, statLabel: stat.label };
}

function buildHighestStatQuestion(queue) {
  const poke = POKEMON_DATA.pokemon[queue.next()];
  const maxVal = Math.max(...STAT_ITEMS.map(s => poke.stats[s.key]));
  const correctKeys = STAT_ITEMS.filter(s => poke.stats[s.key] === maxVal).map(s => s.key);
  return { poke, correctKeys };
}

function buildEvYieldQuestion(queue) {
  const poke = POKEMON_DATA.pokemon[queue.next()];
  const correctKeys = STAT_ITEMS.filter(s => poke.evYields[s.key] > 0).map(s => s.key);
  return { poke, correctKeys };
}

// Typed-answer builders. Each returns { poke?, promptText?, ...extras, checkAnswer(raw) }.

function buildAbilityTypeIn(queue) {
  const poke = POKEMON_DATA.pokemon[queue.next()];
  const validNames = poke.abilities.map(id => abilityName(id));
  return {
    poke,
    checkAnswer(raw) {
      const correct = validNames.some(v => answersMatch(raw, v));
      return { correct, correctDisplay: validNames.join(" / ") };
    },
  };
}

function buildMovePowerQuestion(queue) {
  const move = ALL_MOVES[queue.next()];
  return {
    move,
    promptText: move.name,
    checkAnswer(raw) {
      return { correct: answersMatch(raw, String(move.power)), correctDisplay: String(move.power) };
    },
  };
}

function buildEvolutionTypeIn(queue) {
  const poke = POKEMON_DATA.pokemon[queue.next()];
  const directions = [];
  if (poke.evolvesFrom) directions.push("from");
  if (poke.evolvesInto && poke.evolvesInto.length) directions.push("into");
  const direction = pick(directions);
  const targetId = direction === "from" ? poke.evolvesFrom : pick(poke.evolvesInto);
  const target = POKEMON_DATA.pokemon[targetId - 1];
  return {
    poke,
    direction,
    checkAnswer(raw) {
      return { correct: answersMatch(raw, target.name), correctDisplay: target.name };
    },
  };
}

function buildForeignNameQuestion(queue) {
  const poke = POKEMON_DATA.pokemon[queue.next()];
  const lang = pick(LANGUAGE_FIELDS);
  const correctName = poke.foreignNames[lang.key];
  const universe = POKEMON_DATA.pokemon
    .map(p => ({ key: p.id, label: p.foreignNames[lang.key] }))
    .filter(item => item.label);
  return finalizeMcq(poke, { key: poke.id, label: correctName }, universe, { language: lang.label });
}

function buildCategoryToNameQuestion(queue) {
  const poke = POKEMON_DATA.pokemon[queue.next()];
  const validNames = CATEGORY_TO_NAMES[poke.category];
  return {
    poke,
    promptText: `"${poke.category}"`,
    checkAnswer(raw) {
      const correct = validNames.some(name => answersMatch(raw, name));
      const shownNames = validNames.length > 12
        ? `${validNames.slice(0, 12).join(", ")}, and ${validNames.length - 12} more`
        : validNames.join(", ");
      return { correct, correctDisplay: shownNames };
    },
  };
}

function buildPokedexEntryQuestion(queue) {
  const poke = POKEMON_DATA.pokemon[queue.next()];
  return {
    poke,
    promptText: poke.pokedexEntry,
    checkAnswer(raw) {
      return { correct: answersMatch(raw, poke.name), correctDisplay: poke.name };
    },
  };
}

function buildMoveDescriptionQuestion(queue) {
  const move = ALL_MOVES[queue.next()];
  return {
    move,
    promptText: move.description,
    checkAnswer(raw) {
      return { correct: answersMatch(raw, move.name), correctDisplay: move.name };
    },
  };
}

function buildItemDescriptionQuestion(queue) {
  const item = ALL_ITEMS[queue.next()];
  return {
    item,
    promptText: item.description,
    checkAnswer(raw) {
      return { correct: answersMatch(raw, item.name), correctDisplay: item.name };
    },
  };
}

function buildMoveSetQuestion(queue) {
  const seed = POKEMON_DATA.pokemon[queue.next()];
  const moveIds = shuffle(seed.learnableMoves.slice()).slice(0, 4);
  const correctNames = POKEMON_DATA.pokemon
    .filter(p => p.name !== "Mew" && moveIds.every(id => p.learnableMovesSet.has(id)))
    .map(p => p.name);
  const moveNames = moveIds.map(fullMoveName);
  return {
    moveIds,
    moveNames,
    promptText: moveNames.map(n => `• ${n}`).join("\n"),
    checkAnswer(raw) {
      const correct = correctNames.some(name => answersMatch(raw, name));
      const shownNames = correctNames.length > 12
        ? `${correctNames.slice(0, 12).join(", ")}, and ${correctNames.length - 12} more`
        : correctNames.join(", ");
      return { correct, correctDisplay: shownNames };
    },
  };
}

function buildGrowthRateQuestion(queue) {
  const poke = POKEMON_DATA.pokemon[queue.next()];
  return { poke, correctKeys: [poke.growthRate] };
}

function buildGenderRatioQuestion(queue) {
  const poke = POKEMON_DATA.pokemon[queue.next()];
  return { poke, correctKeys: [poke.genderRatio] };
}

function buildCatchRateQuestion(queue) {
  const poke = POKEMON_DATA.pokemon[queue.next()];
  const universe = ALL_CATCH_RATES.map(v => ({ key: v, label: String(v) }));
  return finalizeMcq(poke, { key: poke.catchRate, label: String(poke.catchRate) }, universe, {});
}

function buildContestTypeQuestion(queue) {
  const move = ALL_MOVES[queue.next()];
  return { move, promptText: move.name, correctKeys: [move.contestType] };
}

function buildItemIconQuestion(queue) {
  const item = ALL_ITEMS[queue.next()];
  return {
    item,
    imageUrl: item.spriteUrl,
    checkAnswer(raw) {
      return { correct: answersMatch(raw, item.name), correctDisplay: item.name };
    },
  };
}

function buildWhosThatQuestion(queue) {
  const poke = POKEMON_DATA.pokemon[queue.next()];
  return {
    poke,
    checkAnswer(raw) {
      return { correct: answersMatch(raw, poke.name), correctDisplay: poke.name };
    },
  };
}

function buildMovePPQuestion(queue) {
  const move = ALL_MOVES[queue.next()];
  return {
    move,
    promptText: move.name,
    checkAnswer(raw) {
      const n = parseInt(String(raw).trim(), 10);
      return { correct: n === move.pp, correctDisplay: String(move.pp) };
    },
  };
}

function buildNatdexQuestion(queue) {
  const poke = POKEMON_DATA.pokemon[queue.next()];
  return {
    poke,
    checkAnswer(raw) {
      const n = parseInt(String(raw).trim(), 10);
      return { correct: n === poke.id, correctDisplay: String(poke.id) };
    },
  };
}

// Easy-difficulty variant of the National Dex # quiz: instead of typing the exact number,
// pick it from four choices.
function buildNatdexEasyQuestion(queue) {
  const poke = POKEMON_DATA.pokemon[queue.next()];
  const universe = POKEMON_DATA.pokemon.map(p => ({ key: p.id, label: String(p.id) }));
  return finalizeMcq(poke, { key: poke.id, label: String(poke.id) }, universe, {});
}

function buildLocationQuestion(queue) {
  const poke = POKEMON_DATA.pokemon[queue.next()];
  return {
    poke,
    checkAnswer(raw) {
      const correct = poke.locations.some(loc => answersMatch(raw, loc));
      const shown = poke.locations.length > 12
        ? `${poke.locations.slice(0, 12).join(", ")}, and ${poke.locations.length - 12} more`
        : poke.locations.join(", ");
      return { correct, correctDisplay: shown };
    },
  };
}

// ---------- Quiz definitions ----------

// Shared difficulty options for the four "compare" quizzes (Height, Weight, Base Stats,
// Stat Battle): Easy pairs are far apart in value (an easy call), Hard pairs are close
// together (a real judgment call), Normal doesn't filter by gap at all.
const COMPARE_DIFFICULTY_LEVELS = [
  { key: "easy", label: "Easy" },
  { key: "normal", label: "Normal" },
  { key: "hard", label: "Hard" },
];

const QUIZ_DEFS = {
  breed: {
    label: "Breeding",
    title: "Do They Breed?",
    subtitle: "Can these two Pokémon produce an egg together?",
    kind: "yesno",
    makeQueue: () => createPairQueue(POKE_COUNT),
    questionText: "Can they breed?",
    build: buildBreedQuestion,
  },
  egg: {
    label: "Egg Group",
    title: "Egg Group Quiz",
    subtitle: "Pick one of this Pokémon's real egg groups.",
    kind: "grid",
    makeQueue: () => createItemQueue(ALL_INDICES),
    items: ALL_EGG_GROUPS,
    questionText: "Which egg group does this Pokémon belong to?",
    build: queue => buildGridSingleQuestion(queue, poke => poke.eggGroups),
    explain: data => `${data.poke.name}'s egg group${data.correctKeys.length > 1 ? "s are" : " is"} ${eggGroupLabel(data.poke)}.`,
  },
  type: {
    label: "Type",
    title: "Type Quiz",
    subtitle: "Identify one of this Pokémon's types.",
    kind: "grid",
    makeQueue: () => createItemQueue(ALL_INDICES),
    items: ALL_TYPES,
    questionText: "Which type is this Pokémon?",
    build: queue => buildGridSingleQuestion(queue, poke => [poke.type1, poke.type2].filter(Boolean)),
    explain: data => `${data.poke.name}'s type${data.correctKeys.length > 1 ? "s are" : " is"} ${typeLabel(data.poke)}.`,
  },
  weakness: {
    label: "Weakness",
    title: "Weakness Quiz",
    subtitle: "Which type deals extra damage to this Pokémon?",
    kind: "grid",
    makeQueue: () => createItemQueue(ALL_INDICES),
    items: ALL_TYPES,
    questionText: "Which type is this Pokémon weak to?",
    build: queue => buildGridSingleQuestion(queue, poke => poke.weakTypes),
    explain: data => `${data.poke.name} is weak to ${weakTypeLabel(data.poke)}.`,
  },
  generation: {
    label: "Generation",
    title: "Generation Quiz",
    subtitle: "Which generation was this Pokémon introduced in?",
    kind: "grid",
    makeQueue: () => createItemQueue(ALL_INDICES),
    items: ALL_GENERATIONS,
    questionText: "Which generation was this Pokémon introduced in?",
    build: queue => buildGridSingleQuestion(queue, poke => [poke.generationId]),
    explain: data => `${data.poke.name} was introduced in Generation ${ROMAN[data.poke.generationId - 1]}.`,
  },
  growthRate: {
    label: "Growth Rate",
    title: "Growth Rate Quiz",
    subtitle: "Which leveling rate does this Pokémon use?",
    kind: "grid",
    makeQueue: () => createItemQueue(ALL_INDICES),
    items: GROWTH_RATE_ITEMS,
    questionText: "Which growth rate does this Pokémon have?",
    build: buildGrowthRateQuestion,
    explain: data => `${data.poke.name}'s growth rate is ${data.poke.growthRate}.`,
  },
  genderRatio: {
    label: "Gender Ratio",
    title: "Gender Ratio Quiz",
    subtitle: "What's this Pokémon's male/female split?",
    kind: "grid",
    makeQueue: () => createItemQueue(ALL_INDICES),
    items: GENDER_RATIO_ITEMS,
    questionText: "What is this Pokémon's gender ratio?",
    build: buildGenderRatioQuestion,
    explain: data => `${data.poke.name} is ${GENDER_RATIO_LABELS[data.poke.genderRatio]}.`,
  },
  catchRate: {
    label: "Catch Rate",
    title: "Catch Rate Quiz",
    subtitle: "Pick this Pokémon's base catch rate.",
    kind: "mcq",
    makeQueue: () => createItemQueue(ALL_INDICES),
    questionText: "What is this Pokémon's catch rate?",
    build: buildCatchRateQuestion,
    explain: data => `${data.poke.name}'s catch rate is ${data.correctLabel}.`,
  },
  contestType: {
    label: "Contest Type",
    title: "Contest Type Quiz",
    subtitle: "Which contest category does this move belong to?",
    kind: "grid",
    makeQueue: () => createItemQueue(CONTEST_MOVE_INDICES),
    items: CONTEST_TYPE_ITEMS,
    questionText: "Which contest category does this move belong to?",
    build: buildContestTypeQuestion,
    explain: data => `${data.move.name}'s contest type is ${data.move.contestType}.`,
  },
  itemIcon: {
    label: "Item Icon",
    title: "Item Icon Quiz",
    subtitle: "Type the item shown by its icon.",
    kind: "typein",
    makeQueue: () => createItemQueue(ITEM_ICON_INDICES),
    questionText: "Which item is this?",
    build: buildItemIconQuestion,
    answerOptions: ALL_ITEM_NAMES,
    explain: (data, correctDisplay) => `That was ${correctDisplay}.`,
  },
  whosThat: {
    label: "Who's That Pokémon",
    title: "Who's That Pokémon?",
    subtitle: "Type the Pokémon hiding in the silhouette.",
    kind: "typein",
    imageHidden: "silhouette",
    makeQueue: () => createItemQueue(ALL_INDICES),
    questionText: "Who's that Pokémon?",
    build: buildWhosThatQuestion,
    answerOptions: ALL_POKEMON_NAMES,
    explain: (data, correctDisplay) => `It's ${correctDisplay}!`,
  },
  movePP: {
    label: "Move PP",
    title: "Move PP Quiz",
    subtitle: "Type this move's max PP (Generation IX data).",
    kind: "typein",
    makeQueue: () => createItemQueue(ALL_MOVE_INDICES),
    questionText: "What is this move's max PP? (Gen IX data)",
    build: buildMovePPQuestion,
    answerOptions: ALL_MOVE_PP_VALUES,
    explain: (data, correctDisplay) => `${data.move.name}'s max PP is ${correctDisplay}.`,
  },
  natdexNumber: {
    label: "Natdex #",
    title: "National Dex Number Quiz",
    subtitle: "Type this Pokémon's National Dex number.",
    kind: "typein",
    makeQueue: () => createItemQueue(ALL_INDICES),
    questionText: "What is this Pokémon's National Dex number?",
    build: buildNatdexQuestion,
    answerOptions: ALL_NDEX_NUMBER_STRINGS,
    explain: data => `${data.poke.name} is National Dex #${data.poke.id}.`,
    difficultyLevels: [
      { key: "easy", label: "Easy (multiple choice)" },
      { key: "hard", label: "Hard (type the number)" },
    ],
    defaultDifficulty: "hard",
  },
  location: {
    label: "Location",
    title: "Location Quiz",
    subtitle: "Type a location where this Pokémon can be found in the wild, across any mainline game.",
    kind: "typein",
    makeQueue: () => createItemQueue(LOCATION_INDICES),
    questionText: "Where can you obtain this Pokémon?",
    build: buildLocationQuestion,
    answerOptions: ALL_LOCATION_NAMES,
    explain: (data, correctDisplay) => `${data.poke.name} can be found at: ${correctDisplay}.`,
  },
  highestStat: {
    label: "Highest Stat",
    title: "Highest Stat Quiz",
    subtitle: "Which stat is this Pokémon's highest?",
    kind: "grid",
    makeQueue: () => createItemQueue(ALL_INDICES),
    items: STAT_ITEMS,
    questionText: "Which of this Pokémon's stats is the highest?",
    build: buildHighestStatQuestion,
    explain: data => {
      const names = data.correctKeys.map(k => STAT_ITEMS.find(s => s.key === k).label);
      return `${data.poke.name}'s highest stat${names.length > 1 ? "s are" : " is"} ${names.join(", ")} (${names.map(n => {
        const item = STAT_ITEMS.find(s => s.label === n);
        return `${n}: ${data.poke.stats[item.key]}`;
      }).join(", ")}).`;
    },
  },
  evYield: {
    label: "EV Yield",
    title: "EV Yield Quiz",
    subtitle: "Which stat does defeating this Pokémon yield EVs in?",
    kind: "grid",
    makeQueue: () => createItemQueue(ALL_INDICES),
    items: STAT_ITEMS,
    questionText: "Defeating this Pokémon yields EVs in which stat?",
    build: buildEvYieldQuestion,
    explain: data => {
      const names = data.correctKeys.map(k => STAT_ITEMS.find(s => s.key === k).label);
      return `Defeating ${data.poke.name} yields EVs in ${names.join(" and ")} (${data.correctKeys.map(k => `${STAT_ITEMS.find(s => s.key === k).label}: +${data.poke.evYields[k]}`).join(", ")}).`;
    },
  },
  ability: {
    label: "Ability",
    title: "Ability Quiz",
    subtitle: "Type one of this Pokémon's real abilities.",
    kind: "typein",
    makeQueue: () => createItemQueue(ALL_INDICES),
    questionText: "Name one of this Pokémon's abilities.",
    build: buildAbilityTypeIn,
    answerOptions: ALL_ABILITY_NAMES,
    explain: (data, correctDisplay) => `${data.poke.name} can have: ${correctDisplay}.`,
  },
  movePower: {
    label: "Move Power",
    title: "Move Power Quiz",
    subtitle: "Type the move's correct base power.",
    kind: "typein",
    makeQueue: () => createItemQueue(MOVE_POWER_INDICES),
    questionText: "What is this move's base power?",
    build: buildMovePowerQuestion,
    answerOptions: ALL_MOVE_POWERS,
    explain: (data, correctDisplay) => `${data.move.name}'s base power is ${correctDisplay}.`,
  },
  foreignName: {
    label: "Foreign Name",
    title: "Foreign Name Quiz",
    subtitle: "Pick this Pokémon's name in another language.",
    kind: "mcq",
    makeQueue: () => createItemQueue(ALL_INDICES),
    questionText: data => `What is this Pokémon's name in ${data.language}?`,
    build: buildForeignNameQuestion,
    explain: data => `${data.poke.name}'s ${data.language} name is "${data.correctLabel}."`,
  },
  evolution: {
    label: "Evolution",
    title: "Evolution Quiz",
    subtitle: "Type the name of this Pokémon's evolutionary relative.",
    kind: "typein",
    makeQueue: () => createItemQueue(EVOLUTION_INDICES),
    questionText: data => (data.direction === "from" ? "Which Pokémon does this evolve from?" : "Which Pokémon does this evolve into?"),
    build: buildEvolutionTypeIn,
    answerOptions: ALL_POKEMON_NAMES,
    explain: (data, correctDisplay) => (data.direction === "from"
      ? `${data.poke.name} evolves from ${correctDisplay}.`
      : `${data.poke.name} evolves into ${correctDisplay}.`),
  },
  categoryToName: {
    label: "Category → Name",
    title: "Name That Pokémon",
    subtitle: "Given only its Pokédex category, type the Pokémon's name.",
    kind: "typein",
    makeQueue: () => createItemQueue(ALL_INDICES),
    questionText: "Which Pokémon has this Pokédex category?",
    build: buildCategoryToNameQuestion,
    answerOptions: ALL_POKEMON_NAMES,
    explain: (data, correctDisplay) => `The answer was ${correctDisplay}.`,
  },
  pokedexEntry: {
    label: "Pokédex Entry",
    title: "Name That Pokémon",
    subtitle: "Given its Pokédex entry, type the Pokémon's name.",
    kind: "typein",
    makeQueue: () => createItemQueue(ALL_INDICES),
    questionText: "Which Pokémon does this Pokédex entry describe?",
    build: buildPokedexEntryQuestion,
    answerOptions: ALL_POKEMON_NAMES,
    explain: (data, correctDisplay) => `The answer was ${correctDisplay}.`,
  },
  moveDescription: {
    label: "Move Quiz",
    title: "Move Quiz",
    subtitle: "Type the move that matches the given description.",
    kind: "typein",
    makeQueue: () => createItemQueue(ALL_MOVE_INDICES),
    questionText: "Which move matches this description?",
    build: buildMoveDescriptionQuestion,
    answerOptions: ALL_MOVE_NAMES,
    explain: (data, correctDisplay) => `The answer was ${correctDisplay}.`,
  },
  itemDescription: {
    label: "Item Quiz",
    title: "Item Quiz",
    subtitle: "Type the item that matches the given description.",
    kind: "typein",
    makeQueue: () => createItemQueue(ALL_ITEM_INDICES),
    questionText: "Which item matches this description?",
    build: buildItemDescriptionQuestion,
    answerOptions: ALL_ITEM_NAMES,
    explain: (data, correctDisplay) => `The answer was ${correctDisplay}.`,
  },
  moveSet: {
    label: "Move Set",
    title: "Move Set Quiz",
    subtitle: "Type a Pokémon that can learn all four listed moves.",
    kind: "typein",
    makeQueue: () => createItemQueue(MOVE_SET_SEED_INDICES),
    questionText: "Which Pokémon can learn all four of these moves?",
    build: buildMoveSetQuestion,
    answerOptions: ALL_POKEMON_NAMES,
    typeinNote: "Mew doesn't count as an answer here — its movepool is too broad. Pick a different Pokémon.",
    rejectAnswer: raw => (answersMatch(raw, "Mew") ? "Mew doesn't count — try a different Pokémon!" : null),
    explain: (data, correctDisplay) => `Valid answers include: ${correctDisplay}.`,
  },
  cry: {
    label: "Cry",
    title: "Cry Quiz",
    subtitle: "Listen closely — which Pokémon made that sound?",
    kind: "mcq",
    showAudioButton: true,
    imageHidden: "placeholder",
    makeQueue: () => createItemQueue(ALL_INDICES),
    questionText: "Listen to the cry — which Pokémon is this?",
    build: buildCryQuestion,
    explain: data => `That was ${data.correctLabel}'s cry!`,
  },
  weight: {
    label: "Weight",
    title: "Weight Quiz",
    subtitle: "Which Pokémon weighs more?",
    kind: "compare",
    makeQueue: () => createPairQueue(POKE_COUNT),
    questionText: "Which Pokémon is heavier?",
    build: buildCompareQuestion,
    getValue: poke => poke.weightKg,
    formatValue: v => `${v} kg`,
    compareWord: "heavier",
    difficultyLevels: COMPARE_DIFFICULTY_LEVELS,
    defaultDifficulty: "normal",
  },
  height: {
    label: "Height",
    title: "Height Quiz",
    subtitle: "Which Pokémon is taller?",
    kind: "compare",
    makeQueue: () => createPairQueue(POKE_COUNT),
    questionText: "Which Pokémon is taller?",
    build: buildCompareQuestion,
    getValue: poke => poke.heightM,
    formatValue: v => `${v} m`,
    compareWord: "taller",
    difficultyLevels: COMPARE_DIFFICULTY_LEVELS,
    defaultDifficulty: "normal",
  },
  statTotal: {
    label: "Base Stats",
    title: "Base Stat Quiz",
    subtitle: "Which Pokémon has higher total base stats?",
    kind: "compare",
    makeQueue: () => createPairQueue(POKE_COUNT),
    questionText: "Which Pokémon has higher total base stats?",
    build: buildCompareQuestion,
    getValue: poke => poke.statTotal,
    formatValue: v => `${v} BST`,
    compareWord: "higher (base stat total)",
    difficultyLevels: COMPARE_DIFFICULTY_LEVELS,
    defaultDifficulty: "normal",
  },
  compareStat: {
    label: "Stat Battle",
    title: "Stat Battle Quiz",
    subtitle: "Which Pokémon wins in the given stat?",
    kind: "compare",
    makeQueue: () => createPairQueue(POKE_COUNT),
    questionText: data => `Which Pokémon has higher ${data.statLabel}?`,
    build: buildCompareStatQuestion,
    getValue: (poke, data) => poke.stats[data.statKey],
    formatValue: v => `${v}`,
    compareWord: data => `higher ${data.statLabel}`,
    difficultyLevels: COMPARE_DIFFICULTY_LEVELS,
    defaultDifficulty: "normal",
  },
};

// The hosted single-page build can't embed 1025 sprites' worth of item icons or Pokemon
// cry audio without ballooning the page, so it disables just those two quiz types via a
// flag set before this script loads. The downloadable app/exe/web-zip builds never set
// this flag, so they keep every quiz type as normal.
const ARTIFACT_UNAVAILABLE_QUIZZES = ["cry", "itemIcon"];
const QUIZ_KEYS = (typeof window !== "undefined" && window.__ARTIFACT_BUILD__)
  ? Object.keys(QUIZ_DEFS).filter(k => !ARTIFACT_UNAVAILABLE_QUIZZES.includes(k))
  : Object.keys(QUIZ_DEFS);

// ---------- Generic quiz engine ----------

const qEl = {
  pairing: document.getElementById("qPairing"),
  question: document.getElementById("qQuestion"),
  choices: document.getElementById("qChoices"),
  result: document.getElementById("qResult"),
  btnNext: document.getElementById("qBtnNext"),
  currentStreak: document.getElementById("qCurrentStreak"),
  previousStreak: document.getElementById("qPreviousStreak"),
  longestStreak: document.getElementById("qLongestStreak"),
  streaksBox: document.getElementById("streaksBox"),
  dailyProgress: document.getElementById("dailyProgress"),
};
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");
const modeSwitcher = document.getElementById("modeSwitcher");

// Per-mode state: its own no-repeat queue and its own streak tracker, so switching
// tabs (or playing Ultimate) never disturbs another mode's progress.
const modeState = {};
QUIZ_KEYS.forEach(key => {
  modeState[key] = {
    queue: QUIZ_DEFS[key].makeQueue(),
    streak: createStreakTracker(qEl.currentStreak, qEl.previousStreak, qEl.longestStreak, `doTheyBreed.${key}`),
  };
});

// Ultimate mode keeps its own independent copy of every underlying quiz's queue (so it
// doesn't consume/exhaust the standalone version's progress) plus one shared streak.
const ultimateSubQueues = {};
QUIZ_KEYS.forEach(key => {
  ultimateSubQueues[key] = QUIZ_DEFS[key].makeQueue();
});
const ultimateStreak = createStreakTracker(qEl.currentStreak, qEl.previousStreak, qEl.longestStreak, "doTheyBreed.ultimate");
ultimateStreak.onBreak = () => Object.values(ultimateSubQueues).forEach(q => q.reset());
modeState.__ultimate = { streak: ultimateStreak };

Object.entries(modeState).forEach(([key, state]) => {
  if (key === "__ultimate") return;
  state.streak.onBreak = () => state.queue.reset();
});

let currentDisplayMode = "daily";
let currentQuestion = null;

function resolveText(textOrFn, data) {
  return typeof textOrFn === "function" ? textOrFn(data) : textOrFn;
}

// ---------- Difficulty ----------
// Difficulty is per-quiz and persisted locally. It only applies to standalone quiz mode —
// Ultimate always mixes at full randomness, and the Daily Challenge must stay identical for
// every player on a given day, so neither one lets a personal difficulty preference change
// what gets asked.

const DIFFICULTY_STORAGE_PREFIX = "doTheyBreed.difficulty.";

function getDifficulty(key) {
  const def = QUIZ_DEFS[key];
  if (!def.difficultyLevels) return null;
  return localStorage.getItem(DIFFICULTY_STORAGE_PREFIX + key) || def.defaultDifficulty;
}

function setDifficulty(key, level) {
  localStorage.setItem(DIFFICULTY_STORAGE_PREFIX + key, level);
}

// Resolves a quiz definition to its difficulty-adjusted form for standalone play. Only
// National Dex # currently swaps its question shape (typed number vs. multiple choice);
// the compare quizzes keep their normal shape and are adjusted via buildQuestionData instead.
function getEffectiveDef(key) {
  const def = QUIZ_DEFS[key];
  if (key === "natdexNumber" && getDifficulty(key) === "easy") {
    return Object.assign({}, def, { kind: "mcq", build: buildNatdexEasyQuestion });
  }
  return def;
}

// How close two compared values are, from 0 (very different) to 1 (identical/tied).
function compareGapRatio(def, data) {
  const valA = def.getValue(data.a, data);
  const valB = def.getValue(data.b, data);
  const lo = Math.min(valA, valB);
  const hi = Math.max(valA, valB);
  return hi === 0 ? 1 : lo / hi;
}

function acceptCompareQuestion(def, data, difficultyKey) {
  const valA = def.getValue(data.a, data);
  const valB = def.getValue(data.b, data);
  if (valA === valB) return false; // ties are never asked, regardless of difficulty
  if (difficultyKey === "hard") return compareGapRatio(def, data) >= 0.85;
  if (difficultyKey === "easy") return compareGapRatio(def, data) <= 0.5;
  return true; // "normal" (or no difficulty set, e.g. Ultimate/Daily) — any non-tie pair
}

// Builds one question's data, redrawing from the queue as needed to avoid ties in compare
// quizzes (and, for standalone play, to honor the selected difficulty's value-gap target).
// Bails out after a generous number of tries so an unusual queue state can never hang.
function buildQuestionData(def, queue, difficultyKey) {
  if (def.kind !== "compare") return def.build(queue);
  let data;
  let guard = 0;
  do {
    data = def.build(queue);
    guard++;
  } while (!acceptCompareQuestion(def, data, difficultyKey) && guard < 500);
  return data;
}

function renderYesNo(def, data) {
  qEl.pairing.className = "pairing";
  qEl.pairing.appendChild(buildPokemonCardEl(data.a));
  const vs = document.createElement("div");
  vs.className = "vs";
  vs.textContent = "×";
  qEl.pairing.appendChild(vs);
  qEl.pairing.appendChild(buildPokemonCardEl(data.b));
  qEl.choices.className = "choices";
  buildYesNoChoices(
    qEl.choices,
    () => handleYesNoAnswer(true),
    () => handleYesNoAnswer(false)
  );
}

function renderGrid(def, data) {
  qEl.pairing.className = "single-pairing";
  if (data.promptText) {
    const box = document.createElement("div");
    box.className = "prompt-box";
    box.textContent = data.promptText;
    qEl.pairing.appendChild(box);
  } else if (data.poke) {
    qEl.pairing.appendChild(buildPokemonCardEl(data.poke));
  }
  qEl.choices.className = "choices grid-choices";
  currentQuestion.buttons = buildGridChoices(qEl.choices, def.items, key => handleGridAnswer(key));
}

function renderMcq(def, data) {
  qEl.pairing.className = "single-pairing";
  const card = buildPokemonCardEl(data.poke, { hidden: def.imageHidden || false });
  qEl.pairing.appendChild(card);
  currentQuestion.card = card;
  if (def.showAudioButton) {
    const playBtn = document.createElement("button");
    playBtn.className = "cry-play-btn";
    playBtn.textContent = "▶ Play Cry";
    const audio = new Audio(data.audioUrl);
    playBtn.addEventListener("click", () => {
      audio.currentTime = 0;
      audio.play();
    });
    qEl.pairing.appendChild(playBtn);
    audio.play().catch(() => {});
  }
  qEl.choices.className = "choices grid-choices four-up";
  currentQuestion.buttons = buildGridChoices(qEl.choices, data.choices, key => handleMcqAnswer(key));
}

function renderCompare(def, data) {
  qEl.pairing.className = "pairing";
  const cardA = buildPokemonCardEl(data.a, { clickable: true, withStat: true });
  const vs = document.createElement("div");
  vs.className = "vs";
  vs.textContent = "×";
  const cardB = buildPokemonCardEl(data.b, { clickable: true, withStat: true });
  cardA.addEventListener("click", () => handleCompareAnswer(def, data, "A", cardA, cardB));
  cardB.addEventListener("click", () => handleCompareAnswer(def, data, "B", cardA, cardB));
  qEl.pairing.appendChild(cardA);
  qEl.pairing.appendChild(vs);
  qEl.pairing.appendChild(cardB);
  qEl.choices.className = "choices";
  currentQuestion.cards = { A: cardA, B: cardB };
}

function renderTypeIn(def, data) {
  qEl.pairing.className = "single-pairing";
  if (data.promptText) {
    const box = document.createElement("div");
    box.className = "prompt-box";
    box.textContent = data.promptText;
    qEl.pairing.appendChild(box);
  } else if (data.imageUrl) {
    qEl.pairing.appendChild(buildImagePromptEl(data.imageUrl));
  } else if (data.poke) {
    const card = buildPokemonCardEl(data.poke, { hidden: def.imageHidden || false });
    qEl.pairing.appendChild(card);
    currentQuestion.card = card;
  }
  qEl.choices.className = "choices typein-choices";
  const answerOptions = resolveText(def.answerOptions, data);
  currentQuestion.typein = buildTypeInAnswer(qEl.choices, value => handleTypeInAnswer(value), answerOptions, def.typeinNote);
}

function renderQuestionByKind(def, data) {
  clearAutoAdvanceTimer();
  qEl.pairing.innerHTML = "";
  qEl.choices.innerHTML = "";
  qEl.result.innerHTML = "";
  qEl.btnNext.classList.remove("visible");
  qEl.btnNext.textContent = "Next";
  qEl.question.textContent = resolveText(def.questionText, data);

  if (def.kind === "yesno") renderYesNo(def, data);
  else if (def.kind === "grid") renderGrid(def, data);
  else if (def.kind === "mcq") renderMcq(def, data);
  else if (def.kind === "compare") renderCompare(def, data);
  else if (def.kind === "typein") renderTypeIn(def, data);
}

function loadQuestion() {
  const isStandalone = currentDisplayMode !== "ultimate";
  const effectiveKey = isStandalone ? currentDisplayMode : pick(QUIZ_KEYS);
  const def = isStandalone ? getEffectiveDef(effectiveKey) : QUIZ_DEFS[effectiveKey];
  const queue = isStandalone ? modeState[effectiveKey].queue : ultimateSubQueues[effectiveKey];
  const difficultyKey = isStandalone ? getDifficulty(effectiveKey) : null;
  const data = buildQuestionData(def, queue, difficultyKey);

  currentQuestion = { key: effectiveKey, def, data, answered: false };
  renderQuestionByKind(def, data);
}

function activeStreak() {
  return currentDisplayMode === "ultimate" ? modeState.__ultimate.streak : modeState[currentDisplayMode].streak;
}

function finishQuestion(guessedCorrectly, explainText) {
  currentQuestion.answered = true;

  if (currentDisplayMode === "daily") {
    finishDailyQuestion(guessedCorrectly, explainText);
    return;
  }

  activeStreak().register(guessedCorrectly);

  const verdictClass = guessedCorrectly ? "verdict-correct" : "verdict-incorrect";
  const verdictText = guessedCorrectly ? "Correct!" : "Incorrect!";
  const tag = currentDisplayMode === "ultimate"
    ? `<span class="quiz-type-tag">${QUIZ_DEFS[currentQuestion.key].label} Quiz</span>`
    : "";
  qEl.result.innerHTML = `
    ${tag}
    <span class="${verdictClass}">${verdictText}</span>
    <span class="explain">${explainText}</span>
  `;
  qEl.btnNext.classList.add("visible");
  scheduleAutoAdvance();
}

function handleYesNoAnswer(guessYes) {
  if (currentQuestion.answered) return;
  const { data } = currentQuestion;
  const guessedCorrectly = guessYes === data.canBreedResult;
  const answerText = data.canBreedResult
    ? `${data.a.name} and ${data.b.name} CAN breed (${data.reason}).`
    : `${data.a.name} and ${data.b.name} CANNOT breed (${data.reason}).`;
  finishQuestion(guessedCorrectly, answerText);
}

function handleGridAnswer(pickedKey) {
  if (currentQuestion.answered) return;
  const { def, data, buttons } = currentQuestion;
  const guessedCorrectly = data.correctKeys.includes(pickedKey);
  markGridChoice(buttons, pickedKey, data.correctKeys);
  finishQuestion(guessedCorrectly, def.explain(data));
}

function handleMcqAnswer(pickedKey) {
  if (currentQuestion.answered) return;
  const { def, data, buttons } = currentQuestion;
  const guessedCorrectly = pickedKey === data.correctKey;
  markGridChoice(buttons, pickedKey, [data.correctKey]);
  if (def.imageHidden && currentQuestion.card) {
    currentQuestion.card.reveal(data.poke);
  }
  finishQuestion(guessedCorrectly, def.explain(data));
}

function handleCompareAnswer(def, data, pickedSide, cardA, cardB) {
  if (currentQuestion.answered) return;
  const valA = def.getValue(data.a, data);
  const valB = def.getValue(data.b, data);
  const tie = valA === valB;
  const winnerSide = tie ? null : (valA > valB ? "A" : "B");
  const guessedCorrectly = tie || pickedSide === winnerSide;

  cardA.statEl.textContent = def.formatValue(valA);
  cardB.statEl.textContent = def.formatValue(valB);
  cardA.disabled = true;
  cardB.disabled = true;
  const pickedCard = pickedSide === "A" ? cardA : cardB;
  pickedCard.classList.add(guessedCorrectly ? "picked-correct" : "picked-incorrect");
  if (!tie && !guessedCorrectly) {
    (winnerSide === "A" ? cardA : cardB).classList.add("reveal-correct");
  }

  const compareWord = resolveText(def.compareWord, data);
  const answerText = tie
    ? `${data.a.name} and ${data.b.name} are tied!`
    : `${winnerSide === "A" ? data.a.name : data.b.name} is ${compareWord} (${data.a.name}: ${def.formatValue(valA)} · ${data.b.name}: ${def.formatValue(valB)}).`;
  finishQuestion(guessedCorrectly, answerText);
}

function handleTypeInAnswer(raw) {
  if (currentQuestion.answered) return;
  if (!raw || !raw.trim()) return;
  const { def, data } = currentQuestion;

  if (def.rejectAnswer) {
    const rejectMsg = def.rejectAnswer(raw, data);
    if (rejectMsg) {
      currentQuestion.typein.hint.textContent = rejectMsg;
      currentQuestion.typein.input.value = "";
      currentQuestion.typein.input.focus();
      return;
    }
  }

  const { correct, correctDisplay } = data.checkAnswer(raw);

  currentQuestion.typein.input.disabled = true;
  currentQuestion.typein.submitBtn.disabled = true;
  currentQuestion.typein.input.classList.add(correct ? "correct" : "incorrect");

  if (def.imageHidden && currentQuestion.card) {
    currentQuestion.card.reveal(data.poke);
  } else if (data.promptText && data.poke) {
    const revealCard = buildPokemonCardEl(data.poke);
    revealCard.classList.add("reveal-card");
    qEl.pairing.appendChild(revealCard);
  }

  finishQuestion(correct, def.explain(data, correctDisplay, raw));
}

qEl.btnNext.addEventListener("click", () => {
  if (currentDisplayMode === "daily") {
    advanceDaily();
  } else {
    loadQuestion();
  }
});

// ---------- Daily Challenge ----------
// A fixed set of 10 questions, deterministically generated from the current calendar
// date in Pacific time, so every player gets the identical challenge that day (and it
// rolls over at midnight PST regardless of the player's own timezone) — this is what
// makes the shareable result meaningful to compare with friends.

const DAILY_QUESTION_COUNT = 10;
const DAILY_STORAGE_KEY = "doTheyBreed.dailyChallenge";
const DAILY_SCORE_HISTORY_KEY = "doTheyBreed.dailyScoreHistory";

const SUPABASE_URL = "https://akafgvitcspshlzrexqq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrYWZndml0Y3Nwc2hsenJleHFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwODU2MTcsImV4cCI6MjEwMDY2MTYxN30.rFoEiSxp_6MG3IkCVg_-qG7Ykaf4sRlBJKVzHvtSTzI";

function getPSTDateString(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date || new Date());
}

function getYesterdayPSTDateString() {
  return getPSTDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
}

// This player's own daily-challenge scores, kept locally so "your score yesterday"
// works even though Supabase has no concept of "this specific player."
function loadScoreHistory() {
  try {
    return JSON.parse(localStorage.getItem(DAILY_SCORE_HISTORY_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveScoreForDate(dateStr, score) {
  const history = loadScoreHistory();
  history[dateStr] = score;
  localStorage.setItem(DAILY_SCORE_HISTORY_KEY, JSON.stringify(history));
}

function getScoreForDate(dateStr) {
  const history = loadScoreHistory();
  return Object.prototype.hasOwnProperty.call(history, dateStr) ? history[dateStr] : null;
}

// Cross-player average, via Supabase. Both calls are best-effort: a network hiccup
// should never block or break the results screen, so failures resolve to null/no-op
// rather than throwing.
function submitDailyScore(dateStr, score) {
  fetch(`${SUPABASE_URL}/rest/v1/daily_scores`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ challenge_date: dateStr, score }),
  }).catch(() => {});
}

async function fetchAverageScoreForDate(dateStr) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/daily_scores?challenge_date=eq.${dateStr}&select=score`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const average = rows.reduce((sum, r) => sum + r.score, 0) / rows.length;
    return { average, count: rows.length };
  } catch (e) {
    return null;
  }
}

function generateDailyQuestions(dateStr) {
  return withSeededRng(dateStr, () => {
    const questions = [];
    for (let i = 0; i < DAILY_QUESTION_COUNT; i++) {
      const key = pick(QUIZ_KEYS);
      const def = QUIZ_DEFS[key];
      const queue = def.makeQueue();
      const data = buildQuestionData(def, queue, null);
      questions.push({ key, data });
    }
    return questions;
  });
}

function loadDailyState(todayStr) {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(DAILY_STORAGE_KEY));
  } catch (e) {
    saved = null;
  }
  if (!saved || saved.date !== todayStr) {
    saved = { date: todayStr, results: [], completed: false };
  }
  return saved;
}

function saveDailyState() {
  localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(dailyState));
}

let dailyState = null;
let dailyQuestions = null;

function ensureDailyChallengeLoaded() {
  const todayStr = getPSTDateString();
  if (dailyState && dailyState.date === todayStr) return;
  dailyState = loadDailyState(todayStr);
  dailyQuestions = generateDailyQuestions(todayStr);
}

function updateDailyProgressUI() {
  const dots = Array.from({ length: DAILY_QUESTION_COUNT }, (_, i) => {
    if (i < dailyState.results.length) return dailyState.results[i] ? "🟩" : "🟥";
    if (i === dailyState.results.length) return "🔵";
    return "⚪";
  }).join(" ");
  qEl.dailyProgress.innerHTML = `
    <div>Question ${Math.min(dailyState.results.length + 1, DAILY_QUESTION_COUNT)} of ${DAILY_QUESTION_COUNT}</div>
    <div class="daily-dots">${dots}</div>
  `;
}

function renderDailyQuestion() {
  const { key, data } = dailyQuestions[dailyState.results.length];
  const def = QUIZ_DEFS[key];
  currentQuestion = { key, def, data, answered: false };
  renderQuestionByKind(def, data);
  updateDailyProgressUI();
}

function finishDailyQuestion(guessedCorrectly, explainText) {
  dailyState.results.push(guessedCorrectly);
  saveDailyState();

  const verdictClass = guessedCorrectly ? "verdict-correct" : "verdict-incorrect";
  const verdictText = guessedCorrectly ? "Correct!" : "Incorrect!";
  qEl.result.innerHTML = `
    <span class="quiz-type-tag">${QUIZ_DEFS[currentQuestion.key].label} Quiz</span>
    <span class="${verdictClass}">${verdictText}</span>
    <span class="explain">${explainText}</span>
  `;
  qEl.btnNext.textContent = dailyState.results.length >= DAILY_QUESTION_COUNT ? "See Results" : "Next Question";
  qEl.btnNext.classList.add("visible");
  updateDailyProgressUI();
  scheduleAutoAdvance();
}

function advanceDaily() {
  if (dailyState.results.length >= DAILY_QUESTION_COUNT) {
    dailyState.completed = true;
    saveDailyState();
    const score = dailyState.results.filter(Boolean).length;
    saveScoreForDate(dailyState.date, score);
    submitDailyScore(dailyState.date, score);
    renderDailyResults();
  } else {
    renderDailyQuestion();
  }
}

function buildDailyShareText() {
  const score = dailyState.results.filter(Boolean).length;
  const emojiRow = dailyState.results.map(r => (r ? "🟩" : "🟥")).join("");
  return `Ultimate Pokemon Quiz — Daily Challenge (${dailyState.date})\n${emojiRow}  ${score}/${DAILY_QUESTION_COUNT}`;
}

function renderDailyResults() {
  clearAutoAdvanceTimer();
  qEl.dailyProgress.innerHTML = "";
  qEl.pairing.innerHTML = "";
  qEl.choices.innerHTML = "";
  qEl.result.innerHTML = "";
  qEl.btnNext.classList.remove("visible");
  qEl.question.textContent = "";

  const score = dailyState.results.filter(Boolean).length;
  const emojiRow = dailyState.results.map(r => (r ? "🟩" : "🟥")).join(" ");

  const box = document.createElement("div");
  box.className = "prompt-box";
  box.textContent = `You scored ${score}/${DAILY_QUESTION_COUNT} today!\n\n${emojiRow}\n\nCome back after midnight PST for a new challenge.`;
  qEl.pairing.appendChild(box);

  const yesterdayStr = getYesterdayPSTDateString();
  const yourYesterdayScore = getScoreForDate(yesterdayStr);
  const yesterdayBox = document.createElement("div");
  yesterdayBox.className = "prompt-box daily-yesterday-box";
  yesterdayBox.textContent =
    `Your score yesterday: ${yourYesterdayScore === null ? "you didn't play" : `${yourYesterdayScore}/${DAILY_QUESTION_COUNT}`}\n` +
    "Average score yesterday: loading…";
  qEl.pairing.appendChild(yesterdayBox);
  fetchAverageScoreForDate(yesterdayStr).then(result => {
    const averageLine = result
      ? `Average score yesterday: ${result.average.toFixed(1)}/${DAILY_QUESTION_COUNT} (${result.count} player${result.count === 1 ? "" : "s"})`
      : "Average score yesterday: no data yet";
    yesterdayBox.textContent =
      `Your score yesterday: ${yourYesterdayScore === null ? "you didn't play" : `${yourYesterdayScore}/${DAILY_QUESTION_COUNT}`}\n` +
      averageLine;
  });

  qEl.choices.className = "choices daily-share-choices";
  const shareText = buildDailyShareText();

  const textarea = document.createElement("textarea");
  textarea.className = "daily-share-textarea";
  textarea.readOnly = true;
  textarea.value = shareText;
  qEl.choices.appendChild(textarea);

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "typein-submit";
  copyBtn.textContent = "Copy Results";
  copyBtn.addEventListener("click", () => {
    const done = () => {
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = "Copy Results";
      }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText).then(done, () => {
        textarea.select();
        document.execCommand("copy");
        done();
      });
    } else {
      textarea.select();
      document.execCommand("copy");
      done();
    }
  });
  qEl.choices.appendChild(copyBtn);
}

function initDailyChallenge() {
  ensureDailyChallengeLoaded();
  if (dailyState.completed) {
    renderDailyResults();
  } else {
    renderDailyQuestion();
  }
}

// ---------- Difficulty & auto-advance controls ----------

const quizPanelEl = document.getElementById("quizPanel");

const difficultyControlEl = document.createElement("div");
difficultyControlEl.className = "difficulty-control";
quizPanelEl.insertBefore(difficultyControlEl, qEl.streaksBox);

function renderDifficultyControl(mode) {
  difficultyControlEl.innerHTML = "";
  const def = mode !== "ultimate" && mode !== "daily" ? QUIZ_DEFS[mode] : null;
  if (!def || !def.difficultyLevels) {
    difficultyControlEl.style.display = "none";
    return;
  }
  difficultyControlEl.style.display = "flex";
  const label = document.createElement("span");
  label.className = "difficulty-label";
  label.textContent = "Difficulty:";
  difficultyControlEl.appendChild(label);
  const current = getDifficulty(mode);
  def.difficultyLevels.forEach(level => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "difficulty-btn" + (level.key === current ? " active" : "");
    btn.textContent = level.label;
    btn.addEventListener("click", () => {
      if (getDifficulty(mode) === level.key) return;
      setDifficulty(mode, level.key);
      renderDifficultyControl(mode);
      loadQuestion();
    });
    difficultyControlEl.appendChild(btn);
  });
}

// All randomness in the app funnels through activeRng, but this timer is real wall-clock
// time — deliberately so, since it's a UI convenience, not something the Daily Challenge's
// determinism depends on.
const AUTO_ADVANCE_MS = 3000;
let autoAdvanceEnabled = localStorage.getItem("doTheyBreed.autoAdvance") === "true";
let autoAdvanceTimer = null;

function clearAutoAdvanceTimer() {
  if (autoAdvanceTimer) {
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
}

function scheduleAutoAdvance() {
  clearAutoAdvanceTimer();
  if (!autoAdvanceEnabled) return;
  autoAdvanceTimer = setTimeout(() => {
    autoAdvanceTimer = null;
    qEl.btnNext.click();
  }, AUTO_ADVANCE_MS);
}

const autoAdvanceControlEl = document.createElement("label");
autoAdvanceControlEl.className = "auto-advance-toggle";
const autoAdvanceCheckboxEl = document.createElement("input");
autoAdvanceCheckboxEl.type = "checkbox";
autoAdvanceCheckboxEl.checked = autoAdvanceEnabled;
autoAdvanceCheckboxEl.addEventListener("change", () => {
  autoAdvanceEnabled = autoAdvanceCheckboxEl.checked;
  localStorage.setItem("doTheyBreed.autoAdvance", String(autoAdvanceEnabled));
  if (!autoAdvanceEnabled) clearAutoAdvanceTimer();
  else if (currentQuestion && currentQuestion.answered) scheduleAutoAdvance();
});
autoAdvanceControlEl.appendChild(autoAdvanceCheckboxEl);
autoAdvanceControlEl.appendChild(document.createTextNode(" Auto-advance next question (3s)"));
quizPanelEl.insertBefore(autoAdvanceControlEl, qEl.btnNext);

// ---------- Mode switcher ----------

function selectMode(mode) {
  clearAutoAdvanceTimer();
  currentDisplayMode = mode;
  [...modeSwitcher.children].forEach(btn => btn.classList.toggle("active", btn.dataset.mode === mode));
  qEl.streaksBox.style.display = mode === "daily" ? "none" : "flex";
  qEl.dailyProgress.style.display = mode === "daily" ? "block" : "none";
  renderDifficultyControl(mode);

  if (mode === "ultimate") {
    pageTitle.textContent = "★ Ultimate Quiz";
    pageSubtitle.textContent = "Every quiz type, mixed at random.";
  } else if (mode === "daily") {
    pageTitle.textContent = "📅 Daily Challenge";
    pageSubtitle.textContent = "10 questions, once a day — resets at midnight PST.";
  } else {
    pageTitle.textContent = QUIZ_DEFS[mode].title;
    pageSubtitle.textContent = QUIZ_DEFS[mode].subtitle;
  }

  if (mode === "daily") {
    initDailyChallenge();
  } else {
    activeStreak().render();
    loadQuestion();
  }
}

const dailyBtn = document.createElement("button");
dailyBtn.className = "mode-tab";
dailyBtn.dataset.mode = "daily";
dailyBtn.textContent = "📅 Daily Challenge";
dailyBtn.addEventListener("click", () => selectMode("daily"));
modeSwitcher.appendChild(dailyBtn);

const alphabetizedQuizKeys = [...QUIZ_KEYS].sort((a, b) => QUIZ_DEFS[a].label.localeCompare(QUIZ_DEFS[b].label));
alphabetizedQuizKeys.forEach(key => {
  const btn = document.createElement("button");
  btn.className = "mode-tab";
  btn.dataset.mode = key;
  btn.textContent = QUIZ_DEFS[key].label;
  btn.addEventListener("click", () => selectMode(key));
  modeSwitcher.appendChild(btn);
});

const ultBtn = document.createElement("button");
ultBtn.className = "mode-tab";
ultBtn.dataset.mode = "ultimate";
ultBtn.textContent = "★ Ultimate";
ultBtn.addEventListener("click", () => selectMode("ultimate"));
modeSwitcher.appendChild(ultBtn);

// ---------- Init ----------

selectMode("daily");
