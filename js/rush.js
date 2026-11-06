/* ===================================================================
   MODE 1 — CRYPTIC RUSH (Scrambled Tile Bank / Anagram Mode)
   Three play modes (practice now lives in the Word Vault):
     1) 🧙 Solo Rush     — classic 60s countdown, combos, time refills.
     2) ⚔️ Wizards' Duel — play a seeded run, share a link / code; your
                           friend races your live "ghost" on the SAME
                           questions and identical tile scrambles.
     3) 🏰 Class Arena   — teacher-only. Projects a QR code + room code;
                           students join on phones, everyone gets the same
                           question set and a live class leaderboard.
   =================================================================== */

/* ---------- Networking + payload helpers ---------- */
const RushNet = {
  memRooms: {},
  myRecord: {},
  bc: (typeof BroadcastChannel !== "undefined") ? new BroadcastChannel("lexiquest_rush") : null,

  encode(obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    let bin = "";
    bytes.forEach(b => bin += String.fromCharCode(b));
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  },
  decode(str) {
    let b64 = String(str).trim().replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  },
  baseUrl() {
    return location.origin + location.pathname;
  },
  apiUrl() {
    return (typeof Leaderboard !== "undefined" && Leaderboard.API_URL) || "";
  },

  localGet(key) {
    try {
      const raw = localStorage.getItem("lexiquest.net." + key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  localPut(key, val) {
    try {
      localStorage.setItem("lexiquest.net." + key, JSON.stringify(val));
      if (this.bc) this.bc.postMessage({ key, val });
    } catch {}
  },

  async cloudGet(key) {
    const url = this.apiUrl();
    if (!url) return null;
    const qs = new URLSearchParams({ action: "sync_pull", hash: key, _t: Date.now() });
    const resp = await fetch(`${url}${url.includes("?") ? "&" : "?"}${qs}`, { method: "GET", cache: "no-store" });
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    const data = await resp.json();
    if (data && data.profile && data.profile.words && typeof data.profile.words === "object") {
      return data.profile.words;
    }
    return null;
  },

  async cloudPut(key, obj, label = "Arena") {
    this.localPut(key, obj);
    const url = this.apiUrl();
    if (!url) return { status: "success" };
    const qs = new URLSearchParams({
      action: "sync_push",
      hash: key,
      name: String(label || "Arena").slice(0, 30),
      role: "staff",
      xp: "0",
      streak: "0",
      words: JSON.stringify(obj),
      _t: Date.now()
    });
    const resp = await fetch(`${url}${url.includes("?") ? "&" : "?"}${qs}`, { method: "GET", cache: "no-store" });
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    return await resp.json();
  },

  mergeRoom(a, b) {
    if (!a || !a.room) return b ? JSON.parse(JSON.stringify(b)) : null;
    if (!b || !b.room) return JSON.parse(JSON.stringify(a));
    const ra = a.roundId || 1, rb = b.roundId || 1;
    if (rb > ra) return JSON.parse(JSON.stringify(b));
    if (ra > rb) return JSON.parse(JSON.stringify(a));
    const rank = { lobby: 0, live: 1, ended: 2 };
    const status = (rank[b.status] || 0) >= (rank[a.status] || 0) ? (b.status || "lobby") : (a.status || "lobby");
    const pMap = {};
    const pa = a.pMap || {}, pb = b.pMap || {};
    new Set([...Object.keys(pa), ...Object.keys(pb)]).forEach(pid => {
      const x = pa[pid], y = pb[pid];
      if (!x) pMap[pid] = { ...y };
      else if (!y) pMap[pid] = { ...x };
      else pMap[pid] = {
        pid,
        n: y.n || x.n,
        h: y.h || x.h,
        s: Math.max(x.s || 0, y.s || 0),
        c: Math.max(x.c || 0, y.c || 0),
        d: Math.max(x.d || 0, y.d || 0),
        t: Math.max(x.t || 0, y.t || 0)
      };
    });
    return {
      room: b.room || a.room,
      roundId: rb,
      seed: b.seed || a.seed,
      set: b.set || a.set || "all",
      host: b.host || a.host || "Teacher",
      status,
      startAt: b.startAt || a.startAt || 0,
      pMap
    };
  },

  toSnapshot(raw) {
    if (!raw || !raw.room) return null;
    const players = Object.values(raw.pMap || {}).sort((a, b) => (b.s || 0) - (a.s || 0));
    return {
      room: raw.room,
      roundId: raw.roundId || 1,
      seed: raw.seed,
      set: raw.set || "all",
      host: raw.host || "Teacher",
      status: raw.status || "lobby",
      startAt: raw.startAt || 0,
      now: Date.now(),
      players
    };
  },

  async call(action, params = {}) {
    // 1. 1v1 Duel short codes (stored via sync_push / sync_pull)
    if (action === "duel_save") {
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < 6; i++) code += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
      const payload = String(params.payload || "");
      await this.cloudPut("duel_code_" + code, { payload, t: Date.now() }, "Duel " + code);
      return { status: "success", code };
    }
    if (action === "duel_get") {
      const code = String(params.code || "").trim().toUpperCase();
      const key = "duel_code_" + code;
      const data = this.localGet(key) || await this.cloudGet(key);
      if (data && data.payload) return { status: "success", payload: data.payload };
      throw new Error("Duel code not found");
    }

    // 2. Class Arena live room actions (CRDT over sync_push / sync_pull + local BroadcastChannel)
    const room = String(params.room || "").trim().toUpperCase();
    const key = "arena_room_" + room;

    if (action === "arena_create") {
      const raw = {
        room,
        roundId: 1,
        seed: String(params.seed || this.newSeed()),
        set: String(params.set || "all"),
        host: String(params.name || "Teacher").slice(0, 40),
        status: "lobby",
        startAt: 0,
        pMap: {}
      };
      this.memRooms[room] = raw;
      await this.cloudPut(key, raw, raw.host);
      return { status: "success", arena: this.toSnapshot(raw) };
    }

    let remote = null;
    try { remote = await this.cloudGet(key); } catch (e) { console.warn("[RushNet] cloudGet fallback:", e); }
    const local = this.mergeRoom(this.memRooms[room], this.localGet(key));
    let cur = this.mergeRoom(local, remote);
    if (!cur || !cur.room) throw new Error("Room not found or expired");

    if (action === "arena_join" || action === "arena_update") {
      const pid = String(params.pid || "").replace(/[^0-9A-Za-z_-]/g, "").slice(0, 24);
      const prev = (cur.pMap && cur.pMap[pid]) || {};
      const player = {
        pid,
        n: String(params.name || prev.n || "Scholar").slice(0, 30),
        h: String(params.house || prev.h || "").slice(0, 4),
        s: Math.max(action === "arena_join" ? 0 : (prev.s || 0), parseInt(params.score, 10) || 0),
        c: Math.max(action === "arena_join" ? 0 : (prev.c || 0), parseInt(params.correct, 10) || 0),
        d: params.done === "1" ? 1 : (action === "arena_join" ? 0 : (prev.d || 0)),
        t: Date.now()
      };
      cur.pMap = cur.pMap || {};
      cur.pMap[pid] = player;
      this.myRecord[room] = { roundId: cur.roundId || 1, player };
      this.memRooms[room] = cur;
      await this.cloudPut(key, cur, cur.host);
      return { status: "success", arena: this.toSnapshot(cur) };
    }

    if (action === "arena_start" || action === "arena_end" || action === "arena_reset") {
      if (action === "arena_start") {
        cur.status = "live";
        cur.startAt = Date.now() + 3500;
      } else if (action === "arena_end") {
        cur.status = "ended";
      } else if (action === "arena_reset") {
        cur.roundId = (cur.roundId || 1) + 1;
        cur.status = "lobby";
        cur.startAt = 0;
        cur.seed = String(params.seed || this.newSeed());
        Object.values(cur.pMap || {}).forEach(p => { p.s = 0; p.c = 0; p.d = 0; p.t = Date.now(); });
      }
      this.memRooms[room] = cur;
      await this.cloudPut(key, cur, cur.host);
      return { status: "success", arena: this.toSnapshot(cur) };
    }

    if (action === "arena_state") {
      let needHeal = false;
      const rec = this.myRecord[room];
      if (rec && rec.player) {
        if ((cur.roundId || 1) > (rec.roundId || 1)) {
          rec.roundId = cur.roundId;
          rec.player = { ...rec.player, s: 0, c: 0, d: 0, t: Date.now() };
        }
        const rp = remote && remote.pMap && remote.pMap[rec.player.pid];
        if (!rp || (rp.s || 0) < (rec.player.s || 0) || (rp.d || 0) < (rec.player.d || 0)) {
          cur.pMap = cur.pMap || {};
          cur.pMap[rec.player.pid] = {
            ...rec.player,
            s: Math.max((cur.pMap[rec.player.pid] && cur.pMap[rec.player.pid].s) || 0, rec.player.s || 0),
            c: Math.max((cur.pMap[rec.player.pid] && cur.pMap[rec.player.pid].c) || 0, rec.player.c || 0),
            d: Math.max((cur.pMap[rec.player.pid] && cur.pMap[rec.player.pid].d) || 0, rec.player.d || 0)
          };
          needHeal = true;
        }
      }
      if (typeof Rush !== "undefined" && Rush.arena && Rush.arena.host && Rush.arena.room === room && remote) {
        const localCount = Object.keys(cur.pMap || {}).length;
        const remoteCount = Object.keys(remote.pMap || {}).length;
        if (localCount > remoteCount || cur.status !== remote.status || (cur.roundId || 1) !== (remote.roundId || 1)) {
          needHeal = true;
        }
      }
      this.memRooms[room] = cur;
      this.localPut(key, cur);
      if (needHeal) {
        this.cloudPut(key, cur, cur.host).catch(() => {});
      }
      return { status: "success", arena: this.toSnapshot(cur) };
    }

    throw new Error("Unknown action: " + action);
  },
  me() {
    const a = (Store.d && Store.d.auth) || {};
    let pid = a.emailHash ? a.emailHash.slice(0, 16) : localStorage.getItem("lexiquest.pid");
    if (!pid) { pid = "p" + Math.random().toString(36).slice(2, 12); localStorage.setItem("lexiquest.pid", pid); }
    return {
      pid,
      name: Store.d.name || a.name || "Scholar",
      house: (Store.d.house || a.house || "").toUpperCase(),
      role: this.isTeacher() ? "staff" : (a.role || "student")
    };
  },
  isTeacher() {
    const a = (Store.d && Store.d.auth) || {};
    return a.role === "staff" || a.role === "teacher" || localStorage.getItem("lexiquest.teacher_unlock") === "1";
  },
  newSeed() {
    return Math.random().toString(36).slice(2, 10);
  },
  async copy(text) {
    try { await navigator.clipboard.writeText(text); toast("📋 Copied!"); }
    catch { prompt("Copy this:", text); }
  }
};

const HOUSE_COLORS = { TAK: "#e11d48", CHI: "#10b981", KIN: "#f59e0b", KAN: "#3b82f6" };

const Rush = {
  START: 60,
  BASE_ADD: 4,
  playMode: "solo",      // "solo" | "duel" | "class"
  selectedSet: "all",    // "all" or set topic key
  seed: null,            // non-null => deterministic question order + scrambles
  ghost: null,           // duel opponent run {n,h,sc,c,tl}
  arena: null,           // class arena session

  getAvailableSets() {
    const map = new Map();
    (window.VOCAB || []).forEach(c => {
      const key = c.topic || (c.set ? `Set ${c.set}${c.content ? ` · ${c.content}` : ''}` : 'General');
      if (!map.has(key)) map.set(key, { key, level: c.level || 'S4', set: c.set || '1', content: c.content || '', count: 0 });
      map.get(key).count++;
    });
    return Array.from(map.values()).sort((a, b) => (+a.set || 0) - (+b.set || 0));
  },

  resolvePool(setKey) {
    const all = window.VOCAB || [];
    if (!setKey || setKey === "all") return all;
    const pool = all.filter(c =>
      c.topic === setKey || `Set ${c.set}${c.content ? ` · ${c.content}` : ''}` === setKey || c.set === setKey);
    return pool.length ? pool : all;
  },

  setLabel(setKey) {
    return (!setKey || setKey === "all") ? "🌟 All Sets Mixed" : setKey;
  },

  /* ================= INTRO / MODE PICKER ================= */
  intro() {
    this.seed = null; this.ghost = null;
    if (this.arena) this.leaveArena();
    const sets = this.getAvailableSets();
    if (this.selectedSet !== "all" && !sets.some(s => s.key === this.selectedSet)) this.selectedSet = "all";
    const total = (window.VOCAB || []).length;
    const teacher = RushNet.isTeacher();

    const el = $("#screen-rush");
    el.innerHTML = `
      <button class="back-btn" id="rush-back">← Home</button>
      <div class="card intro rush-intro-card">
        <div class="mode-icon" style="background:var(--g-rush)">⚡</div>
        <h1>Cryptic Rush</h1>
        <p class="muted" style="margin-bottom:22px">Contextual deduction meets lightning tile unscrambling.</p>

        <div class="rush-section-block">
          <div class="rush-section-title">1. Choose Play Mode</div>
          <div class="rush-mode-grid three">
            <div class="rush-mode-card" data-mode="solo">
              <div class="rush-mode-header"><span class="rush-mode-badge game">🧙 SOLO</span><span class="rush-check-icon">✓</span></div>
              <div class="rush-mode-name">Solo Rush</div>
              <div class="rush-mode-desc">60s countdown. Fast solves add +4s to +8s and build combo multipliers.</div>
            </div>
            <div class="rush-mode-card" data-mode="duel">
              <div class="rush-mode-header"><span class="rush-mode-badge duel">⚔️ 1 v 1</span><span class="rush-check-icon">✓</span></div>
              <div class="rush-mode-name">Wizards' Duel</div>
              <div class="rush-mode-desc">Play, then send a link or code. Your friend races your live ghost on the exact same questions.</div>
            </div>
            <div class="rush-mode-card ${teacher ? "" : "locked"}" data-mode="class">
              <div class="rush-mode-header"><span class="rush-mode-badge class">🏰 CLASS</span><span class="rush-check-icon">${teacher ? "✓" : "🔒"}</span></div>
              <div class="rush-mode-name">Class Arena</div>
              <div class="rush-mode-desc">${teacher ? "Project a QR code. Students join on phones and battle on one shared question set with a live leaderboard." : "Teachers host this from the whiteboard. Students: scan your teacher's QR code or enter the room code below."}</div>
            </div>
          </div>
        </div>

        <div id="rush-mode-panel"></div>

        <p class="muted" style="margin-top:14px">Personal Best: <b>${fmt(Store.d.best.rush || 0)} pts</b></p>
      </div>
    `;

    $("#rush-back").onclick = () => showScreen("home");
    $$(".rush-mode-card").forEach(card => {
      card.onclick = () => { this.playMode = card.dataset.mode; Sfx.click(); this.renderModePanel(); };
    });
    this.renderModePanel();
    showScreen("rush");
  },

  setGridHtml() {
    const sets = this.getAvailableSets();
    const total = (window.VOCAB || []).length;
    return `
      <div class="rush-section-block">
        <div class="rush-section-title">2. Choose Vocabulary Set</div>
        <div class="rush-sets-grid">
          <div class="rush-set-card ${this.selectedSet === 'all' ? 'active' : ''}" data-set="all">
            <div class="rush-set-header"><span class="rush-set-pill all">🌟 ALL SETS</span><span class="rush-check-icon">✓</span></div>
            <div class="rush-set-title">All Sets Mixed</div>
            <div class="rush-set-meta">${total} expressions</div>
            <div class="rush-set-perk"><span class="bonus-badge">🔥 +25% Score Bonus</span></div>
          </div>
          ${sets.map(s => `
            <div class="rush-set-card ${this.selectedSet === s.key ? 'active' : ''}" data-set="${esc(s.key)}">
              <div class="rush-set-header"><span class="rush-set-pill lvl">${esc(s.level)} · Set ${esc(s.set)}</span><span class="rush-check-icon">✓</span></div>
              <div class="rush-set-title">${esc(s.content || s.key)}</div>
              <div class="rush-set-meta">${s.count} expressions</div>
            </div>`).join('')}
        </div>
      </div>`;
  },

  bindSetGrid() {
    $$(".rush-set-card").forEach(card => {
      card.onclick = () => {
        this.selectedSet = card.dataset.set; Sfx.click();
        $$(".rush-set-card").forEach(c => c.classList.toggle("active", c === card));
      };
    });
  },

  renderModePanel() {
    $$(".rush-mode-card").forEach(c => c.classList.toggle("active", c.dataset.mode === this.playMode));
    const panel = $("#rush-mode-panel");
    if (!panel) return;
    const rules = `
      <div class="rush-rules-box"><ul>
        <li>⏳ <b>60s on the clock</b> — every solve refills <b style="color:var(--emerald)">+4s to +8s</b>; hints cost 2s, skips 5s</li>
        <li>🧩 <b>Unscramble tiles</b> word-by-word, first letter pre-placed</li>
        <li>⚡ <b>Combos</b> multiply your score up to 5x · All Sets Mixed gives <b style="color:var(--amber)">+25%</b></li>
      </ul></div>`;

    if (this.playMode === "solo") {
      panel.innerHTML = `${this.setGridHtml()}${rules}
        <div class="row" style="margin-top:20px"><button class="btn rush big-cta" id="rush-start">⚡ Start Solo Rush</button></div>`;
      this.bindSetGrid();
      $("#rush-start").onclick = () => { this.seed = null; this.ghost = null; this.start(); };
      return;
    }

    if (this.playMode === "duel") {
      panel.innerHTML = `
        <div class="duel-panel">
          <div class="duel-option">
            <h3>⚔️ Issue a Challenge</h3>
            <p class="muted">Play a 60s round first. Then you'll get a link + code to send on WhatsApp / Teams. Your rival gets the <b>same questions</b> and races your ghost.</p>
          </div>
          ${this.setGridHtml()}
          <div class="row"><button class="btn rush big-cta" id="duel-create">⚔️ Play &amp; Create Duel</button></div>
          <div class="duel-divider"><span>or accept a challenge</span></div>
          <div class="duel-join-row">
            <input id="duel-code-input" type="text" placeholder="Enter duel code (e.g. K7QM2X) or paste link" autocomplete="off" />
            <button class="btn primary" id="duel-join">Accept ⚔️</button>
          </div>
        </div>`;
      this.bindSetGrid();
      $("#duel-create").onclick = () => this.createDuel();
      $("#duel-join").onclick = () => this.joinDuelFromInput();
      $("#duel-code-input").onkeydown = (e) => { if (e.key === "Enter") this.joinDuelFromInput(); };
      return;
    }

    // class
    const teacher = RushNet.isTeacher();
    panel.innerHTML = `
      <div class="duel-panel">
        ${teacher ? `
          ${this.setGridHtml()}
          <div class="row"><button class="btn rush big-cta" id="arena-host">🏰 Open Class Arena (show QR)</button></div>
          <div class="duel-divider"><span>or join as a player</span></div>` : ``}
        <div class="duel-join-row">
          <input id="arena-code-input" type="text" inputmode="numeric" maxlength="6" placeholder="Room code (e.g. 4821)" autocomplete="off" />
          <button class="btn primary" id="arena-join">Join Arena 🏰</button>
        </div>
        ${!teacher ? `<div style="text-align:center;margin-top:14px"><button class="btn small secondary" id="arena-unlock-teacher">🔑 Teacher? Unlock Whiteboard Host</button></div>` : ``}
      </div>`;
    if (teacher) { this.bindSetGrid(); $("#arena-host").onclick = () => this.hostArena(); }
    if ($("#arena-unlock-teacher")) {
      $("#arena-unlock-teacher").onclick = () => {
        const code = (prompt("Enter Teacher Passcode to host Class Arena:") || "").trim().toLowerCase();
        if (code === "hpccss" || code === "teacher" || code === "staff") {
          localStorage.setItem("lexiquest.teacher_unlock", "1");
          toast("🎓 Teacher Whiteboard Mode unlocked!");
          this.intro();
        } else if (code) {
          toast("❌ Incorrect teacher passcode.");
        }
      };
    }
    $("#arena-join").onclick = () => { const v = $("#arena-code-input").value.trim(); if (v) this.handleArenaUrl(v); };
    $("#arena-code-input").onkeydown = (e) => { if (e.key === "Enter") $("#arena-join").click(); };
  },

  /* ================= CORE GAME ================= */
  // opts: { onEnd(result) } — duel / arena modes hook the end of the run
  start(opts = {}) {
    showScreen("rush");
    this.onEndHook = opts.onEnd || null;
    this.pool = this.resolvePool(this.selectedSet);
    this.isMixed = (this.selectedSet === "all");
    this.START = 60;

    // Deterministic queue for duels & class arena: identical order on every device
    this.queue = [];
    this.cycle = 0;

    Object.assign(this, {
      time: this.START, score: 0, combo: 0, maxCombo: 0, correct: 0, level: 1, elapsed: 0,
      missed: new Map(), recent: [], locked: false, lastSec: null, over: false,
      activeIdx: 0, slots: [], tiles: [], isPhrase: false,
      timeline: [[0, 0]], lastPush: 0, ended: false
    });

    const modeTag = this.arena ? `🏰 Room ${esc(this.arena.room)}` : this.ghost ? "⚔️ Duel" : "🧙 Solo";
    const el = $("#screen-rush");
    el.innerHTML = `
      <div class="game-head">
        <button class="back-btn" id="rush-quit" style="margin:0">✕ Quit</button>
        <div class="hud">
          <div class="pill">${modeTag}</div>
          <div class="pill">Lv <b id="r-level">1</b></div>
          <div class="pill" id="r-mult-pill">${this.isMixed ? "🔥 1.25x" : "x<b id='r-mult'>1</b>"}</div>
          <div class="pill">⭐ <b id="r-score">0</b></div>
        </div>
      </div>

      ${this.ghost ? `
        <div class="duel-live-hud" id="duel-hud">
          <div class="duel-player-tag me"><span class="dp-name">YOU</span><b id="dh-me">0</b></div>
          <div class="duel-vs"><span id="dh-status">⚔️ GO!</span><div class="duel-tug"><i id="dh-tug" style="width:50%"></i></div></div>
          <div class="duel-player-tag opp" style="--hc:${HOUSE_COLORS[this.ghost.h] || '#a78bfa'}"><span class="dp-name">👻 ${esc(this.ghost.n)}</span><b id="dh-opp">0</b></div>
        </div>` : ""}

      ${this.arena ? `
        <div class="arena-live-hud" id="arena-hud">
          <span class="arena-rank">Rank <b id="ah-rank">–</b>/<b id="ah-total">–</b></span>
          <span class="arena-top" id="ah-top">Waiting for classmates…</span>
        </div>` : ""}

      <div class="timer-wrap" id="r-timer">
        <div class="timer-num" id="r-time">${this.START}</div>
        <div class="timer-bar"><i id="r-bar" style="width:100%"></i></div>
      </div>
      <div class="combo" id="r-combo"></div>

      <div class="card cr-card" id="r-card">
        <div class="cr-meta"><span class="chip" id="r-pos"></span><span class="muted" id="r-topic"></span></div>
        <div class="cr-sentence" id="r-sentence"></div>
        <div class="cr-clues" id="r-clues"></div>
      </div>

      <div class="cr-typing-area">
        <div class="cr-slots-container" id="r-slots"></div>
        <div class="cr-actions">
          <button class="btn small" id="r-hint-btn">💡 Hint <small>(−2s)</small></button>
          <button class="btn small" id="r-undo-btn">⌫ Undo</button>
          <button class="btn small" id="r-skip-btn">⏩ Skip <small>(−5s)</small></button>
        </div>
      </div>
      <div class="cr-tile-bank-wrap"><div class="cr-tiles-bank" id="r-tiles"></div></div>
    `;

    $("#rush-quit").onclick = () => {
      if (this.arena && !confirm("Leave the Class Arena round? Your current score will be submitted.")) return;
      if (this.arena) { this.end(); return; }
      this.stop(); this.intro();
    };
    $("#r-hint-btn").onclick = () => this.useHintLetter();
    $("#r-undo-btn").onclick = () => this.handleBackspace();
    $("#r-skip-btn").onclick = () => this.skipCard();

    this.keyHandler = (e) => {
      if (this.over || this.locked) return;
      if (e.target && e.target.tagName === "INPUT") return;
      if (e.key === "Backspace") { e.preventDefault(); this.handleBackspace(); }
      else if (e.key.length === 1 && /[a-zA-Z0-9'-]/.test(e.key)) { e.preventDefault(); this.handleKey(e.key); }
    };
    window.addEventListener("keydown", this.keyHandler);

    currentCleanup = () => this.stop();
    this.nextCard();
    this.last = performance.now();
    this.raf = requestAnimationFrame((t) => this.loop(t));
  },

  stop() {
    this.over = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.keyHandler);
  },

  drain() { return Math.min(1.85, 1.0 + (this.level - 1) * 0.15); },

  loop(t) {
    if (this.over) return;
    const dt = Math.min(0.25, (t - this.last) / 1000);
    this.last = t;
    this.elapsed += dt;
    this.time -= dt * this.drain();

    if (this.ghost) this.renderGhost();
    if (this.arena && this.elapsed - this.lastPush > 3) { this.lastPush = this.elapsed; this.pushArena(false); }

    if (this.time <= 0) { this.time = 0; this.renderTimer(); return this.end(); }
    const sec = Math.ceil(this.time);
    if (this.time < 10 && sec !== this.lastSec) Sfx.tick();
    this.lastSec = sec;
    this.renderTimer();
    this.raf = requestAnimationFrame((tt) => this.loop(tt));
  },

  renderTimer() {
    const n = $("#r-time"); if (n) n.textContent = this.time < 10 ? this.time.toFixed(1) : Math.ceil(this.time);
    const bar = $("#r-bar"); if (bar) bar.style.width = Math.min(100, (this.time / 60) * 100) + "%";
    const w = $("#r-timer"); if (w) w.classList.toggle("danger", this.time < 10);
  },

  /* ghost score at the current elapsed time (from the opponent's recorded timeline) */
  ghostScoreAt(t) {
    const tl = this.ghost.tl || [];
    let s = 0;
    for (let i = 0; i < tl.length; i += 2) { if (tl[i] / 10 <= t) s = tl[i + 1]; else break; }
    return s;
  },

  renderGhost() {
    const opp = this.ghostScoreAt(this.elapsed);
    const me = this.score;
    const meEl = $("#dh-me"), oppEl = $("#dh-opp"), st = $("#dh-status"), tug = $("#dh-tug");
    if (!meEl) return;
    if (oppEl.textContent !== fmt(opp)) {
      oppEl.textContent = fmt(opp);
      oppEl.parentElement.classList.remove("bump"); void oppEl.offsetWidth; oppEl.parentElement.classList.add("bump");
    }
    meEl.textContent = fmt(me);
    const diff = me - opp;
    st.textContent = diff > 0 ? `🔥 Leading +${fmt(diff)}` : diff < 0 ? `😰 Behind ${fmt(-diff)}` : "⚖️ Tied";
    st.className = diff > 0 ? "lead" : diff < 0 ? "behind" : "";
    const pct = (me + opp) > 0 ? (me / (me + opp)) * 100 : 50;
    tug.style.width = Math.max(6, Math.min(94, pct)) + "%";
  },

  mult() { return Math.min(5, 1 + Math.floor(this.combo / 3)); },

  floatTime(txt, cls) {
    const f = document.createElement("div");
    f.className = `float-time ${cls}`;
    f.textContent = txt;
    const w = $("#r-timer");
    if (w) { w.appendChild(f); setTimeout(() => f.remove(), 1000); }
  },

  nextCard() {
    let target;
    if (this.seed) {
      if (!this.queue.length) {
        this.queue = shuffle([...this.pool], seededRng(`${this.seed}:order:${this.cycle++}`));
      }
      target = this.queue.shift();
    } else {
      const exclude = new Set(this.recent);
      target = Store.pickWords(1, exclude, this.pool)[0] || shuffle([...this.pool])[0];
      this.recent.push(target.key || target.id);
      if (this.recent.length > 10) this.recent.shift();
    }

    this.card = target;
    this.qStart = performance.now();
    this.locked = false;

    $("#r-pos").textContent = target.pos;
    $("#r-topic").textContent = target.topic ? `• ${target.topic}` : "";
    $("#r-sentence").innerHTML = esc(target.context).replace(/___/g, `<span class="cr-blank">[ ________ ]</span>`);
    $("#r-clues").innerHTML = `<b>Meaning:</b> ${esc(target.meaning_eng || target.meaning)}${target.meaning_chin ? `<br><b>中文:</b> ${esc(target.meaning_chin)}` : ""}`;
    this.setupSlots(target.word);
  },

  setupSlots(rawWord) {
    this.slots = []; this.tiles = []; this.activeIdx = 0;
    const words = rawWord.trim().split(/\s+/);
    this.isPhrase = words.length > 1;
    // Seeded per-card RNG => identical scramble for every duel / arena player
    const rnd = this.seed ? seededRng(`${this.seed}:tiles:${this.card.key || this.card.word}`) : Math.random;
    let sid = 0, tid = 0;

    words.forEach((w, wIdx) => {
      const wordTiles = [];
      let firstSlot = null;
      [...w.toUpperCase()].forEach(ch => {
        const isLetter = /[A-Z0-9]/.test(ch);
        const slot = { id: sid++, wIdx, ch, norm: ch, isLetter, typedCh: isLetter ? null : ch, tileId: null, correct: !isLetter, isHint: false, hasError: false };
        this.slots.push(slot);
        if (isLetter) {
          wordTiles.push({ id: tid++, wIdx, val: ch, norm: ch, used: false, isHint: false });
          if (!firstSlot) firstSlot = slot;
        }
      });
      const scrambled = this.scrambleWordTiles(wordTiles, rnd);
      if (firstSlot && wordTiles.length) {
        const h = scrambled.find(t => t.val === firstSlot.norm && !t.used);
        if (h) {
          h.used = true; h.isHint = true;
          Object.assign(firstSlot, { typedCh: h.val, tileId: h.id, correct: true, isHint: true });
        }
      }
      this.tiles.push(...scrambled);
    });

    this.advanceCursorToStart();
    this.renderSlots();
    this.renderTiles();
  },

  advanceCursorToStart() {
    const i = this.slots.findIndex(s => s.isLetter && !s.correct);
    this.activeIdx = i !== -1 ? i : 0;
  },

  scrambleWordTiles(wordTiles, rnd = Math.random) {
    if (wordTiles.length <= 1) return [...wordTiles];
    if (wordTiles.length === 2) return [wordTiles[1], wordTiles[0]];
    const orig = wordTiles.map(t => t.val).join("");
    const firstVal = wordTiles[0].val;
    let arr = [...wordTiles], attempts = 0;
    do {
      for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
      attempts++;
    } while (attempts < 30 && (arr.map(t => t.val).join("") === orig || arr[0].val === firstVal));
    if (arr.map(t => t.val).join("") === orig || arr[0].val === firstVal) arr.push(arr.shift());
    return arr;
  },

  groupBy(list) {
    const groups = []; let cur = [], last = null;
    list.forEach(x => {
      if (last !== null && x.wIdx !== last) { if (cur.length) groups.push(cur); cur = []; }
      last = x.wIdx; cur.push(x);
    });
    if (cur.length) groups.push(cur);
    return groups;
  },

  renderSlots() {
    const box = $("#r-slots");
    if (!box) return;
    const groups = this.groupBy(this.slots);
    box.style.setProperty("--wlen", Math.max(...groups.map(g => g.length), 1));
    box.innerHTML = groups.map((g, gi) => `${gi ? '<div class="cr-space-sep"></div>' : ''}<div class="cr-word-group" style="--wlen:${g.length}">${g.map(s => {
      if (!s.isLetter) return `<div class="cr-slot punct" data-idx="${s.id}">${esc(s.ch)}</div>`;
      const disp = s.typedCh || "";
      let cls = "cr-slot";
      if (s.id === this.activeIdx) cls += " active";
      if (s.correct && s.typedCh !== null) cls += " correct";
      if (s.isHint) cls += " hint-slot";
      if (s.hasError) cls += " error";
      if (disp && !s.isHint) cls += " has-content";
      return `<div class="${cls}" data-idx="${s.id}"><span class="cr-char">${esc(disp)}</span>${s.isHint ? '<span class="cr-hint-badge">HINT</span>' : ''}</div>`;
    }).join("")}</div>`).join("");
    $$("#r-slots .cr-slot[data-idx]").forEach(el => el.onclick = () => this.unpickSlot(+el.dataset.idx));
  },

  renderTiles() {
    const box = $("#r-tiles");
    if (!box) return;
    box.innerHTML = this.groupBy(this.tiles).map((g, gi) => `${gi ? '<div class="cr-tile-group-sep"></div>' : ''}<div class="cr-tile-group" style="--tlen:${g.length}">${g.map(t =>
      `<button class="cr-tile${t.used ? " used" : ""}${t.isHint ? " hint-tile" : ""}" data-tid="${t.id}" ${t.used ? "disabled" : ""}>${esc(t.val)}</button>`).join("")}</div>`).join("");
    $$("#r-tiles .cr-tile:not(.used)").forEach(btn => {
      let lastTap = 0;
      const act = (e) => {
        const now = Date.now();
        if (now - lastTap < 80) return;
        lastTap = now;
        if (e.cancelable) e.preventDefault();
        this.pickTile(+btn.dataset.tid);
      };
      btn.addEventListener("pointerdown", act, { passive: false });
      btn.addEventListener("click", act);
    });
  },

  flashError(slot) {
    slot.hasError = true; Sfx.wrong(); this.renderSlots();
    setTimeout(() => { if (!this.locked && !this.over && slot.hasError) { slot.hasError = false; this.renderSlots(); } }, 400);
  },

  pickTile(tileId) {
    if (this.locked || this.over) return;
    const tile = this.tiles.find(t => t.id === tileId);
    if (!tile || tile.used) return;
    const slot = this.slots[this.activeIdx];
    if (!slot || !slot.isLetter || slot.correct) return;
    if (tile.norm === slot.norm) {
      tile.used = true;
      Object.assign(slot, { typedCh: tile.val, tileId: tile.id, correct: true, hasError: false });
      Sfx.click();
      this.advanceCursor(); this.renderSlots(); this.renderTiles(); this.checkCompletion();
    } else this.flashError(slot);
  },

  unpickSlot(idx) {
    if (this.locked || this.over) return;
    const slot = this.slots[idx];
    if (!slot || slot.typedCh === null || slot.isHint || !slot.isLetter) return;
    if (slot.tileId !== null) { const t = this.tiles.find(t => t.id === slot.tileId); if (t) t.used = false; }
    Object.assign(slot, { typedCh: null, tileId: null, correct: false, hasError: false });
    this.activeIdx = idx; Sfx.click();
    this.renderSlots(); this.renderTiles();
  },

  handleBackspace() {
    if (this.locked || this.over) return;
    let i = this.activeIdx - 1;
    while (i >= 0) { const s = this.slots[i]; if (s.isLetter && !s.isHint && s.typedCh !== null) break; i--; }
    if (i < 0) {
      const s = this.slots[this.activeIdx];
      if (s && s.hasError) { s.hasError = false; this.renderSlots(); }
      return;
    }
    this.unpickSlot(i);
  },

  handleKey(raw) {
    if (this.locked || this.over) return;
    const key = raw.toUpperCase();
    const slot = this.slots[this.activeIdx];
    if (!slot || !slot.isLetter || slot.correct) return;
    if (key === slot.norm) {
      const m = this.tiles.find(t => !t.used && t.wIdx === slot.wIdx && t.norm === key) || this.tiles.find(t => !t.used && t.norm === key);
      if (m) return this.pickTile(m.id);
    }
    this.flashError(slot);
  },

  advanceCursor() {
    let n = this.activeIdx + 1;
    while (n < this.slots.length && (!this.slots[n].isLetter || (this.slots[n].correct && this.slots[n].typedCh !== null))) n++;
    if (n >= this.slots.length) { const f = this.slots.findIndex(s => s.isLetter && !s.correct); n = f !== -1 ? f : this.slots.length; }
    this.activeIdx = n;
  },

  useHintLetter() {
    if (this.locked || this.over) return;
    const idx = this.slots.findIndex(s => s.isLetter && !s.correct);
    if (idx === -1) return;
    const slot = this.slots[idx];
    const tile = this.tiles.find(t => !t.used && t.wIdx === slot.wIdx && t.norm === slot.norm) || this.tiles.find(t => !t.used && t.norm === slot.norm);
    if (!tile) return;
    tile.used = true; tile.isHint = true;
    Object.assign(slot, { typedCh: tile.val, tileId: tile.id, correct: true, isHint: true, hasError: false });
    this.time = Math.max(1, this.time - 2);
    this.floatTime("−2s", "minus");
    Sfx.click();
    this.advanceCursor(); this.renderSlots(); this.renderTiles(); this.checkCompletion();
  },

  skipCard() {
    if (this.locked || this.over) return;
    this.locked = true;
    this.time = Math.max(1, this.time - 5);
    this.floatTime("−5s", "minus");
    this.combo = 0;
    $("#r-combo").innerHTML = "";
    Sfx.wrong();
    this.slots.forEach(s => { s.typedCh = s.ch; s.correct = true; });
    this.tiles.forEach(t => t.used = true);
    this.renderSlots(); this.renderTiles();
    this.missed.set(this.card.key || this.card.id, this.card);
    Store.review(this.card, 1);
    setTimeout(() => { if (!this.over) this.nextCard(); }, 1200);
  },

  checkCompletion() {
    if (!this.slots.every(s => !s.isLetter || (s.correct && s.typedCh !== null))) return;
    this.locked = true;
    const rt = (performance.now() - this.qStart) / 1000;
    this.correct++;
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);

    const add = Math.min(8, this.BASE_ADD + Math.floor(this.combo / 3));
    const speedBonus = rt < 5 ? 80 : rt < 8 ? 30 : 0;
    const mixedMult = this.isMixed ? 1.25 : 1.0;
    const gained = Math.round((120 * this.mult() + speedBonus) * mixedMult);

    this.time += add;
    this.score += gained;
    this.timeline.push([Math.round(this.elapsed * 10), this.score]);
    this.floatTime(`+${add}s`, "plus");
    Sfx.correct(this.combo);
    Fx.confetti(40, innerWidth / 2, innerHeight / 2.5);
    Store.review(this.card, rt < 6 ? 5 : 4);

    if (this.combo >= 2) $("#r-combo").innerHTML = `<span>🔥 ${this.combo} COMBO! (+${add}s${this.isMixed ? " · +25% Mixed" : ""})</span>`;
    if (this.combo === 5) Store.unlock("combo10");
    if (this.combo === 15) Store.unlock("combo25");
    if (this.correct % 4 === 0) this.levelUp();

    $("#r-score").textContent = fmt(this.score);
    if (!this.isMixed) $("#r-mult").textContent = this.mult();
    else $("#r-mult-pill").textContent = `🔥 ${(this.mult() * 1.25).toFixed(2)}x`;
    if (this.arena) this.pushArena(false);

    setTimeout(() => { if (!this.over) this.nextCard(); }, 450);
  },

  levelUp() {
    this.level++;
    $("#r-level").textContent = this.level;
    Sfx.levelup();
    const b = document.createElement("div");
    b.className = "level-banner";
    b.innerHTML = `<span>LEVEL ${this.level}</span><div style="font-size:1rem;color:var(--muted);font-weight:600">The clock drains faster!</div>`;
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 1300);
  },

  end() {
    if (this.over && this.ended) return;
    this.stop();
    this.ended = true;
    this.timeline.push([Math.round(this.elapsed * 10), this.score]);
    if (this.score >= 2000) Store.unlock("rush2k");
    if (this.elapsed >= 90) Store.unlock("marathon");
    if (this.score >= 1000) Store.quest("rush");

    const result = { score: this.score, correct: this.correct, maxCombo: this.maxCombo, elapsed: this.elapsed,
                     level: this.level, missed: [...this.missed.values()], timeline: this.timeline };
    if (this.onEndHook) { const h = this.onEndHook; this.onEndHook = null; return h(result); }

    showResults({
      mode: "rush",
      emoji: this.score >= 2000 ? "⚡" : this.score >= 1000 ? "🔥" : "⏰",
      title: "Time's Up!",
      score: this.score,
      xp: Math.max(20, Math.round(this.score / 8)),
      stats: [["Mode", "🧙 Solo Rush"], ["Set", this.setLabel(this.selectedSet)], ["Solved", this.correct],
              ["Max Combo", `${this.maxCombo}x`], ["Survived", `${Math.round(this.elapsed)}s`], ["Level", this.level]],
      review: result.missed,
      replay: () => this.start()
    });
  },

  /* Records a multiplayer run (duel / arena) into best score, XP and the school leaderboard */
  recordRun(score) {
    const isBest = Store.setBest("rush", score);
    Store.addLB("rush", score);
    if (typeof Leaderboard !== "undefined" && Leaderboard.submitScore) Leaderboard.submitScore("rush", score);
    Store.addXP(Math.max(20, Math.round(score / 8)));
    Store.recordPlay();
    return isBest;
  },

  /* ================= ⚔️ WIZARDS' DUEL ================= */
  createDuel() {
    this.seed = RushNet.newSeed();
    this.ghost = null;
    this.start({ onEnd: (r) => this.finishCreateDuel(r) });
  },

  runSummary(r) {
    const me = RushNet.me();
    return { n: me.name, h: me.house, sc: r.score, c: r.correct, mc: r.maxCombo, tl: r.timeline.flat() };
  },

  async finishCreateDuel(r) {
    this.recordRun(r.score);
    const payload = { v: 1, k: "c", s: this.seed, set: this.selectedSet, ...this.runSummary(r) };
    const enc = RushNet.encode(payload);
    const link = `${RushNet.baseUrl()}?duel=${enc}`;
    this.renderDuelShare(payload, link, null);
    try {
      const res = await RushNet.call("duel_save", { payload: enc });
      if (res.code) {
        const shortLink = `${RushNet.baseUrl()}?duel=${res.code}`;
        this.renderDuelShare(payload, shortLink, res.code);
      }
    } catch (e) {
      console.info("[Duel] short code unavailable, using full link", e.message);
    }
  },

  renderDuelShare(p, link, code) {
    const el = $("#screen-rush");
    const msg = `⚔️ ${p.n} challenges you to a Cryptic Rush duel! Beat ${fmt(p.sc)} pts on the SAME questions: ${link}`;
    el.innerHTML = `
      <div class="card duel-share-card">
        <div class="big-emoji">⚔️</div>
        <h1>Challenge Ready!</h1>
        <p class="muted">You scored <b class="grad-text" style="font-size:1.4rem">${fmt(p.sc)}</b> pts · ${p.c} solved · ${esc(this.setLabel(p.set))}</p>
        <p>Send this to a friend. They'll get the <b>exact same questions</b> and race your ghost live.</p>
        ${code ? `<div class="duel-code-big" title="Duel code">${esc(code)}</div><p class="muted" style="margin-top:-6px">Duel code — friends can type this in Cryptic Rush → Wizards' Duel</p>`
               : `<p class="muted"><small>⏳ Generating short code…</small></p>`}
        <div class="duel-link-box"><input readonly value="${esc(link)}" id="duel-link-input" /></div>
        <div class="duel-share-actions">
          <button class="btn primary" id="duel-copy">📋 Copy Link</button>
          <a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(msg)}">💬 WhatsApp</a>
          ${navigator.share ? `<button class="btn" id="duel-native">📤 Share…</button>` : ""}
        </div>
        <div class="row" style="margin-top:18px">
          <button class="btn rush" id="duel-again">⚔️ New Duel</button>
          <button class="btn" id="duel-home">🏠 Home</button>
        </div>
      </div>`;
    $("#duel-copy").onclick = () => RushNet.copy(link);
    $("#duel-link-input").onclick = (e) => e.target.select();
    if ($("#duel-native")) $("#duel-native").onclick = () => navigator.share({ title: "Cryptic Rush Duel", text: msg }).catch(() => {});
    $("#duel-again").onclick = () => { this.playMode = "duel"; this.intro(); };
    $("#duel-home").onclick = () => showScreen("home");
    showScreen("rush");
  },

  async joinDuelFromInput() {
    let v = ($("#duel-code-input").value || "").trim();
    if (!v) return;
    const m = v.match(/[?&]duel=([^&#\s]+)/);
    if (m) v = m[1];
    this.handleDuelUrl(v);
  },

  async handleDuelUrl(raw) {
    try { history.replaceState(null, "", RushNet.baseUrl()); } catch { }
    let str = String(raw).trim();
    try {
      if (/^[A-Za-z0-9]{4,8}$/.test(str)) {
        toast("🔎 Looking up duel code…");
        const res = await RushNet.call("duel_get", { code: str.toUpperCase() });
        str = res.payload;
      }
      const p = RushNet.decode(str);
      if (!p || !p.s && p.k !== "r") throw new Error("bad payload");
      if (p.k === "r") return this.renderDuelPodium(p.a, p.b, p.set, true);
      this.renderDuelInvite(p);
    } catch (e) {
      console.warn(e);
      toast("❌ That duel code / link isn't valid or has expired.");
      this.playMode = "duel";
      this.intro();
    }
  },

  renderDuelInvite(p) {
    const hc = HOUSE_COLORS[p.h] || "#a78bfa";
    const el = $("#screen-rush");
    el.innerHTML = `
      <button class="back-btn" id="inv-back">← Cryptic Rush</button>
      <div class="card duel-invite-card" style="--hc:${hc}">
        <div class="duel-invite-crest">⚔️</div>
        <div class="duel-invite-kicker">A WIZARD HAS CHALLENGED YOU</div>
        <h1>${esc(p.n)}</h1>
        ${p.h ? `<div class="duel-house-chip">House ${esc(p.h)}</div>` : ""}
        <div class="duel-target">
          <span>Score to beat</span>
          <b>${fmt(p.sc)}</b>
          <small>${p.c} expressions solved · ${esc(this.setLabel(p.set))}</small>
        </div>
        <ul class="duel-invite-rules">
          <li>🎯 Same questions, same tile scrambles as ${esc(p.n)}</li>
          <li>👻 Their ghost score climbs live next to yours</li>
          <li>⏳ 60s countdown — normal Rush rules</li>
        </ul>
        <button class="btn rush big-cta" id="inv-accept">⚔️ Accept Duel</button>
      </div>`;
    $("#inv-back").onclick = () => { this.playMode = "duel"; this.intro(); };
    $("#inv-accept").onclick = () => {
      Sfx.click();
      this.seed = p.s;
      this.selectedSet = p.set || "all";
      this.ghost = p;
      this.countdown(() => this.start({ onEnd: (r) => this.finishDuel(r, p) }));
    };
    showScreen("rush");
  },

  countdown(cb, from = 3) {
    const o = document.createElement("div");
    o.className = "duel-countdown";
    document.body.appendChild(o);
    let n = from;
    const tick = () => {
      if (n <= 0) { o.remove(); return cb(); }
      o.innerHTML = `<span>${n}</span>`;
      Sfx.tick();
      n--;
      setTimeout(tick, 800);
    };
    tick();
  },

  finishDuel(r, challenger) {
    this.recordRun(r.score);
    const mine = this.runSummary(r);
    this.lastReply = { v: 1, k: "r", set: challenger.set, a: { n: challenger.n, h: challenger.h, sc: challenger.sc, c: challenger.c }, b: { n: mine.n, h: mine.h, sc: mine.sc, c: mine.c } };
    this.renderDuelPodium(this.lastReply.a, this.lastReply.b, challenger.set, false);
  },

  // a = challenger, b = defender; viewOnly = opened from a reply link
  renderDuelPodium(a, b, setKey, viewOnly) {
    const me = RushNet.me();
    const iAmA = viewOnly && a.n === me.name;
    const left = viewOnly ? (iAmA ? a : b) : b;   // "you"
    const right = viewOnly ? (iAmA ? b : a) : a;  // opponent
    const win = left.sc > right.sc, tie = left.sc === right.sc;
    const title = tie ? "⚖️ A Perfect Tie!" : win ? "🏆 VICTORY!" : "💀 Defeated…";
    const el = $("#screen-rush");
    el.innerHTML = `
      <div class="card duel-result-podium ${tie ? "tie" : win ? "win" : "lose"}">
        <div class="duel-result-banner">${title}</div>
        <p class="muted">${esc(this.setLabel(setKey))}</p>
        <div class="duel-podium-row">
          ${[left, right].map((x, i) => `
            <div class="duel-podium-col ${x.sc >= (i ? left : right).sc ? "top" : ""}" style="--hc:${HOUSE_COLORS[x.h] || '#a78bfa'}">
              <div class="dpc-crown">${x.sc > (i ? left : right).sc ? "👑" : ""}</div>
              <div class="dpc-name">${i === 0 ? "YOU" : esc(x.n)}</div>
              ${x.h ? `<div class="dpc-house">${esc(x.h)}</div>` : ""}
              <div class="dpc-bar"><i style="height:${Math.max(8, (x.sc / Math.max(1, left.sc, right.sc)) * 100)}%"></i></div>
              <div class="dpc-score">${fmt(x.sc)}</div>
              <div class="dpc-meta">${x.c} solved</div>
            </div>`).join("")}
        </div>
        <div class="duel-share-actions">
          ${!viewOnly ? `<button class="btn primary" id="dp-reply">📨 Send result to ${esc(right.n)}</button>` : ""}
          <button class="btn rush" id="dp-rematch">⚔️ Start a New Duel</button>
          <button class="btn" id="dp-home">🏠 Home</button>
        </div>
      </div>`;
    if (!viewOnly) {
      if (win) { Sfx.fanfare(); Fx.confetti(200); }
      $("#dp-reply").onclick = () => {
        const link = `${RushNet.baseUrl()}?duel=${RushNet.encode(this.lastReply)}`;
        const msg = `⚔️ Duel result: ${left.n} ${fmt(left.sc)} vs your ${fmt(right.sc)}! ${link}`;
        if (navigator.share) navigator.share({ title: "Duel result", text: msg }).catch(() => RushNet.copy(link));
        else RushNet.copy(msg);
      };
    }
    $("#dp-rematch").onclick = () => { this.playMode = "duel"; this.intro(); };
    $("#dp-home").onclick = () => showScreen("home");
    showScreen("rush");
  },

  /* ================= 🏰 CLASS ARENA ================= */
  stopPolling() {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
  },
  leaveArena() {
    this.stopPolling();
    this.arena = null;
  },
  poll(fn, ms = 2500) {
    this.stopPolling();
    const run = async () => { if (this.polling) return; this.polling = true; try { await fn(); } finally { this.polling = false; } };
    run();
    this.pollTimer = setInterval(run, ms);
  },

  arenaLink(room) { return `${RushNet.baseUrl()}?arena=${room}`; },

  qrSvg(text) {
    try {
      const qr = qrcode(0, "M");
      qr.addData(text);
      qr.make();
      return qr.createSvgTag(8, 2);
    } catch (e) {
      console.warn("QR failed", e);
      return `<div class="muted">QR unavailable — use the room code</div>`;
    }
  },

  houseTotals(players) {
    const t = { TAK: 0, CHI: 0, KIN: 0, KAN: 0 };
    players.forEach(p => { if (t[p.h] !== undefined) t[p.h] += p.s || 0; });
    return Object.entries(t).sort((a, b) => b[1] - a[1]);
  },

  leaderboardHtml(players, myPid, limit = 50) {
    if (!players.length) return `<div class="muted arena-empty">No players yet…</div>`;
    const top = Math.max(1, players[0].s || 0);
    return players.slice(0, limit).map((p, i) => `
      <div class="arena-lb-row ${p.pid === myPid ? "me" : ""} ${p.d ? "done" : ""}" style="--hc:${HOUSE_COLORS[p.h] || '#94a3b8'}">
        <span class="alb-rank">${i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span>
        <span class="alb-name">${esc(p.n)}${p.h ? ` <small>${esc(p.h)}</small>` : ""}${p.d ? " ✅" : ""}</span>
        <span class="alb-bar"><i style="width:${Math.max(2, ((p.s || 0) / top) * 100)}%"></i></span>
        <b class="alb-score">${fmt(p.s || 0)}</b>
      </div>`).join("");
  },

  podiumHtml(players) {
    const p = players.slice(0, 3);
    const order = [p[1], p[0], p[2]];
    const cls = ["second", "first", "third"];
    const medal = ["🥈", "🥇", "🥉"];
    return `<div class="arena-podium">${order.map((x, i) => x ? `
      <div class="arena-podium-col ${cls[i]}" style="--hc:${HOUSE_COLORS[x.h] || '#a78bfa'}">
        <div class="apc-medal">${medal[i]}</div>
        <div class="apc-name">${esc(x.n)}</div>
        <div class="apc-score">${fmt(x.s)}</div>
        <div class="apc-block">${x.h ? esc(x.h) : ""}</div>
      </div>` : `<div class="arena-podium-col ${cls[i]} empty"></div>`).join("")}</div>`;
  },

  houseCupHtml(players) {
    const totals = this.houseTotals(players);
    const max = Math.max(1, totals[0][1]);
    return `<div class="arena-house-cup">${totals.map(([h, s]) => `
      <div class="ahc-row" style="--hc:${HOUSE_COLORS[h]}"><span>${h}</span><span class="ahc-bar"><i style="width:${(s / max) * 100}%"></i></span><b>${fmt(s)}</b></div>`).join("")}</div>`;
  },

  /* ---------- Teacher host ---------- */
  async hostArena() {
    if (!RushNet.isTeacher()) return toast("🔒 Class Arena hosting is for teacher accounts only.");
    const me = RushNet.me();
    const room = String(Math.floor(1000 + Math.random() * 9000));
    const seed = RushNet.newSeed();
    toast("🏰 Opening the Arena…");
    try {
      const res = await RushNet.call("arena_create", { room, seed, set: this.selectedSet, name: me.name, role: me.role });
      this.arena = { room, host: true, state: res.arena };
      this.renderHost();
    } catch (e) {
      modal(`<div style="text-align:center;padding:10px">
        <div style="font-size:2.6rem">🛠️</div><h2>Class Arena needs a quick backend update</h2>
        <p class="muted" style="text-align:left">The live room service couldn't be reached (<i>${esc(e.message)}</i>).<br><br>
        Paste the latest <b>tools/leaderboard_apps_script.gs</b> into your Google Sheet's Apps Script, then
        <b>Deploy → Manage deployments → Edit → New version</b>.</p>
        <button class="btn primary" onclick="closeModal()">OK</button></div>`);
    }
  },

  renderHost() {
    const a = this.arena;
    const link = this.arenaLink(a.room);
    const el = $("#screen-rush");
    el.innerHTML = `
      <div class="class-arena-host">
        <div class="cah-top">
          <button class="back-btn" id="cah-close" style="margin:0">✕ Close Arena</button>
          <div class="cah-title">🏰 Class Arena · <span id="cah-set">${esc(this.setLabel(a.state.set))}</span></div>
          <div class="cah-status" id="cah-status">LOBBY</div>
        </div>
        <div class="cah-body">
          <div class="cah-join">
            <div class="arena-qr-box">${this.qrSvg(link)}</div>
            <div class="arena-code-banner"><span>Room code</span><b>${esc(a.room)}</b></div>
            <p class="muted cah-hint">Scan with your phone camera, or open Cryptic Rush → Class Arena and type the code.</p>
            <button class="btn small" id="cah-copy">📋 Copy join link</button>
          </div>
          <div class="cah-board">
            <div class="cah-board-head">
              <h2 id="cah-board-title">Wizards in the hall: <b id="cah-count">0</b></h2>
              <div class="cah-controls">
                <button class="btn rush" id="cah-start">🚀 Launch Battle</button>
                <button class="btn hidden" id="cah-end">🏁 End Round</button>
                <button class="btn hidden" id="cah-new">🔄 New Round</button>
              </div>
            </div>
            <div id="cah-podium"></div>
            <div class="arena-lb" id="cah-lb"></div>
            <div id="cah-house"></div>
          </div>
        </div>
      </div>`;
    $("#cah-close").onclick = () => { this.leaveArena(); this.intro(); };
    $("#cah-copy").onclick = () => RushNet.copy(link);
    $("#cah-start").onclick = () => this.hostAction("arena_start");
    $("#cah-end").onclick = () => this.hostAction("arena_end");
    $("#cah-new").onclick = () => this.hostAction("arena_reset", { seed: RushNet.newSeed() });
    showScreen("rush");
    currentCleanup = () => this.stopPolling();
    this.renderHostState(a.state);
    this.poll(async () => {
      try { const r = await RushNet.call("arena_state", { room: a.room }); this.renderHostState(r.arena); } catch (e) { console.warn(e); }
    }, 2500);
  },

  async hostAction(action, extra = {}) {
    const me = RushNet.me();
    try {
      Sfx.click();
      const r = await RushNet.call(action, { room: this.arena.room, role: me.role, ...extra });
      this.renderHostState(r.arena);
      if (action === "arena_end") { Sfx.fanfare(); Fx.confetti(220); }
    } catch (e) { toast("❌ " + esc(e.message)); }
  },

  renderHostState(s) {
    if (!s || !$("#cah-lb")) return;
    this.arena.state = s;
    const players = s.players || [];
    $("#cah-count").textContent = players.length;
    const st = $("#cah-status");
    st.textContent = s.status === "live" ? "🔴 LIVE" : s.status === "ended" ? "🏁 FINISHED" : "LOBBY";
    st.className = `cah-status ${s.status}`;
    $("#cah-start").classList.toggle("hidden", s.status !== "lobby");
    $("#cah-end").classList.toggle("hidden", s.status !== "live");
    $("#cah-new").classList.toggle("hidden", s.status !== "ended");
    const done = players.filter(p => p.d).length;
    $("#cah-board-title").innerHTML = s.status === "lobby"
      ? `Wizards in the hall: <b id="cah-count">${players.length}</b>`
      : s.status === "live" ? `⚡ Live battle · ${done}/${players.length} finished<b id="cah-count" class="hidden">${players.length}</b>`
      : `🏆 Final standings<b id="cah-count" class="hidden">${players.length}</b>`;

    if (s.status === "lobby") {
      $("#cah-podium").innerHTML = "";
      $("#cah-lb").innerHTML = players.length
        ? `<div class="arena-roster">${players.map(p => `<span class="arena-chip" style="--hc:${HOUSE_COLORS[p.h] || '#94a3b8'}">${esc(p.n)}</span>`).join("")}</div>`
        : `<div class="muted arena-empty">Waiting for students to scan the QR code…</div>`;
      $("#cah-house").innerHTML = "";
    } else {
      $("#cah-podium").innerHTML = s.status === "ended" ? this.podiumHtml(players) : "";
      $("#cah-lb").innerHTML = this.leaderboardHtml(players, null);
      $("#cah-house").innerHTML = `<h3>🏆 House Cup this round</h3>${this.houseCupHtml(players)}`;
    }
  },

  /* ---------- Student join ---------- */
  async handleArenaUrl(raw) {
    try { history.replaceState(null, "", RushNet.baseUrl()); } catch { }
    const room = String(raw).replace(/[^0-9A-Za-z]/g, "").toUpperCase();
    if (!room) return;
    const me = RushNet.me();
    toast(`🏰 Joining room ${esc(room)}…`);
    try {
      const r = await RushNet.call("arena_join", { room, pid: me.pid, name: me.name, house: me.house, score: 0, correct: 0, done: "0" });
      this.arena = { room, host: false, state: r.arena, started: false };
      this.renderLobby();
    } catch (e) {
      toast(`❌ Couldn't join room ${esc(room)}: ${esc(e.message)}`);
      this.playMode = "class";
      this.intro();
    }
  },

  renderLobby() {
    const a = this.arena;
    const el = $("#screen-rush");
    el.innerHTML = `
      <button class="back-btn" id="lob-leave">← Leave Arena</button>
      <div class="card arena-lobby-card">
        <div class="duel-invite-crest">🏰</div>
        <div class="duel-invite-kicker">CLASS ARENA · ROOM ${esc(a.room)}</div>
        <h1 id="lob-title">You're in!</h1>
        <p class="muted" id="lob-sub">Waiting for ${esc(a.state.host || "your teacher")} to launch the battle…</p>
        <div class="arena-lobby-count"><b id="lob-count">${(a.state.players || []).length}</b> wizards ready</div>
        <div class="arena-roster" id="lob-roster"></div>
        <p class="muted"><small>📚 ${esc(this.setLabel(a.state.set))} · Everyone gets the same questions</small></p>
      </div>`;
    $("#lob-leave").onclick = () => { this.leaveArena(); this.intro(); };
    showScreen("rush");
    currentCleanup = () => this.stopPolling();
    this.renderLobbyState(a.state);
    this.poll(async () => {
      try { const r = await RushNet.call("arena_state", { room: a.room }); this.renderLobbyState(r.arena); } catch (e) { console.warn(e); }
    }, 2000);
  },

  renderLobbyState(s) {
    if (!s || !this.arena || this.arena.started) return;
    this.arena.state = s;
    const players = s.players || [];
    const c = $("#lob-count"); if (c) c.textContent = players.length;
    const r = $("#lob-roster");
    if (r) r.innerHTML = players.map(p => `<span class="arena-chip" style="--hc:${HOUSE_COLORS[p.h] || '#94a3b8'}">${esc(p.n)}</span>`).join("");
    if (s.status === "live") {
      this.arena.started = true;
      this.stopPolling();
      this.seed = s.seed;
      this.selectedSet = s.set || "all";
      this.ghost = null;
      const delayMs = Math.max(0, (s.startAt || 0) - (s.now || 0));
      const secs = Math.min(5, Math.ceil(delayMs / 1000));
      const go = () => this.start({ onEnd: (res) => this.finishArena(res) });
      if (secs > 0) this.countdown(go, secs); else go();
    }
  },

  async pushArena(done) {
    if (!this.arena || this.arena.host || (this.pushing && !done)) return;
    this.pushing = true;
    const me = RushNet.me();
    try {
      const r = await RushNet.call("arena_update", {
        room: this.arena.room, pid: me.pid, name: me.name, house: me.house,
        score: this.score, correct: this.correct, done: done ? "1" : "0"
      });
      if (this.arena) this.arena.state = r.arena;
      this.renderArenaHud(r.arena, me.pid);
      return r.arena;
    } catch (e) { console.warn("[Arena] update failed", e); }
    finally { this.pushing = false; }
  },

  renderArenaHud(s, pid) {
    const rankEl = $("#ah-rank");
    if (!s || !rankEl) return;
    const players = s.players || [];
    const idx = players.findIndex(p => p.pid === pid);
    rankEl.textContent = idx >= 0 ? idx + 1 : "–";
    $("#ah-total").textContent = players.length;
    $("#ah-top").innerHTML = players.slice(0, 3).map((p, i) =>
      `<span class="ah-chip ${p.pid === pid ? "me" : ""}" style="--hc:${HOUSE_COLORS[p.h] || '#94a3b8'}">${["🥇", "🥈", "🥉"][i]} ${esc(p.n.split(" ")[0])} ${fmt(p.s)}</span>`).join("");
  },

  async finishArena(r) {
    this.recordRun(r.score);
    await this.pushArena(true);
    const me = RushNet.me();
    const el = $("#screen-rush");
    el.innerHTML = `
      <div class="card arena-result-card">
        <div class="duel-invite-kicker">CLASS ARENA · ROOM ${esc(this.arena ? this.arena.room : "")}</div>
        <h1>⏰ Time's up!</h1>
        <div class="score-big grad-text">${fmt(r.score)}</div>
        <p class="muted">${r.correct} solved · max combo ${r.maxCombo}x</p>
        <div class="arena-my-rank" id="ar-rank">Calculating rank…</div>
        <div id="ar-podium"></div>
        <div class="arena-lb" id="ar-lb"></div>
        <div class="row" style="margin-top:16px"><button class="btn" id="ar-home">🏠 Leave Arena</button></div>
      </div>`;
    $("#ar-home").onclick = () => { this.leaveArena(); showScreen("home"); };
    showScreen("rush");
    currentCleanup = () => this.stopPolling();
    const room = this.arena && this.arena.room;
    let celebrated = false;
    const render = (s) => {
      if (!s || !$("#ar-lb")) return;
      const players = s.players || [];
      const i = players.findIndex(p => p.pid === me.pid);
      const done = players.filter(p => p.d).length;
      $("#ar-rank").innerHTML = s.status === "ended"
        ? `🏁 Final rank: <b>#${i + 1}</b> of ${players.length}`
        : `Current rank: <b>#${i + 1}</b> of ${players.length} · ${done}/${players.length} finished`;
      $("#ar-podium").innerHTML = s.status === "ended" ? this.podiumHtml(players) : "";
      $("#ar-lb").innerHTML = this.leaderboardHtml(players, me.pid, 10);
      if (s.status === "ended") {
        // keep polling quietly so a teacher's "New Round" brings everyone back
        if (!celebrated) { celebrated = true; if (i === 0) { Sfx.fanfare(); Fx.confetti(220); } }
      } else if (s.status === "lobby" && this.arena) {
        // teacher started a new round → back to the lobby
        this.arena.started = false;
        this.arena.state = s;
        this.renderLobby();
      }
    };
    if (this.arena && this.arena.state) render(this.arena.state);
    if (room) this.poll(async () => {
      try { const res = await RushNet.call("arena_state", { room }); render(res.arena); } catch (e) { console.warn(e); }
    }, 3000);
  }
};
