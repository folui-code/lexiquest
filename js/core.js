/* ===================================================================
   LexiQuest core: utilities, persistent store (SRS + streak + XP),
   sound effects, confetti, and shared UI helpers.
   =================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const shuffle = (a, rnd = Math.random) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const norm = (s) => String(s).toLowerCase().replace(/[^a-z]/g, "");
const fmt = (n) => Math.round(n).toLocaleString("en-US");
const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dayDiff = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
function seededRng(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) { h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}
function levenshtein(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/* coarse part-of-speech bucket, used to pick believable distractors */
function posGroup(card) {
  const p = card.pos.toLowerCase(), words = card.word.split(/\s+/).length;
  if (words > 1 || p.includes("phrase") || p.includes("pattern")) return words >= 3 ? "longphrase" : "phrase";
  if (p.includes("adjective")) return "adj";
  if (p.includes("noun")) return "noun";
  return "verb";
}

/* ---------------- Ranks & achievements ---------------- */
const RANKS = [
  [0, "Apprentice"],
  [1000, "Seeker"],
  [10000, "Scholar"],
  [50000, "Sorcerer"],
  [150000, "Master"]
];
const ACHIEVEMENTS = {
  first: ["🎮", "First Steps", "Finish your first game"],
  combo10: ["⚡", "Combo Breaker", "Hit a 5x combo in Cryptic Rush"],
  combo25: ["🌪️", "Unstoppable", "Hit a 15x combo in Cryptic Rush"],
  rush2k: ["⏳", "Clock Bender", "Score 2,000+ in Cryptic Rush"],
  marathon: ["🏃", "Marathon", "Survive 90 seconds in Cryptic Rush"],
  alchemist: ["⚗️", "Master Alchemist", "Forge 10 collocations in Alchemy"],
  grammarMaster: ["⚡", "Grammar Virtuoso", "Score 8+ in a Grammar Blitz unit"],
  oracleReader: ["📜", "Oracle Scholar", "Complete a Daily Reading Oracle passage"],
  streak3: ["🔥", "On Fire", "Reach a 3-day streak"],
  streak7: ["🌋", "Unbreakable", "Reach a 7-day streak"],
  master10: ["⭐", "Collector", "Get 10 words to 3★ mastery"],
  allseen: ["📚", "Completionist", "Meet all words in the Vault"]
};

/* ---------------- Persistent store ---------------- */
const Store = {
  KEY: "lexiquest.v1",
  d: null,

  // Stable Scoped Key Resolver: "Level:word" (e.g. "S4:are glued to")
  cardKey(target) {
    if (target === null || target === undefined || target === "") return "";
    if (typeof target === "object") {
      if (target.key) return target.key;
      const lvl = (target.level || "S4").trim().toUpperCase();
      const w = (target.word || "").trim().toLowerCase();
      return `${lvl}:${w}`;
    }
    const str = String(target).trim();
    if (str.includes(":")) return str;
    // If target is numeric ID
    if (/^\d+$/.test(str)) {
      const idx = +str;
      const v = (typeof VOCAB !== "undefined" ? VOCAB : null) || (typeof window !== "undefined" ? window.VOCAB : null) || [];
      const card = v[idx] || v.find(c => c.id === idx);
      if (card) {
        if (card.key) return card.key;
        const lvl = (card.level || "S4").trim().toUpperCase();
        const w = (card.word || "").trim().toLowerCase();
        return `${lvl}:${w}`;
      }
      return str;
    }
    // Bare word string
    return `S4:${str.toLowerCase()}`;
  },

  load() {
    try { this.d = JSON.parse(localStorage.getItem(this.KEY)); } catch { this.d = null; }
    this.d = Object.assign({ name: "", xp: 0, streak: 0, lastPlay: null, freezes: 0, best: {}, words: {}, ach: {}, daily: {}, lb: {}, muted: false, games: 0, duels: {}, arenaRooms: {} }, this.d || {});
    if (this.d.daily.date !== todayKey()) this.d.daily = { date: todayKey(), q: {}, chest: false };

    // Clean up deprecated Wordle & Matrix data
    if (this.d.best) {
      delete this.d.best.wordle;
      delete this.d.best.matrix;
    }
    if (this.d.daily) {
      delete this.d.daily.wordle;
      delete this.d.daily.matrix;
      delete this.d.daily.matrixDone;
    }
    if (this.d.lb) {
      delete this.d.lb.wordle;
      delete this.d.lb.matrix;
    }

    // Automatic Migration: Upgrade any legacy numeric IDs to permanent scoped word keys!
    if (this.d.words && typeof this.d.words === "object") {
      let migrated = false;
      const keys = Object.keys(this.d.words);
      for (const k of keys) {
        if (/^\d+$/.test(k)) {
          const sk = this.cardKey(k);
          if (sk && sk !== k) {
            if (!this.d.words[sk]) {
              this.d.words[sk] = this.d.words[k];
            }
            delete this.d.words[k];
            migrated = true;
          }
        }
      }
      if (migrated) this.save();
    }
    this.save();
  },
  save() { localStorage.setItem(this.KEY, JSON.stringify(this.d)); },

  /* --- SM-2 spaced repetition --- q: 0..5 */
  w(target) {
    const k = this.cardKey(target);
    // Backward-compat check if target is stored directly
    if (this.d.words[target] && !this.d.words[k]) {
      this.d.words[k] = this.d.words[target];
      delete this.d.words[target];
    }
    return (this.d.words[k] ||= { ef: 2.5, reps: 0, int: 0, due: 0, seen: 0, ok: 0, bad: 0 });
  },
  review(target, q) {
    const w = this.w(target);
    w.seen++; q >= 3 ? w.ok++ : w.bad++;
    w.ef = Math.max(1.3, w.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    if (q < 3) { w.reps = 0; w.int = 0; w.due = Date.now() + 60_000; }
    else { w.reps++; w.int = w.reps === 1 ? 1 : w.reps === 2 ? 6 : Math.round(w.int * w.ef); w.due = Date.now() + w.int * 86400000; }
    this.save();
  },
  setWordStatus(target, status) {
    const k = this.cardKey(target);
    const w = this.w(target);
    w.seen = Math.max(1, (w.seen || 0) + 1);
    w.status = status;
    if (status === "mastered") {
      w.reps = Math.max(3, (w.reps || 0) + 1);
      w.ok = (w.ok || 0) + 1;
      w.ef = Math.min(2.8, Math.max(2.5, (w.ef || 2.5) + 0.1));
      w.int = 14;
      w.due = Date.now() + 14 * 86400000;
    } else if (status === "familiar") {
      w.reps = Math.max(1, Math.min(2, (w.reps || 0) + 1));
      w.ok = (w.ok || 0) + 1;
      w.ef = 2.4;
      w.int = 3;
      w.due = Date.now() + 3 * 86400000;
    } else if (status === "challenging") {
      w.reps = 0;
      w.bad = (w.bad || 0) + 1;
      w.ef = Math.max(1.3, (w.ef || 2.5) - 0.2);
      w.int = 0;
      w.due = Date.now() + 60_000;
    }
    this.save();
    return w;
  },
  getWordStatus(target) {
    const k = this.cardKey(target);
    const w = this.d.words[k] || this.d.words[target];
    if (!w || !w.seen) return "new";
    if (w.status) return w.status;
    if ((w.reps || 0) >= 2 || (w.ok || 0) >= 3) return "mastered";
    if ((w.bad || 0) > (w.ok || 0) || (w.reps || 0) === 0) return "challenging";
    return "familiar";
  },
  mastery(target) {
    const k = this.cardKey(target);
    const w = this.d.words[k] || this.d.words[target];
    if (!w || !w.seen) return 0;
    if (w.status === "mastered") return Math.max(3, Math.min(5, 1 + (w.reps || 2)));
    if (w.status === "challenging") return 1;
    if (w.status === "familiar") return Math.max(2, Math.min(3, 1 + (w.reps || 1)));
    return Math.min(5, 1 + (w.reps || 0));
  },
  /* weighted pick: unseen + overdue + low-ease words come up more often (interleaving) */
  pickWords(n, exclude = new Set(), sourcePool = null) {
    const now = Date.now();
    const base = (sourcePool && sourcePool.length > 0) ? sourcePool : VOCAB;
    const pool = base.filter((c) => !exclude.has(c.id) && !exclude.has(c.key) && !exclude.has(c)).map((c) => {
      const k = this.cardKey(c);
      const w = this.d.words[k] || this.d.words[c.id];
      let wt = !w || !w.seen ? 3 : w.due <= now ? 4 + (2.5 - w.ef) * 4 : 0.6;
      if (w) wt += (w.bad / (w.seen || 1)) * 2;
      return { c, k: Math.pow(Math.random(), 1 / wt) };
    });
    if (!pool.length && base.length) {
      return shuffle([...base]).slice(0, n);
    }
    return pool.sort((a, b) => b.k - a.k).slice(0, n).map((x) => x.c);
  },

  /* --- XP / rank (5 Academy tiers) --- */
  _sessionXPWords: new Set(),
  awardWordXP(target, amount) {
    if (!this._sessionXPWords) this._sessionXPWords = new Set();
    const k = this.cardKey(target);
    if (!k || this._sessionXPWords.has(k)) {
      return { awarded: false, xp: 0 };
    }
    this._sessionXPWords.add(k);
    this.addXP(amount);
    return { awarded: true, xp: amount };
  },
  rank(xp = this.d.xp) {
    let i = 0; while (i + 1 < RANKS.length && xp >= RANKS[i + 1][0]) i++;
    const [lo, name] = RANKS[i], hi = RANKS[i + 1]?.[0] ?? (lo + 100000);
    return { name, pct: Math.min(100, Math.max(0, ((xp - lo) / (hi - lo)) * 100)), idx: i };
  },
  addXP(n) {
    const before = this.rank().idx;
    this.d.xp += Math.round(n); this.save();
    const r = this.rank();

    // Immediately reflect new XP in UI
    if (typeof window !== "undefined" && window.App) {
      if (App.renderTop) App.renderTop();
      if (App.renderWizardProfile) App.renderWizardProfile();
      if (App.renderHouseCup) App.renderHouseCup();
      if (App.renderClassHonorRoll) App.renderClassHonorRoll();
    }
    if (typeof Leaderboard !== "undefined" && Leaderboard.queueProfilePush) {
      Leaderboard.queueProfilePush();
    }

    if (r.idx > before) setTimeout(() => {
      toast(`🎖️ Rank up! You are now a <b>${r.name}</b> · Tier ${r.idx + 1} Avatar Unlocked! 🪄`, true);
      Sfx.fanfare(); Fx.confetti(160);
      if (window.App && App.renderWizardProfile) App.renderWizardProfile();
    }, 900);
  },

  /* --- streak with loss aversion + streak freezes --- */
  recordPlay() {
    const t = todayKey(), last = this.d.lastPlay;
    this.d.games++;
    if (last !== t) {
      const gap = last ? dayDiff(last, t) : 99;
      if (gap === 1) this.d.streak++;
      else if (gap === 2 && this.d.freezes > 0) { this.d.freezes--; this.d.streak++; toast("🧊 A Streak Freeze saved your streak!"); }
      else this.d.streak = 1;
      this.d.lastPlay = t;
      if (this.d.streak % 7 === 0 && this.d.freezes < 2) { this.d.freezes++; toast("🧊 +1 Streak Freeze earned!"); }
    }
    this.unlock("first");
    if (this.d.streak >= 3) this.unlock("streak3");
    if (this.d.streak >= 7) this.unlock("streak7");
    const masters = Object.keys(this.d.words).filter((k) => this.mastery(k) >= 3).length;
    if (masters >= 10) this.unlock("master10");
    if (VOCAB.every((c) => (this.d.words[this.cardKey(c)] || this.d.words[c.id])?.seen)) this.unlock("allseen");
    this.save();
  },
  streakAtRisk() { return this.d.streak > 0 && this.d.lastPlay !== todayKey() && dayDiff(this.d.lastPlay, todayKey()) === 1; },
  liveStreak() { if (!this.d.lastPlay) return 0; const g = dayDiff(this.d.lastPlay, todayKey()); return g <= 1 || (g === 2 && this.d.freezes) ? this.d.streak : 0; },

  unlock(key) {
    if (this.d.ach[key]) return;
    this.d.ach[key] = Date.now(); this.save();
    const [ic, name] = ACHIEVEMENTS[key];
    setTimeout(() => { toast(`${ic} Achievement unlocked: <b>${name}</b>`, true); Sfx.fanfare(); }, 400);
  },
  quest(key) { if (!this.d.daily.q[key]) { this.d.daily.q[key] = true; this.save(); toast("🎯 Daily quest complete!"); } },
  setBest(mode, score) { const prev = this.d.best[mode] || 0; if (score > prev) { this.d.best[mode] = score; this.save(); return prev > 0 || score > 0; } return false; },
  addScore(mode, score) {
    this.setBest(mode, score);
    return this.addLB(mode, score);
  },
  addLB(mode, score) {
    const list = (this.d.lb[mode] ||= []);
    const entry = { n: this.d.name || "You", s: score, t: Date.now() };
    list.push(entry); list.sort((a, b) => b.s - a.s); list.splice(10); this.save();
    return entry.t;
  }
};

/* ---------------- Sound (synthesised, no files) ---------------- */
const Sfx = {
  ctx: null,
  tone(freq, dur = 0.12, type = "sine", vol = 0.15, delay = 0) {
    if (Store.d?.muted) return;
    try {
      this.ctx ||= new (window.AudioContext || window.webkitAudioContext)();
      const t = this.ctx.currentTime + delay, o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch { }
  },
  correct(combo = 0) { const b = 520 * Math.pow(1.06, Math.min(combo, 20)); this.tone(b, 0.1, "triangle"); this.tone(b * 1.5, 0.16, "triangle", 0.12, 0.07); },
  wrong() { this.tone(160, 0.25, "sawtooth", 0.09); this.tone(120, 0.3, "sawtooth", 0.07, 0.08); },
  tick() { this.tone(900, 0.04, "square", 0.05); },
  click() { this.tone(660, 0.05, "sine", 0.08); },
  levelup() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.15, "triangle", 0.12, i * 0.08)); },
  fanfare() { [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.25, "triangle", 0.12, i * 0.1)); },
  spellCast() { [440, 554, 659, 880].forEach((f, i) => this.tone(f, 0.16, "sine", 0.08, i * 0.05)); },
  cardFlip() { this.tone(360, 0.06, "triangle", 0.06); this.tone(520, 0.08, "sine", 0.07, 0.04); },
  spellChallenging() { this.tone(220, 0.18, "sawtooth", 0.08); this.tone(180, 0.22, "sawtooth", 0.06, 0.06); }
};

/* ---------------- Confetti ---------------- */
const Fx = {
  parts: [], running: false,
  confetti(n = 120, x = innerWidth / 2, y = innerHeight / 3) {
    const cv = $("#fx-canvas"); cv.width = innerWidth; cv.height = innerHeight;
    const cols = ["#fbbf24", "#f472b6", "#22d3ee", "#a78bfa", "#34d399", "#fb7185"];
    for (let i = 0; i < n; i++) this.parts.push({ x, y, vx: (Math.random() - 0.5) * 16, vy: Math.random() * -14 - 4, r: Math.random() * 6 + 4, c: cols[i % cols.length], a: Math.random() * 6, life: 120 + Math.random() * 60 });
    if (!this.running) { this.running = true; requestAnimationFrame(() => this.step()); }
  },
  step() {
    const cv = $("#fx-canvas"), g = cv.getContext("2d");
    g.clearRect(0, 0, cv.width, cv.height);
    this.parts = this.parts.filter((p) => p.life-- > 0);
    for (const p of this.parts) {
      p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += 0.2;
      g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.globalAlpha = Math.min(1, p.life / 40);
      g.fillStyle = p.c; g.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); g.restore();
    }
    if (this.parts.length) requestAnimationFrame(() => this.step()); else { this.running = false; g.clearRect(0, 0, cv.width, cv.height); }
  }
};

/* ---------------- UI helpers ---------------- */
function toast(html, gold = false) {
  const t = document.createElement("div");
  t.className = "toast" + (gold ? " gold" : ""); t.innerHTML = html;
  $("#toasts").appendChild(t); setTimeout(() => t.remove(), 3100);
}
function modal(html, closable = true) {
  const m = $("#modal");
  m.innerHTML = `<div class="modal-box">${closable ? '<button class="modal-close" id="modal-close-btn" aria-label="Close">✕</button>' : ''}${html}</div>`;
  m.classList.remove("hidden");
  if (closable) {
    const closeBtn = $("#modal-close-btn");
    if (closeBtn) closeBtn.onclick = closeModal;
    m.onclick = (e) => { if (e.target === m) closeModal(); };
  } else {
    m.onclick = null;
  }
  return m;
}
function closeModal() {
  $("#modal").classList.add("hidden");
  $("#modal").onclick = null;
}
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("#modal").classList.contains("hidden")) {
    closeModal();
  }
});
let currentCleanup = null;
function showScreen(id) {
  if (typeof App !== "undefined" && App.activeStudyKeyHandler) {
    window.removeEventListener("keydown", App.activeStudyKeyHandler);
    App.activeStudyKeyHandler = null;
  }
  if (currentCleanup) { currentCleanup(); currentCleanup = null; }
  $$(".screen").forEach((s) => s.classList.toggle("active", s.id === `screen-${id}`));
  scrollTo({ top: 0, behavior: "smooth" });
  if (id === "home") App.renderHome();
}

function stars(id) {
  const m = (typeof Store !== "undefined" && Store.mastery) ? Store.mastery(id) : 0;
  let html = '<div class="stars">';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="${i <= m ? 'on' : ''}">★</span>`;
  }
  html += '</div>';
  return html;
}

let currentUtterance = null;
function pronounce(text, rate = 0.9) {
  if (!("speechSynthesis" in window)) {
    toast("Speech synthesis not supported on this browser.");
    return;
  }
  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
  } catch (e) { }

  setTimeout(() => {
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-US";
      utter.rate = rate;
      utter.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices() || [];
      const enVoice = voices.find(v => v.lang && (v.lang.startsWith("en-GB") || v.lang.startsWith("en_GB") || (v.name && v.name.includes("British")))) ||
        voices.find(v => v.lang && (v.lang.startsWith("en-US") || v.lang.startsWith("en_US") || (v.name && v.name.includes("Samantha")))) ||
        voices.find(v => v.lang && v.lang.toLowerCase().startsWith("en"));
      if (enVoice) {
        utter.voice = enVoice;
        utter.lang = enVoice.lang;
      }

      currentUtterance = utter;
      utter.onend = () => { currentUtterance = null; };
      utter.onerror = (e) => {
        console.warn("TTS notice:", e);
        currentUtterance = null;
      };

      window.speechSynthesis.speak(utter);
    } catch (err) {
      console.warn("Pronounce failed:", err);
    }
  }, 40);
}

// Pre-warm speech synthesis voices on startup
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
  if ("onvoiceschanged" in window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
}

function wordCardHTML(c) {
  const ctx = esc(c.context).replace(/___/g, `<mark>${esc(c.word)}</mark>`);
  const topicChip = c.topic ? `<span class="chip" style="margin-left:6px;font-size:0.75rem">${esc(c.topic)}</span>` : "";
  const curStatus = (typeof Store !== "undefined" && Store.getWordStatus) ? Store.getWordStatus(c) : "new";
  const statusBadge = curStatus === "mastered"
    ? `<span class="arcane-status-pill mastered">⚡ Mastered</span>`
    : curStatus === "familiar"
      ? `<span class="arcane-status-pill familiar">📖 Familiar</span>`
      : curStatus === "challenging"
        ? `<span class="arcane-status-pill challenging">🔮 Challenging</span>`
        : `<span class="arcane-status-pill new">✨ Unseen</span>`;

  return `
    <div class="wcard">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
        <div>
          <span class="pos">${esc(c.pos)}</span>${topicChip}
          <div style="display:flex;align-items:center;gap:12px;margin:2px 0 8px">
            <h2 style="font-size:1.8rem;margin:0">${esc(c.word)}</h2>
            <button class="pill icon-btn" id="btn-speak-word" title="Listen to word pronunciation" style="padding:6px 14px;font-size:0.95rem;font-weight:700;background:rgba(34,211,238,0.18);border:1px solid var(--cyan);color:var(--cyan);cursor:pointer">
              🔊 Listen to Word
            </button>
          </div>
        </div>
        <div id="modal-status-badge-wrap">${statusBadge}</div>
      </div>
      <p style="font-size:1rem;color:#cbd5e1;line-height:1.5">${esc(c.meaning)}</p>
      <div class="syn">${c.synonyms.map((s) => `<span>${esc(s)}</span>`).join("")}</div>
      <div style="margin:14px 0 16px">
        <blockquote>
          ${ctx}
        </blockquote>
        <div style="display:flex;justify-content:flex-end;margin-top:6px">
          <button class="btn small" id="btn-speak-sentence" title="Listen to example sentence pronunciation" style="padding:6px 14px;font-size:0.85rem;font-weight:600;background:rgba(34,211,238,0.12);color:var(--cyan);border:1px solid rgba(34,211,238,0.3);cursor:pointer">
            🔊 Listen to Sentence
          </button>
        </div>
      </div>

      <!-- Arcane Self-Assessment Revision Buttons -->
      <div class="modal-status-box">
        <span class="modal-status-label">Mastery Assessment:</span>
        <div class="arcane-status-btn-group">
          <button class="arcane-status-btn challenging ${curStatus === 'challenging' ? 'active' : ''}" data-status="challenging" title="Mark as Difficult (Needs Practice)">
            <span class="btn-icon">🔴</span>
            <span class="btn-text"><b>Difficult</b><small>Needs Practice</small></span>
          </button>
          <button class="arcane-status-btn familiar ${curStatus === 'familiar' ? 'active' : ''}" data-status="familiar" title="Mark as Okay (In Progress)">
            <span class="btn-icon">🟡</span>
            <span class="btn-text"><b>Okay</b><small>In Progress</small></span>
          </button>
          <button class="arcane-status-btn mastered ${curStatus === 'mastered' ? 'active' : ''}" data-status="mastered" title="Mark as Mastered (Well Known)">
            <span class="btn-icon">⚡</span>
            <span class="btn-text"><b>Mastered</b><small>Spell Perfected!</small></span>
          </button>
        </div>
      </div>

      <div id="modal-stars-wrap">${stars(c.id)}</div>
    </div>
  `;
}

function showWord(c, list = (window.VOCAB || [])) {
  if (!c) return;
  const wordList = list && list.length ? list : (window.VOCAB || []);
  let curIdx = wordList.findIndex(item => item.id === c.id);
  if (curIdx === -1) curIdx = 0;

  const hasPrev = curIdx > 0;
  const hasNext = curIdx < wordList.length - 1;

  const navHtml = `
    <div style="margin-top:18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
      <div style="display:flex;gap:6px;align-items:center">
        <button class="btn small" id="btn-prev-word" ${hasPrev ? "" : "disabled"} style="padding:6px 14px;font-size:0.85rem;${hasPrev ? "" : "opacity:0.35;cursor:default"}">
          ◀ Prev
        </button>
        <span class="muted" style="font-size:0.8rem;font-family:var(--font-n);padding:0 6px">${curIdx + 1} / ${wordList.length}</span>
        <button class="btn small" id="btn-next-word" ${hasNext ? "" : "disabled"} style="padding:6px 14px;font-size:0.85rem;${hasNext ? "" : "opacity:0.35;cursor:default"}">
          Next ▶
        </button>
      </div>
      <button class="btn small primary" id="btn-close-word" style="padding:6px 16px">Got it</button>
    </div>
  `;

  modal(`${wordCardHTML(c)}${navHtml}`);
  $("#btn-close-word").onclick = closeModal;

  if (hasPrev) {
    const prevBtn = $("#btn-prev-word");
    if (prevBtn) prevBtn.onclick = () => showWord(wordList[curIdx - 1], wordList);
  }
  if (hasNext) {
    const nextBtn = $("#btn-next-word");
    if (nextBtn) nextBtn.onclick = () => showWord(wordList[curIdx + 1], wordList);
  }

  // Keyboard navigation for desktop: Left/Right arrows
  const arrowHandler = (e) => {
    if (!$("#modal") || $("#modal").classList.contains("hidden")) {
      window.removeEventListener("keydown", arrowHandler);
      return;
    }
    if (e.key === "ArrowLeft" && hasPrev) {
      e.preventDefault();
      window.removeEventListener("keydown", arrowHandler);
      showWord(wordList[curIdx - 1], wordList);
    } else if (e.key === "ArrowRight" && hasNext) {
      e.preventDefault();
      window.removeEventListener("keydown", arrowHandler);
      showWord(wordList[curIdx + 1], wordList);
    }
  };
  window.addEventListener("keydown", arrowHandler);

  const speakWordBtn = $("#btn-speak-word");
  if (speakWordBtn) {
    speakWordBtn.onclick = (e) => {
      e.stopPropagation();
      pronounce(c.word, 0.88);
      speakWordBtn.style.transform = "scale(1.15)";
      setTimeout(() => { if (speakWordBtn) speakWordBtn.style.transform = ""; }, 250);
    };
  }

  const speakSentenceBtn = $("#btn-speak-sentence");
  if (speakSentenceBtn) {
    speakSentenceBtn.onclick = (e) => {
      e.stopPropagation();
      const fullSentence = c.raw_sentence || (c.context ? c.context.replace(/___/g, c.word) : c.word);
      pronounce(fullSentence, 0.95);
      speakSentenceBtn.style.transform = "scale(1.08)";
      setTimeout(() => { if (speakSentenceBtn) speakSentenceBtn.style.transform = ""; }, 250);
    };
  }

  // Handle Self-Assessment clicks inside modal
  let isAssessingModal = false;
  $$(".modal-status-box .arcane-status-btn").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      if (isAssessingModal) return;
      isAssessingModal = true;
      const st = btn.dataset.status;
      Store.setWordStatus(c, st);

      const xpAmt = st === "mastered" ? 10 : 5;
      const xpRes = Store.awardWordXP(c, xpAmt);

      if (xpRes.awarded) {
        if (st === "mastered") {
          if (Sfx.spellCast) Sfx.spellCast();
          Fx.confetti(60);
          toast("⚡ Marked as Mastered! (+10 XP)", true);
        } else if (st === "challenging") {
          if (Sfx.spellChallenging) Sfx.spellChallenging();
          toast("🔴 Marked as Difficult — Queued for practice (+5 XP)");
        } else {
          if (Sfx.click) Sfx.click();
          toast("🟡 Marked as Okay (+5 XP)");
        }
      } else {
        if (Sfx.click) Sfx.click();
        toast(st === "mastered" ? "⚡ Marked as Mastered" : st === "challenging" ? "🔴 Marked as Difficult" : "🟡 Marked as Okay");
      }

      $$(".modal-status-box .arcane-status-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.status === st);
        b.disabled = true;
        b.style.pointerEvents = "none";
      });
      const badgeWrap = $("#modal-status-badge-wrap");
      if (badgeWrap) {
        badgeWrap.innerHTML = st === "mastered"
          ? `<span class="arcane-status-pill mastered">⚡ Mastered</span>`
          : st === "familiar"
            ? `<span class="arcane-status-pill familiar">📖 Familiar</span>`
            : `<span class="arcane-status-pill challenging">🔮 Challenging</span>`;
      }
      const starsWrap = $("#modal-stars-wrap");
      if (starsWrap) starsWrap.innerHTML = stars(c.id);

      if (typeof App !== "undefined" && App.renderTop) App.renderTop();

      // Automatically advance to the next card in list
      if (hasNext) {
        setTimeout(() => {
          window.removeEventListener("keydown", arrowHandler);
          showWord(wordList[curIdx + 1], wordList);
        }, 320);
      } else {
        setTimeout(() => {
          isAssessingModal = false;
          $$(".modal-status-box .arcane-status-btn").forEach(b => {
            b.disabled = false;
            b.style.pointerEvents = "auto";
          });
        }, 400);
      }
    };
  });
}

/* Shared results screen */
function showResults({ mode, emoji, title, score, stats, review = [], replay, xp, isPractice = false }) {
  let isBest = false;
  let myT = null;
  if (!isPractice) {
    isBest = Store.setBest(mode, score);
    myT = Store.addLB(mode, score);
    if (typeof Leaderboard !== "undefined" && Leaderboard.submitScore) {
      Leaderboard.submitScore(mode, score);
    }
  }
  Store.addXP(xp); Store.recordPlay();
  const lb = Store.d.lb[mode] || [];
  const el = $("#screen-results");
  el.innerHTML = `<div class="results">
    <div class="big-emoji">${emoji}</div><h1>${title}</h1>
    <div class="score-big grad-text" id="res-score">0</div>
    ${isPractice ? `<div class="muted" style="color:var(--emerald);font-weight:700">🎯 PRACTICE COMPLETE · XP SAVED</div>` : (isBest ? `<div class="new-best">🏆 NEW PERSONAL BEST</div>` : `<div class="muted">Best: ${fmt(Store.d.best[mode] || 0)}</div>`)}
    <div class="stat-row">${stats.map(([l, v]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join("")}<div class="stat"><b>+${fmt(xp)}</b><span>XP earned</span></div></div>
    <div class="result-actions"><button class="btn ${mode === "rush" ? "rush" : mode === "matrix" ? "matrix" : "primary"}" id="btn-replay">↻ Play again</button><button class="btn" id="btn-res-home">🏠 Home</button></div>
    ${review.length ? `<div class="card review"><h3>📌 Words to review</h3>${review.map((c) => `<div class="review-item"><b>${esc(c.word)}</b> <small class="muted">${esc(c.pos)}</small><p>${esc(c.meaning)}</p></div>`).join("")}</div>` : ""}
    ${!isPractice ? `<div class="card lb"><h3>🏅 Your top runs</h3>${lb.map((e, i) => `<div class="lb-row ${e.t === myT ? "me" : ""}"><span>#${i + 1} ${esc(e.n)}</span><b>${fmt(e.s)}</b></div>`).join("")}</div>` : ""}
  </div>`;
  showScreen("results");
  // count-up animation
  const t0 = performance.now(), dur = 1100;
  (function up(t) { const k = Math.min(1, (t - t0) / dur); $("#res-score").textContent = fmt(score * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(up); })(t0);
  if (isBest || score > 0) { Sfx.fanfare(); Fx.confetti(isBest ? 220 : 80); }
  $("#btn-replay").onclick = replay;
  $("#btn-res-home").onclick = () => showScreen("home");
}
