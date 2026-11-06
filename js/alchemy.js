/* ===================================================================
   MODE: COLLOCATION ALCHEMY (⚗️ Spell-Binding & Collocation Arena)
   Based on 250 Academic Collocations across 4 Patterns:
     - Verb + Noun
     - Verb + Preposition
     - Noun + Preposition
     - Adjective + Preposition
   
   Features:
     - Bidirectional Testing:
         * Forward (Head -> Partner / Preposition)
         * Reverse (Partner / Preposition -> Head)
     - 3 Play Modes:
         1) 🧙 Solo Alchemy (60s countdown, combo multipliers, category filters)
         2) ⚔️ Wizards' Duel (1v1 Chamber with link/code, synchronized question seed, live head-to-head or ghost)
         3) 🏰 Class Arena (Teacher whiteboard with live QR code, 4-digit PIN, live roster, Top 3 Wizards + Four Houses standings)
   =================================================================== */

const AlchemyNet = {
  // Re-use RushNet infrastructure for seamless zero-backend-redeploy cloud sync
  memRooms: {},
  myRecord: {},
  bc: (typeof BroadcastChannel !== "undefined") ? new BroadcastChannel("lexiquest_alchemy") : null,

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
      const raw = localStorage.getItem("lexiquest.alch." + key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  localPut(key, val) {
    try {
      localStorage.setItem("lexiquest.alch." + key, JSON.stringify(val));
      if (this.bc) this.bc.postMessage({ key, val });
    } catch {}
  },

  async cloudGet(key) {
    const url = this.apiUrl();
    if (!url) return null;
    const qs = new URLSearchParams({ action: "sync_pull", hash: "alch_" + key, _t: Date.now() });
    const resp = await fetch(`${url}${url.includes("?") ? "&" : "?"}${qs}`, { method: "GET", cache: "no-store" });
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    const data = await resp.json();
    if (data && data.profile && data.profile.words && typeof data.profile.words === "object") {
      return data.profile.words;
    }
    return null;
  },

  async cloudPut(key, obj, label = "Alchemy") {
    this.localPut(key, obj);
    const url = this.apiUrl();
    if (!url) return { status: "success" };
    const qs = new URLSearchParams({
      action: "sync_push",
      hash: "alch_" + key,
      name: String(label || "Alchemy").slice(0, 30),
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
        tl: (y.tl && y.tl.length >= (x.tl || []).length) ? y.tl : (x.tl || []),
        t: Math.max(x.t || 0, y.t || 0)
      };
    });
    return {
      room: b.room || a.room,
      roundId: rb,
      seed: b.seed || a.seed,
      cat: b.cat || a.cat || "all",
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
      cat: raw.cat || "all",
      host: raw.host || "Teacher",
      status: raw.status || "lobby",
      startAt: raw.startAt || 0,
      now: Date.now(),
      players
    };
  },

  async call(action, params = {}) {
    // 1. 1v1 Duel short codes
    if (action === "duel_save") {
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < 6; i++) code += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
      const payload = String(params.payload || "");
      await this.cloudPut("duel_code_" + code, { payload, t: Date.now() }, "AlchemyDuel " + code);
      return { status: "success", code };
    }
    if (action === "duel_get") {
      const code = String(params.code || "").trim().toUpperCase();
      const key = "duel_code_" + code;
      const data = this.localGet(key) || await this.cloudGet(key);
      if (data && data.payload) return { status: "success", payload: data.payload };
      throw new Error("Duel code not found");
    }

    // 2. Class Arena / Duel Room synchronization
    const room = String(params.room || "").trim().toUpperCase();
    const key = "room_" + room;

    if (action === "arena_create") {
      const raw = {
        room,
        roundId: 1,
        seed: String(params.seed || this.newSeed()),
        cat: String(params.cat || "all"),
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
    try { remote = await this.cloudGet(key); } catch (e) { console.warn("[AlchemyNet] cloudGet fallback:", e); }
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
        tl: Array.isArray(params.timeline) ? params.timeline : (prev.tl || []),
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
        Object.values(cur.pMap || {}).forEach(p => { p.s = 0; p.c = 0; p.d = 0; p.tl = []; p.t = Date.now(); });
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
          rec.player = { ...rec.player, s: 0, c: 0, d: 0, tl: [], t: Date.now() };
        }
        const rp = remote && remote.pMap && remote.pMap[rec.player.pid];
        if (!rp || (rp.s || 0) < (rec.player.s || 0) || (rp.d || 0) < (rec.player.d || 0)) {
          cur.pMap = cur.pMap || {};
          cur.pMap[rec.player.pid] = {
            ...rec.player,
            s: Math.max((cur.pMap[rec.player.pid] && cur.pMap[rec.player.pid].s) || 0, rec.player.s || 0),
            c: Math.max((cur.pMap[rec.player.pid] && cur.pMap[rec.player.pid].c) || 0, rec.player.c || 0),
            d: Math.max((cur.pMap[rec.player.pid] && cur.pMap[rec.player.pid].d) || 0, rec.player.d || 0),
            tl: (cur.pMap[rec.player.pid] && cur.pMap[rec.player.pid].tl) || rec.player.tl || []
          };
          needHeal = true;
        }
      }
      if (typeof Alchemy !== "undefined" && Alchemy.arena && Alchemy.arena.host && Alchemy.arena.room === room && remote) {
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

const Alchemy = {
  START: 60,
  BASE_ADD: 3,
  playMode: "solo",        // "solo" | "duel" | "class"
  selectedCategory: "all", // "all" | "Verb + Noun" | "Verb + Preposition" | "Noun + Preposition" | "Adjective + Preposition"
  seed: null,
  ghost: null,
  duel: null,
  arena: null,

  // Runtime Game State
  active: false,
  timer: 0,
  timerId: null,
  score: 0,
  streak: 0,
  maxStreak: 0,
  solvedCount: 0,
  scoreTimeline: [],
  currentQ: null,
  questionQueue: [],
  questionIndex: 0,
  contextShown: false,

  // Distractor Pool
  PREPOSITIONS: ["to", "for", "of", "with", "about", "in", "on", "at", "from", "into", "towards", "between", "over", "by"],

  IRREGULARS: {
    give: { base: "give", past: "gave", part: "given", ing: "giving", s: "gives" },
    have: { base: "have", past: "had", part: "had", ing: "having", s: "has" },
    overcome: { base: "overcome", past: "overcame", part: "overcome", ing: "overcoming", s: "overcomes" },
    pay: { base: "pay", past: "paid", part: "paid", ing: "paying", s: "pays" },
    break: { base: "break", past: "broke", part: "broken", ing: "breaking", s: "breaks" },
    keep: { base: "keep", past: "kept", part: "kept", ing: "keeping", s: "keeps" },
    beat: { base: "beat", past: "beat", part: "beaten", ing: "beating", s: "beats" },
    catch: { base: "catch", past: "caught", part: "caught", ing: "catching", s: "catches" },
    do: { base: "do", past: "did", part: "done", ing: "doing", s: "does" },
    hold: { base: "hold", past: "held", part: "held", ing: "holding", s: "holds" },
    lose: { base: "lose", past: "lost", part: "lost", ing: "losing", s: "loses" },
    make: { base: "make", past: "made", part: "made", ing: "making", s: "makes" },
    run: { base: "run", past: "ran", part: "run", ing: "running", s: "runs" },
    set: { base: "set", past: "set", part: "set", ing: "setting", s: "sets" },
    take: { base: "take", past: "took", part: "taken", ing: "taking", s: "takes" },
    tell: { base: "tell", past: "told", part: "told", ing: "telling", s: "tells" },
    win: { base: "win", past: "won", part: "won", ing: "winning", s: "wins" },
    throw: { base: "throw", past: "threw", part: "thrown", ing: "throwing", s: "throws" },
    hear: { base: "hear", past: "heard", part: "heard", ing: "hearing", s: "hears" },
    lead: { base: "lead", past: "led", part: "led", ing: "leading", s: "leads" },
    find: { base: "find", past: "found", part: "found", ing: "finding", s: "finds" },
    bring: { base: "bring", past: "brought", part: "brought", ing: "bringing", s: "brings" },
    fall: { base: "fall", past: "fell", part: "fallen", ing: "falling", s: "falls" },
    rise: { base: "rise", past: "rose", part: "risen", ing: "rising", s: "rises" },
    grow: { base: "grow", past: "grew", part: "grown", ing: "growing", s: "grows" },
    see: { base: "see", past: "saw", part: "seen", ing: "seeing", s: "sees" },
    speak: { base: "speak", past: "spoke", part: "spoken", ing: "speaking", s: "speaks" },
    stand: { base: "stand", past: "stood", part: "stood", ing: "standing", s: "stands" },
    spend: { base: "spend", past: "spent", part: "spent", ing: "spending", s: "spends" },
    write: { base: "write", past: "wrote", part: "written", ing: "writing", s: "writes" },
    apologise: { base: "apologise", past: "apologized", part: "apologized", ing: "apologizing", s: "apologizes" },
    criticise: { base: "criticise", past: "criticized", part: "criticized", ing: "criticizing", s: "criticizes" }
  },

  conjugateVerb(baseVerb) {
    const b = (baseVerb || "").toLowerCase().trim();
    if (this.IRREGULARS[b]) return this.IRREGULARS[b];
    const res = { base: b };
    if (b.endsWith("e")) {
      res.past = b + "d";
      res.part = b + "d";
      res.s = b + "s";
      res.ing = b.slice(0, -1) + "ing";
    } else if (b.endsWith("y") && b.length > 2 && !"aeiou".includes(b[b.length - 2])) {
      res.past = b.slice(0, -1) + "ied";
      res.part = b.slice(0, -1) + "ied";
      res.s = b.slice(0, -1) + "ies";
      res.ing = b + "ing";
    } else if (b.endsWith("sh") || b.endsWith("ch") || b.endsWith("ss") || b.endsWith("x") || b.endsWith("o")) {
      res.past = b + "ed";
      res.part = b + "ed";
      res.s = b + "es";
      res.ing = b + "ing";
    } else {
      const doubleC = b.length >= 3 && !"aeiouywer".includes(b[b.length - 1]) && "aeiou".includes(b[b.length - 2]) && !"aeiou".includes(b[b.length - 3]);
      const c = doubleC ? b[b.length - 1] : "";
      res.past = b + c + "ed";
      res.part = b + c + "ed";
      res.s = b + "s";
      res.ing = b + c + "ing";
    }
    return res;
  },

  inflectVerbToTense(baseVerb, tense) {
    const forms = this.conjugateVerb(baseVerb);
    return forms[tense] || forms.base || baseVerb;
  },

  getDataset() {
    return (window.COLLOCATIONS && window.COLLOCATIONS.length) ? window.COLLOCATIONS : [];
  },

  getCategories() {
    return [
      { id: "all", name: "All 4 Patterns (Mixed)", icon: "✨", count: this.getDataset().length },
      { id: "Verb + Noun", name: "Verb + Noun", icon: "⚔️", count: this.getDataset().filter(d => d.cat === "Verb + Noun").length },
      { id: "Verb + Preposition", name: "Verb + Preposition", icon: "🎯", count: this.getDataset().filter(d => d.cat === "Verb + Preposition").length },
      { id: "Noun + Preposition", name: "Noun + Preposition", icon: "🏛️", count: this.getDataset().filter(d => d.cat === "Noun + Preposition").length },
      { id: "Adjective + Preposition", name: "Adjective + Preposition", icon: "💎", count: this.getDataset().filter(d => d.cat === "Adjective + Preposition").length }
    ];
  },

  /* ---------------------------------------------------------
     QUESTION GENERATION ENGINE (BIDIRECTIONAL)
     --------------------------------------------------------- */
  seededRandom(seedStr) {
    let h = 1779033703 ^ seedStr.length;
    for (let i = 0; i < seedStr.length; i++) {
      h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return () => {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
  },

  buildQuestionQueue(count = 50, seed = null) {
    const data = this.getDataset();
    let pool = this.selectedCategory === "all" ? [...data] : data.filter(d => d.cat === this.selectedCategory);
    if (!pool.length) pool = [...data];

    const rng = seed ? this.seededRandom(seed) : Math.random;

    // Shuffle pool
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const queue = [];
    for (let i = 0; i < count; i++) {
      const item = shuffled[i % shuffled.length];
      // Alternate direction: forward (Head -> Partner) vs reverse (Partner -> Head)
      const isForward = rng() > 0.5;
      queue.push(this.createQuestion(item, isForward, pool, rng));
    }
    return queue;
  },

  createQuestion(item, isForward, pool, rng) {
    const sent = item.sentence || "";
    const ht = item.head_token || {};
    const pt = item.partner_token || {};

    // isForward: test Partner (Preposition / Noun)
    // !isForward: test Head (Verb / Adjective / Noun)
    let testTarget = isForward ? "partner" : "head";
    let token = isForward ? pt : ht;
    let targetType = token.type || (isForward ? (item.cat === "Verb + Noun" ? "noun" : "preposition") : ("Verb" in item.cat ? "verb" : "head"));

    let correctVal = token.word || (isForward ? (item.prep || item.partner) : item.head);
    let correctBase = token.base || correctVal;

    // Blank out the sentence with ****
    let sentenceWithBlank = sent;
    if (token.start !== undefined && token.end !== undefined) {
      sentenceWithBlank = sent.slice(0, token.start) + "****" + sent.slice(token.end);
    } else {
      sentenceWithBlank = sent.replace(new RegExp(`\\b${this.escapeRegex(correctVal)}\\b`, "i"), "****");
    }

    // Build 3 distractors consistent in type, category, and grammatical tense
    const distractors = new Set();
    const maxAttempts = 60;
    let attempts = 0;

    if (targetType === "preposition") {
      // Pick other prepositions
      const prepPool = this.PREPOSITIONS.filter(p => p.toLowerCase() !== correctVal.toLowerCase());
      while (distractors.size < 3 && attempts++ < maxAttempts) {
        const cand = prepPool[Math.floor(rng() * prepPool.length)];
        if (cand && cand.toLowerCase() !== correctVal.toLowerCase()) {
          distractors.add(cand);
        }
      }
    } else if (targetType === "verb") {
      // Must match EXACT same tense as correctVal in context sentence
      const targetTense = ht.tense || "base";
      // Pick other verbs from the pool
      const verbPool = [];
      pool.forEach(p => {
        if (p.head_token && p.head_token.type === "verb" && p.head_token.base.toLowerCase() !== correctBase.toLowerCase()) {
          verbPool.push(p.head_token.base);
        }
      });

      const uniqueBases = Array.from(new Set(verbPool));
      while (distractors.size < 3 && attempts++ < maxAttempts) {
        const b = uniqueBases[Math.floor(rng() * uniqueBases.length)];
        if (b) {
          const inflected = this.inflectVerbToTense(b, targetTense);
          if (inflected && inflected.toLowerCase() !== correctVal.toLowerCase()) {
            distractors.add(inflected);
          }
        }
      }
    } else if (targetType === "adjective") {
      const adjPool = [];
      pool.forEach(p => {
        if (p.head_token && p.head_token.type === "adjective" && p.head_token.word.toLowerCase() !== correctVal.toLowerCase()) {
          adjPool.push(p.head_token.word);
        }
      });
      const uniqueAdjs = Array.from(new Set(adjPool));
      while (distractors.size < 3 && attempts++ < maxAttempts) {
        const a = uniqueAdjs[Math.floor(rng() * uniqueAdjs.length)];
        if (a && a.toLowerCase() !== correctVal.toLowerCase()) {
          distractors.add(a);
        }
      }
    } else {
      // Noun target
      const nounPool = [];
      pool.forEach(p => {
        const candTok = isForward ? p.partner_token : p.head_token;
        if (candTok && candTok.word && candTok.word.toLowerCase() !== correctVal.toLowerCase()) {
          nounPool.push(candTok.word);
        }
      });
      const uniqueNouns = Array.from(new Set(nounPool));
      while (distractors.size < 3 && attempts++ < maxAttempts) {
        const n = uniqueNouns[Math.floor(rng() * uniqueNouns.length)];
        if (n && n.toLowerCase() !== correctVal.toLowerCase()) {
          distractors.add(n);
        }
      }
    }

    // Safety fallback
    while (distractors.size < 3) {
      const fb = pool[Math.floor(rng() * pool.length)];
      const cand = isForward ? (fb.partner_token?.word || fb.partner) : (fb.head_token?.word || fb.head);
      if (cand && cand.toLowerCase() !== correctVal.toLowerCase()) {
        distractors.add(cand);
      }
    }

    const options = [correctVal, ...Array.from(distractors).slice(0, 3)];
    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    const promptTitle = isForward ? `${item.phrase.split(" ")[0]} ...` : `... ${item.phrase.split(" ").slice(-1)[0]}`;

    return {
      item,
      isForward,
      targetType,
      directionText: `Fill in the missing ${targetType.toUpperCase()}`,
      sentenceWithBlank,
      correctVal,
      options
    };
  },

  blankSentence(sentence, phrase, head, partner) {
    if (!sentence) return "";
    let s = sentence;
    const rePhrase = new RegExp(`\\b${this.escapeRegex(phrase)}\\b`, "i");
    if (rePhrase.test(s)) return s.replace(rePhrase, "___");

    const reHead = new RegExp(`\\b${this.escapeRegex(head)}\\b`, "i");
    if (reHead.test(s)) return s.replace(reHead, "___");
    return s;
  },

  escapeRegex(str) {
    return (str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  },

  /* ---------------------------------------------------------
     LOBBY & MODE SELECTION
     --------------------------------------------------------- */
  intro() {
    this.playMode = "solo";
    this.selectedCategory = "all";
    this.seed = null;
    this.ghost = null;
    this.duel = null;
    this.arena = null;

    showScreen("alchemy");
    const el = $("#screen-alchemy");
    if (!el) return;

    const best = (Store.d.lb && Store.d.lb.alchemy) ? Math.max(...Store.d.lb.alchemy.map(x => x.s), 0) : 0;
    const isTeacher = AlchemyNet.isTeacher();
    const categories = this.getCategories();

    el.innerHTML = `
      <div class="alchemy-lobby">
        <div class="alchemy-lobby-head">
          <button class="back-btn" id="btn-alch-back">← Great Hall</button>
          <div class="alch-brand">
            <span class="alch-icon-big">⚗️</span>
            <h1>Collocation Alchemy</h1>
            <p>Master bidirectional academic bonds across Verb + Noun, Verb + Prep, Noun + Prep &amp; Adjective + Prep!</p>
          </div>
          <div class="alch-best-pill">🏆 Personal Best: <b>${fmt(best)}</b></div>
        </div>

        <!-- 3 GAME MODES CAROUSEL / GRID -->
        <div class="rush-mode-grid three">
          <div class="rush-mode-card active" data-mode="solo">
            <div class="rush-mode-badge">⚡ SOLO RUN</div>
            <div class="rmc-icon">🧙</div>
            <h3>Solo Alchemy</h3>
            <p>Fast-paced 60-second cauldron blitz. Build combos, brew golden elixirs &amp; earn House XP!</p>
          </div>

          <div class="rush-mode-card" data-mode="duel">
            <div class="rush-mode-badge duel">⚔️ 1v1 CHALLENGE</div>
            <div class="rmc-icon">⚔️</div>
            <h3>Wizards' Duel</h3>
            <p>Generate a 6-character duel code or challenge link. Compete on the exact same question sequence!</p>
          </div>

          <div class="rush-mode-card ${isTeacher ? "" : "locked"}" data-mode="class">
            <div class="rush-mode-badge class">🏰 TEACHER WHITEBOARD</div>
            <div class="rmc-icon">🏰</div>
            <h3>Class Arena</h3>
            <p>${isTeacher ? "Host a live match with QR code on screen. Live student roster, Top 3 podium &amp; House Cup!" : "Teacher Mode. Host live group matches on your classroom whiteboard via QR code."}</p>
          </div>
        </div>

        <!-- CATEGORY SELECTOR -->
        <div class="alch-cat-box card" id="alch-cat-panel">
          <div class="alch-panel-head">
            <h3>🧪 Select Collocation Pattern</h3>
            <span class="muted">250 Total Academic Collocations Available</span>
          </div>
          <div class="alch-cat-grid">
            ${categories.map(c => `
              <button class="alch-cat-btn ${c.id === this.selectedCategory ? "active" : ""}" data-cat="${c.id}">
                <span class="ac-icon">${c.icon}</span>
                <div class="ac-info">
                  <b>${c.name}</b>
                  <small>${c.count} collocations</small>
                </div>
              </button>
            `).join("")}
          </div>
        </div>

        <!-- MODE ACTIONS CONTAINER -->
        <div class="alch-action-stage" id="alch-action-stage">
          <div style="text-align:center;margin-top:20px">
            <button class="btn primary big-cta" id="btn-alch-start">⚡ Begin 60s Solo Run</button>
          </div>
        </div>
      </div>
    `;

    $("#btn-alch-back").onclick = () => showScreen("home");

    // Mode switching
    $$(".rush-mode-card").forEach(card => {
      card.onclick = () => {
        Sfx.click();
        $$(".rush-mode-card").forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        this.playMode = card.dataset.mode;
        this.renderModeActionStage();
      };
    });

    // Category selection
    $$(".alch-cat-btn").forEach(btn => {
      btn.onclick = () => {
        Sfx.click();
        $$(".alch-cat-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.selectedCategory = btn.dataset.cat;
      };
    });

    $("#btn-alch-start").onclick = () => this.startSolo();
  },

  renderModeActionStage() {
    const stage = $("#alch-action-stage");
    const catPanel = $("#alch-cat-panel");
    if (!stage) return;

    if (this.playMode === "solo") {
      catPanel.style.display = "block";
      stage.innerHTML = `
        <div style="text-align:center;margin-top:20px">
          <button class="btn primary big-cta" id="btn-alch-start">⚡ Begin 60s Solo Run</button>
        </div>
      `;
      $("#btn-alch-start").onclick = () => this.startSolo();
    } else if (this.playMode === "duel") {
      catPanel.style.display = "block";
      stage.innerHTML = `
        <div class="card duel-panel" style="max-width:580px;margin:20px auto">
          <div class="duel-option">
            <h3>⚔️ Host or Join a 1v1 Alchemy Duel</h3>
            <p class="muted">Both wizards compete on the identical sequence of bidirectional collocations.</p>
            <div style="margin:16px 0;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
              <button class="btn primary" id="btn-alch-create-duel">⚔️ Generate Duel Link &amp; Code</button>
            </div>
            <div class="duel-divider"><span>or enter 6-character code</span></div>
            <div class="duel-join-row">
              <input type="text" id="alch-duel-code-input" maxlength="6" placeholder="e.g. 7X9K2M" autocomplete="off" style="text-transform:uppercase" />
              <button class="btn secondary" id="btn-alch-join-duel">Enter Duel Chamber →</button>
            </div>
          </div>
        </div>
      `;
      $("#btn-alch-create-duel").onclick = () => this.createDuel();
      $("#btn-alch-join-duel").onclick = () => this.joinDuelByInput();
    } else if (this.playMode === "class") {
      catPanel.style.display = "block";
      const isTeacher = AlchemyNet.isTeacher();
      if (!isTeacher) {
        stage.innerHTML = `
          <div class="card" style="max-width:560px;margin:20px auto;text-align:center">
            <h3>🔒 Teacher Authentication Required</h3>
            <p class="muted">Class Arena generates a classroom whiteboard QR code for live student matches. Please sign in with an authorized staff account or enter the teacher passkey.</p>
            <button class="btn primary" id="btn-alch-teacher-auth" style="margin-top:12px">🔑 Teacher Unlock</button>
          </div>
        `;
        $("#btn-alch-teacher-auth").onclick = () => this.promptTeacherAuth();
      } else {
        stage.innerHTML = `
          <div class="card" style="max-width:580px;margin:20px auto;text-align:center">
            <h3>🏰 Host Class Arena Match</h3>
            <p class="muted">Projects a big-screen Whiteboard with a live QR Code. Students scan to join from their mobile devices!</p>
            <button class="btn primary big-cta" id="btn-alch-host-arena" style="margin-top:16px">🏰 Launch Whiteboard Room</button>
          </div>
        `;
        $("#btn-alch-host-arena").onclick = () => this.createArenaRoom();
      }
    }
  },

  promptTeacherAuth() {
    const key = prompt("Enter Teacher / Staff Passkey:");
    if (key && (key.trim().toLowerCase() === "hpccss" || key.trim() === "teacher")) {
      localStorage.setItem("lexiquest.teacher_unlock", "1");
      toast("✅ Teacher privileges unlocked!");
      this.intro();
    } else if (key) {
      toast("❌ Invalid passkey.");
    }
  },

  /* ---------------------------------------------------------
     WIZARDS' DUEL CHAMBER (1v1)
     --------------------------------------------------------- */
  async createDuel() {
    const me = AlchemyNet.me();
    const seed = AlchemyNet.newSeed();
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let room = "";
    for (let i = 0; i < 6; i++) room += alphabet.charAt(Math.floor(Math.random() * alphabet.length));

    toast("⏳ Creating Wizards' Duel Chamber...");
    try {
      await AlchemyNet.call("arena_create", { room, seed, cat: this.selectedCategory, name: me.name, role: "staff" });
      await AlchemyNet.call("arena_join", { room, pid: me.pid, name: me.name, house: me.house, score: 0, correct: 0, done: "0" });
      this.duel = { room, seed, cat: this.selectedCategory, hostPid: me.pid, iAmHost: true };
      this.renderDuelLobby();
    } catch (e) {
      toast("❌ Failed to create duel: " + e.message);
    }
  },

  async joinDuelByInput() {
    const code = ($("#alch-duel-code-input")?.value || "").trim().toUpperCase();
    if (!code || code.length < 4) { toast("Please enter a valid duel code."); return; }
    this.handleDuelUrl(code);
  },

  async handleDuelUrl(codeOrRoom) {
    showScreen("alchemy");
    toast("⏳ Entering Duel Chamber...");
    const me = AlchemyNet.me();
    const room = codeOrRoom.toUpperCase();
    try {
      const res = await AlchemyNet.call("arena_state", { room });
      const snap = res.arena;
      await AlchemyNet.call("arena_join", { room, pid: me.pid, name: me.name, house: me.house, score: 0, correct: 0, done: "0" });
      this.duel = { room, seed: snap.seed, cat: snap.cat, hostPid: snap.players[0]?.pid, iAmHost: false };
      this.renderDuelLobby();
    } catch (e) {
      toast("❌ Could not connect to duel room: " + e.message);
      this.intro();
    }
  },

  renderDuelLobby() {
    const d = this.duel;
    if (!d) return;
    const el = $("#screen-alchemy");
    const link = `${AlchemyNet.baseUrl()}?alchduel=${d.room}`;
    const me = AlchemyNet.me();

    el.innerHTML = `
      <div class="duel-share-card card">
        <button class="back-btn" id="btn-alch-duel-back" style="align-self:flex-start">← Back to Modes</button>
        <div style="font-size:3rem;margin:8px 0 2px">⚔️</div>
        <h2>Wizards' Duel Chamber</h2>
        <p class="muted">Share the 6-character code or duel link with your rival.</p>

        <div class="duel-code-big" id="alch-duel-code-display">${d.room}</div>

        <div class="duel-vs-stage" id="alch-dlob-vs">
          <div class="duel-fighter-card ready" style="--hc:${HOUSE_COLORS[me.house] || "#38bdf8"}">
            <span class="dfc-tag">YOU</span>
            <div class="dfc-name">${esc(me.name)}</div>
            <span class="dfc-house">${me.house || "ROGUE"}</span>
            <span class="dfc-status">Ready</span>
          </div>
          <div class="duel-vs-badge">VS</div>
          <div class="duel-fighter-card waiting" id="alch-dfc-rival">
            <span class="dfc-tag">RIVAL</span>
            <div class="dfc-name" id="alch-rival-name">Waiting...</div>
            <span class="dfc-house" id="alch-rival-house">—</span>
            <span class="dfc-status" id="alch-rival-status">Waiting for link</span>
          </div>
        </div>

        <div class="duel-link-box" style="margin:14px 0">
          <input type="text" readonly value="${link}" id="alch-duel-link-input" />
        </div>

        <div class="duel-share-actions">
          <button class="btn primary" id="alch-btn-copy-link">📋 Copy Challenge Link</button>
          <a class="btn wa" href="https://api.whatsapp.com/send?text=${encodeURIComponent('⚔️ I challenge you to an Academic Collocation Duel on LexiQuest! Code: ' + d.room + '\n' + link)}" target="_blank" rel="noopener">💬 WhatsApp</a>
          <button class="btn secondary" id="alch-btn-start-now">⚡ Start Duel Now</button>
        </div>
      </div>
    `;

    $("#btn-alch-duel-back").onclick = () => {
      if (this.duelPollTimer) clearInterval(this.duelPollTimer);
      this.intro();
    };
    $("#alch-btn-copy-link").onclick = () => AlchemyNet.copy(link);
    $("#alch-btn-start-now").onclick = () => this.startDuelRun();

    // Poll chamber for rival join
    if (this.duelPollTimer) clearInterval(this.duelPollTimer);
    this.duelPollTimer = setInterval(async () => {
      try {
        const res = await AlchemyNet.call("arena_state", { room: d.room });
        const snap = res.arena;
        if (!snap || !snap.players) return;
        const rival = snap.players.find(p => p.pid !== me.pid);
        if (rival) {
          const rName = $("#alch-rival-name"), rHouse = $("#alch-rival-house"), rStatus = $("#alch-rival-status"), rCard = $("#alch-dfc-rival");
          if (rName) rName.textContent = rival.n;
          if (rHouse) { rHouse.textContent = rival.h || "ROGUE"; rHouse.style.color = HOUSE_COLORS[rival.h] || "#cbd5e1"; }
          if (rStatus) rStatus.textContent = rival.d ? "Finished" : (rival.s > 0 ? `Racing (${rival.s} pts)` : "Connected");
          if (rCard) { rCard.classList.remove("waiting"); rCard.classList.add("ready"); rCard.style.setProperty("--hc", HOUSE_COLORS[rival.h] || "#fda4af"); }
        }
      } catch {}
    }, 2500);
  },

  startDuelRun() {
    if (this.duelPollTimer) clearInterval(this.duelPollTimer);
    this.playMode = "duel";
    this.seed = this.duel.seed;
    this.selectedCategory = this.duel.cat || "all";
    this.start();
  },

  /* ---------------------------------------------------------
     CLASS ARENA (TEACHER WHITEBOARD & STUDENT JOIN)
     --------------------------------------------------------- */
  async createArenaRoom() {
    const me = AlchemyNet.me();
    const seed = AlchemyNet.newSeed();
    const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let room = "";
    for (let i = 0; i < 4; i++) room += alphabet.charAt(Math.floor(Math.random() * alphabet.length));

    toast("⏳ Launching Whiteboard Room...");
    try {
      await AlchemyNet.call("arena_create", { room, seed, cat: this.selectedCategory, name: me.name, role: "staff" });
      this.arena = { room, seed, cat: this.selectedCategory, host: true };
      this.renderTeacherWhiteboard();
    } catch (e) {
      toast("❌ Failed to create room: " + e.message);
    }
  },

  async handleArenaUrl(roomCode) {
    showScreen("alchemy");
    toast("⏳ Joining Class Arena...");
    const me = AlchemyNet.me();
    const room = roomCode.toUpperCase();
    try {
      const res = await AlchemyNet.call("arena_state", { room });
      const snap = res.arena;
      await AlchemyNet.call("arena_join", { room, pid: me.pid, name: me.name, house: me.house, score: 0, correct: 0, done: "0" });
      this.arena = { room, seed: snap.seed, cat: snap.cat, host: false };
      this.renderStudentLobby(snap);
    } catch (e) {
      toast("❌ Could not connect to arena: " + e.message);
      this.intro();
    }
  },

  renderTeacherWhiteboard() {
    const a = this.arena;
    if (!a) return;
    const el = $("#screen-alchemy");
    const link = `${AlchemyNet.baseUrl()}?alchclass=${a.room}`;

    el.innerHTML = `
      <div class="class-arena-host">
        <div class="cah-top">
          <button class="back-btn" id="btn-cah-close">← Exit Whiteboard</button>
          <div class="cah-title">⚗️ Collocation Alchemy · Class Arena</div>
          <div class="cah-status" id="cah-status-pill">WAITING IN LOBBY</div>
        </div>

        <div class="cah-body">
          <div class="cah-join">
            <div class="arena-code-banner">
              <span>Room PIN</span>
              <b>${a.room}</b>
            </div>
            <div class="arena-qr-box" id="cah-qr-box"></div>
            <div class="cah-hint muted">Scan with phone camera or visit: <b>${link}</b></div>
          </div>

          <div class="cah-board">
            <div class="cah-board-head">
              <h2>Student Roster (<span id="cah-count">0</span> Joined)</h2>
              <div class="cah-controls">
                <button class="btn primary" id="btn-cah-start">⚡ Launch Class Battle</button>
                <button class="btn small secondary" id="btn-cah-reset">🔄 Reset</button>
              </div>
            </div>

            <div class="arena-top3-section" id="cah-top3-box" style="display:none">
              <h3 style="margin:0 0 8px;font-size:1.05rem;color:#fde68a">👑 Top 3 Wizards (Highest Scores)</h3>
              <div class="arena-podium" id="cah-podium"></div>
            </div>

            <div class="arena-roster" id="cah-roster">
              <div class="arena-empty muted">Waiting for students to scan the QR code...</div>
            </div>

            <div class="card" id="cah-house-card" style="margin-top:14px">
              <h3 style="font-size:1rem;margin-bottom:8px">🏆 Four Houses Mark Comparison</h3>
              <div class="arena-house-cup" id="cah-house-cup"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Render QR Code
    if (typeof QrCode !== "undefined") {
      QrCode.render($("#cah-qr-box"), link, 220);
    }

    $("#btn-cah-close").onclick = () => {
      if (this.arenaPollTimer) clearInterval(this.arenaPollTimer);
      this.intro();
    };
    $("#btn-cah-start").onclick = async () => {
      try {
        await AlchemyNet.call("arena_start", { room: a.room, role: "staff" });
        toast("🚀 Battle started!");
      } catch (e) { toast("Error: " + e.message); }
    };
    $("#btn-cah-reset").onclick = async () => {
      try {
        await AlchemyNet.call("arena_reset", { room: a.room, role: "staff", seed: AlchemyNet.newSeed() });
        toast("🔄 Room reset!");
      } catch (e) { toast("Error: " + e.message); }
    };

    // Poll teacher whiteboard state
    if (this.arenaPollTimer) clearInterval(this.arenaPollTimer);
    this.arenaPollTimer = setInterval(async () => {
      try {
        const res = await AlchemyNet.call("arena_state", { room: a.room });
        this.updateTeacherBoardUI(res.arena);
      } catch {}
    }, 2000);
  },

  updateTeacherBoardUI(snap) {
    if (!snap) return;
    const countEl = $("#cah-count");
    if (countEl) countEl.textContent = snap.players.length;

    const statusEl = $("#cah-status-pill");
    if (statusEl) {
      statusEl.textContent = snap.status === "live" ? "🔥 BATTLE IN PROGRESS" : (snap.status === "ended" ? "🏆 MATCH COMPLETED" : "WAITING IN LOBBY");
      statusEl.className = "cah-status " + snap.status;
    }

    const rosterEl = $("#cah-roster");
    if (rosterEl) {
      if (!snap.players.length) {
        rosterEl.innerHTML = `<div class="arena-empty muted">Waiting for students to scan the QR code...</div>`;
      } else {
        rosterEl.innerHTML = snap.players.map(p => `
          <div class="arena-chip" style="--hc:${HOUSE_COLORS[p.h] || "#38bdf8"}">
            <b>${esc(p.n)}</b> <small>(${p.h || "ROGUE"})</small> · <b>${fmt(p.s)} pts</b> ${p.d ? "✓" : ""}
          </div>
        `).join("");
      }
    }

    // Top 3 Podium
    const top3Box = $("#cah-top3-box");
    const podiumEl = $("#cah-podium");
    if (top3Box && podiumEl) {
      if (snap.players.length >= 2 || snap.status === "ended" || snap.players.some(p => p.s > 0)) {
        top3Box.style.display = "block";
        podiumEl.innerHTML = this.buildPodiumHtml(snap.players);
      } else {
        top3Box.style.display = "none";
      }
    }

    // Four Houses Bar Comparison
    const houseEl = $("#cah-house-cup");
    if (houseEl) {
      const houseScores = { TAK: 0, CHI: 0, KIN: 0, KAN: 0 };
      snap.players.forEach(p => {
        if (houseScores[p.h] !== undefined) houseScores[p.h] += (p.s || 0);
      });
      const maxH = Math.max(...Object.values(houseScores), 100);
      houseEl.innerHTML = Object.keys(houseScores).map(h => {
        const sc = houseScores[h];
        const pct = Math.min(100, Math.round((sc / maxH) * 100));
        return `
          <div class="ahc-row" style="--hc:${HOUSE_COLORS[h]}">
            <span>${h}</span>
            <div class="ahc-bar"><i style="width:${pct}%"></i></div>
            <b>${fmt(sc)} pts</b>
          </div>
        `;
      }).join("");
    }
  },

  buildPodiumHtml(players) {
    const top = [...players].sort((a, b) => (b.s || 0) - (a.s || 0)).slice(0, 3);
    const p1 = top[0], p2 = top[1], p3 = top[2];

    const col = (p, rank, cls, medal) => {
      if (!p) return `<div class="arena-podium-col empty"></div>`;
      return `
        <div class="arena-podium-col ${cls}" style="--hc:${HOUSE_COLORS[p.h] || "#fde68a"}">
          <div class="apc-medal">${medal}</div>
          <div class="apc-name">${esc(p.n)}</div>
          <div class="apc-score">${fmt(p.s)} pts</div>
          <div class="apc-meta">${p.h || "ROGUE"} · ${p.c || 0} solved</div>
          <div class="apc-block">#${rank}</div>
        </div>
      `;
    };

    return `
      ${col(p2, 2, "second", "🥈")}
      ${col(p1, 1, "first", "🥇")}
      ${col(p3, 3, "third", "🥉")}
    `;
  },

  renderStudentLobby(snap) {
    const a = this.arena;
    const el = $("#screen-alchemy");
    const me = AlchemyNet.me();

    el.innerHTML = `
      <div class="card arena-lobby-card">
        <div style="font-size:3rem;margin:12px 0 2px">🏰</div>
        <h2>Class Arena Lobby</h2>
        <p class="muted">Connected to Room <b>${a.room}</b>. Waiting for teacher to start!</p>

        <div class="duel-fighter-card ready" style="--hc:${HOUSE_COLORS[me.house] || "#38bdf8"};margin:16px auto;max-width:280px">
          <span class="dfc-tag">YOUR FIGHTER</span>
          <div class="dfc-name">${esc(me.name)}</div>
          <span class="dfc-house">${me.house || "ROGUE"}</span>
          <span class="dfc-status">Waiting for host...</span>
        </div>

        <div class="arena-lobby-count">
          Rival Wizards in Room: <b id="alch-student-count">${snap?.players?.length || 1}</b>
        </div>
        <div style="margin-top:20px">
          <button class="btn secondary" id="btn-alch-leave-arena">Leave Arena</button>
        </div>
      </div>
    `;

    $("#btn-alch-leave-arena").onclick = () => {
      if (this.arenaPollTimer) clearInterval(this.arenaPollTimer);
      this.intro();
    };

    if (this.arenaPollTimer) clearInterval(this.arenaPollTimer);
    this.arenaPollTimer = setInterval(async () => {
      try {
        const res = await AlchemyNet.call("arena_state", { room: a.room });
        const curSnap = res.arena;
        if (!curSnap) return;
        const countEl = $("#alch-student-count");
        if (countEl) countEl.textContent = curSnap.players.length;

        if (curSnap.status === "live") {
          clearInterval(this.arenaPollTimer);
          toast("🚀 Teacher launched the battle!");
          this.playMode = "class";
          this.seed = curSnap.seed;
          this.selectedCategory = curSnap.cat || "all";
          this.start();
        }
      } catch {}
    }, 2000);
  },

  /* ---------------------------------------------------------
     GAMEPLAY LOOP & CAULDRON ENGINE
     --------------------------------------------------------- */
  startSolo() {
    this.playMode = "solo";
    this.seed = null;
    this.start();
  },

  start() {
    this.active = true;
    this.timer = this.START;
    this.score = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.solvedCount = 0;
    this.scoreTimeline = [];
    this.questionQueue = this.buildQuestionQueue(80, this.seed);
    this.questionIndex = 0;
    this.contextShown = false;

    showScreen("alchemy");
    this.renderGameLayout();
    this.nextQuestion();

    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => this.tick(), 1000);
  },

  renderGameLayout() {
    const el = $("#screen-alchemy");
    const me = AlchemyNet.me();
    const modeLabel = this.playMode === "solo" ? "🧙 Solo Alchemy" : (this.playMode === "duel" ? `⚔️ Duel ${this.duel?.room || ""}` : `🏰 Class Arena ${this.arena?.room || ""}`);

    el.innerHTML = `
      <div class="alch-game-wrapper">
        <!-- HUD BAR -->
        <div class="alch-hud">
          <div class="alch-hud-left">
            <span class="alch-mode-pill">${modeLabel}</span>
            <div class="alch-score-box">
              <span class="muted">SCORE</span>
              <b id="alch-score">0</b>
            </div>
            <div class="alch-combo-box" id="alch-combo-pill">
              🔥 <span id="alch-streak">0</span>x Combo
            </div>
          </div>
          <div class="alch-hud-right">
            <div class="alch-timer-box" id="alch-timer-box">
              ⏳ <b id="alch-timer">60</b>s
            </div>
          </div>
        </div>

        <!-- DUEL LIVE PACING (IF DUEL MODE) -->
        <div id="alch-duel-hud" style="display:${this.playMode === 'duel' ? 'grid' : 'none'}" class="duel-live-hud">
          <div class="duel-player-tag me" style="--hc:${HOUSE_COLORS[me.house] || "#38bdf8"}">
            <span class="dp-name">${esc(me.name)} (You)</span>
            <b id="alch-duel-my-score">0</b>
          </div>
          <div class="duel-vs">
            <span id="alch-duel-vs-text">Tied</span>
            <div class="duel-tug"><i id="alch-duel-tug-bar" style="width:50%"></i></div>
          </div>
          <div class="duel-player-tag opp" id="alch-duel-opp-tag">
            <span class="dp-name" id="alch-duel-opp-name">Rival</span>
            <b id="alch-duel-opp-score">0</b>
          </div>
        </div>

        <!-- CAULDRON MAIN STAGE -->
        <div class="alch-cauldron-stage">
          <div class="alch-prompt-card card">
            <div class="alch-prompt-head">
              <span class="alch-cat-badge" id="alch-q-cat">Verb + Noun</span>
              <span class="alch-dir-badge" id="alch-q-dir">Complete the Sentence</span>
            </div>

            <!-- Contextualized Sentence with **** Slot -->
            <div class="alch-sentence-stage">
              <div class="alch-context-sentence-main" id="alch-sentence-display">
                <!-- Dynamically filled with sentence containing **** -->
              </div>
              <div class="alch-meaning-text" id="alch-q-meaning">接受決定</div>
            </div>
          </div>

          <!-- 4 FLOATING REAGENT VIAL OPTIONS -->
          <div class="alch-options-grid" id="alch-options"></div>
        </div>
      </div>
    `;

    $("#btn-alch-toggle-clue").onclick = () => {
      const box = $("#alch-context-box");
      if (!box) return;
      this.contextShown = !this.contextShown;
      box.classList.toggle("hidden", !this.contextShown);
      $("#btn-alch-toggle-clue").textContent = this.contextShown ? "📜 Hide Context Sentence" : "📜 Show Academic Context Sentence";
    };
  },

  nextQuestion() {
    if (this.questionIndex >= this.questionQueue.length) {
      this.questionQueue.push(...this.buildQuestionQueue(50, this.seed ? `${this.seed}_${this.questionIndex}` : null));
    }
    const q = this.questionQueue[this.questionIndex++];
    this.currentQ = q;

    $("#alch-q-cat").textContent = q.item.cat;
    $("#alch-q-dir").textContent = q.directionText;
    $("#alch-q-meaning").textContent = q.item.meaning_chin ? `${q.item.meaning_chin} (${q.item.meaning_eng})` : q.item.meaning_eng;

    // Render sentence with glowing **** badge
    const sentDisplay = $("#alch-sentence-display");
    if (sentDisplay) {
      const parts = q.sentenceWithBlank.split("****");
      sentDisplay.innerHTML = `
        ${esc(parts[0])}<span class="alch-blank-pill" id="alch-live-blank">****</span>${esc(parts[1] || "")}
      `;
    }

    const optsContainer = $("#alch-options");
    if (!optsContainer) return;

    optsContainer.innerHTML = q.options.map((opt, idx) => `
      <button class="alch-vial-btn" data-val="${esc(opt)}">
        <span class="avb-flask">⚗️</span>
        <span class="avb-text">${esc(opt)}</span>
      </button>
    `).join("");

    $$(".alch-vial-btn").forEach(btn => {
      btn.onclick = () => this.handleAnswer(btn.dataset.val, btn);
    });
  },

  handleAnswer(selectedVal, btnEl) {
    if (!this.active || !this.currentQ) return;
    const q = this.currentQ;
    const isCorrect = (selectedVal.trim().toLowerCase() === q.correctVal.trim().toLowerCase());

    const blankEl = $("#alch-live-blank");

    if (isCorrect) {
      Sfx.correct();
      this.streak++;
      if (this.streak > this.maxStreak) this.maxStreak = this.streak;
      this.solvedCount++;

      // Multiplier: 1x -> 2x (at 3 streak) -> 3x (at 5+ streak)
      const mult = this.streak >= 5 ? 3 : (this.streak >= 3 ? 2 : 1);
      const points = 100 * mult;
      this.score += points;
      this.timer += this.BASE_ADD;

      btnEl.classList.add("correct");
      if (blankEl) {
        blankEl.textContent = q.correctVal;
        blankEl.classList.add("filled");
      }

      toast(`⚡ +${points} pts! (${mult}x Multiplier)`);
    } else {
      Sfx.wrong();
      this.streak = 0;
      this.timer = Math.max(0, this.timer - 2);
      btnEl.classList.add("wrong");
      if (blankEl) {
        blankEl.textContent = q.correctVal;
        blankEl.classList.add("revealed");
      }
      toast(`❌ Unstable bond! Correct: "${q.correctVal}"`);
    }

    this.updateHUD();

    // Pacing in duel/class
    if (this.playMode === "duel" && this.duel) {
      AlchemyNet.call("arena_update", {
        room: this.duel.room,
        pid: AlchemyNet.me().pid,
        score: this.score,
        correct: this.solvedCount,
        done: "0",
        timeline: this.scoreTimeline
      }).catch(() => {});
    } else if (this.playMode === "class" && this.arena) {
      AlchemyNet.call("arena_update", {
        room: this.arena.room,
        pid: AlchemyNet.me().pid,
        score: this.score,
        correct: this.solvedCount,
        done: "0"
      }).catch(() => {});
    }

    setTimeout(() => {
      if (this.active) {
        this.nextQuestion();
      }
    }, isCorrect ? 400 : 800);
  },

  tick() {
    if (!this.active) return;
    this.timer--;
    this.scoreTimeline.push({ sec: this.START - this.timer, sc: this.score });

    const timerBox = $("#alch-timer");
    if (timerBox) {
      timerBox.textContent = this.timer;
      if (this.timer <= 10) timerBox.parentElement.classList.add("urgent");
    }

    if (this.playMode === "duel") {
      this.updateDuelPacing();
    }

    if (this.timer <= 0) {
      this.finish();
    }
  },

  updateHUD() {
    const sc = $("#alch-score");
    if (sc) sc.textContent = fmt(this.score);
    const str = $("#alch-streak");
    if (str) str.textContent = this.streak;
  },

  async updateDuelPacing() {
    if (!this.duel) return;
    try {
      const res = await AlchemyNet.call("arena_state", { room: this.duel.room });
      const snap = res.arena;
      if (!snap || !snap.players) return;
      const me = AlchemyNet.me();
      const opp = snap.players.find(p => p.pid !== me.pid);
      if (opp) {
        $("#alch-duel-my-score").textContent = fmt(this.score);
        $("#alch-duel-opp-score").textContent = fmt(opp.s || 0);
        $("#alch-duel-opp-name").textContent = opp.n;

        const total = Math.max(1, this.score + (opp.s || 0));
        const pct = Math.min(90, Math.max(10, Math.round((this.score / total) * 100)));
        $("#alch-duel-tug-bar").style.width = pct + "%";

        const diff = this.score - (opp.s || 0);
        const vsText = $("#alch-duel-vs-text");
        if (vsText) {
          if (diff > 0) { vsText.textContent = `+${diff} Lead`; vsText.className = "lead"; }
          else if (diff < 0) { vsText.textContent = `${diff} Behind`; vsText.className = "behind"; }
          else { vsText.textContent = "Tied"; vsText.className = ""; }
        }
      }
    } catch {}
  },

  async finish() {
    this.active = false;
    if (this.timerId) clearInterval(this.timerId);

    // Record score in local leaderboard
    Store.addScore("alchemy", this.score);
    const me = AlchemyNet.me();

    // Add House Points & XP
    if (Store.d.auth && me.house) {
      Store.addXP(Math.round(this.score / 5));
    }

    // Submit to cloud leaderboard
    if (typeof Leaderboard !== "undefined" && Leaderboard.submitScore) {
      Leaderboard.submitScore("alchemy", this.score);
    }

    if (this.playMode === "duel" && this.duel) {
      await AlchemyNet.call("arena_update", {
        room: this.duel.room,
        pid: me.pid,
        score: this.score,
        correct: this.solvedCount,
        done: "1",
        timeline: this.scoreTimeline
      }).catch(() => {});
      this.renderDuelResult();
    } else if (this.playMode === "class" && this.arena) {
      await AlchemyNet.call("arena_update", {
        room: this.arena.room,
        pid: me.pid,
        score: this.score,
        correct: this.solvedCount,
        done: "1"
      }).catch(() => {});
      this.renderClassStudentResult();
    } else {
      this.renderSoloResult();
    }
  },

  renderSoloResult() {
    const el = $("#screen-alchemy");
    el.innerHTML = `
      <div class="card" style="max-width:520px;margin:30px auto;text-align:center">
        <div style="font-size:3.5rem;margin-bottom:6px">⚗️</div>
        <h2>Elixir Brewing Complete!</h2>
        <p class="muted">You successfully forged academic collocations under time pressure.</p>

        <div style="display:flex;justify-content:center;gap:20px;margin:20px 0">
          <div class="stat-pill"><small>SCORE</small><b>${fmt(this.score)}</b></div>
          <div class="stat-pill"><small>SOLVED</small><b>${this.solvedCount}</b></div>
          <div class="stat-pill"><small>MAX COMBO</small><b>${this.maxStreak}x</b></div>
        </div>

        <div style="display:flex;gap:12px;justify-content:center;margin-top:20px">
          <button class="btn primary" id="btn-alch-replay">⚡ Play Again</button>
          <button class="btn secondary" id="btn-alch-modes">← Mode Select</button>
        </div>
      </div>
    `;

    $("#btn-alch-replay").onclick = () => this.startSolo();
    $("#btn-alch-modes").onclick = () => this.intro();
  },

  async renderDuelResult() {
    const el = $("#screen-alchemy");
    const me = AlchemyNet.me();
    let opp = { n: "Rival", s: 0, c: 0, h: "" };

    try {
      const res = await AlchemyNet.call("arena_state", { room: this.duel.room });
      const snap = res.arena;
      if (snap && snap.players) {
        const found = snap.players.find(p => p.pid !== me.pid);
        if (found) opp = found;
      }
    } catch {}

    const won = this.score > (opp.s || 0);
    const tied = this.score === (opp.s || 0);

    el.innerHTML = `
      <div class="card duel-result-podium ${won ? 'win' : 'lose'}" style="max-width:580px;margin:30px auto;text-align:center">
        <div class="duel-result-banner">${won ? "🏆 VICTORY!" : (tied ? "⚔️ TIED BATTLE" : "💀 DEFEAT")}</div>
        <p class="muted">Collocation Alchemy 1v1 Wizards' Duel</p>

        <div class="duel-podium-row">
          <div class="duel-podium-col">
            <div class="dpc-crown">${won ? "👑" : ""}</div>
            <div class="dpc-name">${esc(me.name)} (You)</div>
            <div class="dpc-house">${me.house || "ROGUE"}</div>
            <div class="dpc-bar" style="--hc:${HOUSE_COLORS[me.house] || "#38bdf8"}"><i style="height:${Math.min(100, Math.round((this.score / Math.max(1, this.score, opp.s)) * 100))}%"></i></div>
            <div class="dpc-score">${fmt(this.score)}</div>
            <div class="dpc-meta">${this.solvedCount} solved</div>
          </div>
          <div class="duel-podium-col">
            <div class="dpc-crown">${!won && !tied ? "👑" : ""}</div>
            <div class="dpc-name">${esc(opp.n)}</div>
            <div class="dpc-house">${opp.h || "ROGUE"}</div>
            <div class="dpc-bar" style="--hc:${HOUSE_COLORS[opp.h] || "#fda4af"}"><i style="height:${Math.min(100, Math.round(((opp.s || 0) / Math.max(1, this.score, opp.s)) * 100))}%"></i></div>
            <div class="dpc-score">${fmt(opp.s || 0)}</div>
            <div class="dpc-meta">${opp.c || 0} solved</div>
          </div>
        </div>

        <div style="display:flex;gap:12px;justify-content:center;margin-top:20px">
          <button class="btn primary" id="btn-alch-duel-rematch">⚔️ Rematch</button>
          <button class="btn secondary" id="btn-alch-duel-home">← Mode Select</button>
        </div>
      </div>
    `;

    $("#btn-alch-duel-rematch").onclick = () => this.createDuel();
    $("#btn-alch-duel-home").onclick = () => this.intro();
  },

  async renderClassStudentResult() {
    const el = $("#screen-alchemy");
    const me = AlchemyNet.me();
    let players = [];

    try {
      const res = await AlchemyNet.call("arena_state", { room: this.arena.room });
      players = (res.arena && res.arena.players) || [];
    } catch {}

    const myRankIdx = players.findIndex(p => p.pid === me.pid);
    const myRank = myRankIdx !== -1 ? myRankIdx + 1 : "—";

    el.innerHTML = `
      <div class="card arena-result-card" style="max-width:640px;margin:30px auto;text-align:center">
        <div style="font-size:3rem">🏆</div>
        <h2>Class Battle Concluded!</h2>
        <div class="arena-my-rank">Your Rank: <b>#${myRank}</b> of ${players.length} Wizards</div>

        <div class="arena-top3-section" style="margin:16px 0">
          <h3 style="margin:0 0 8px;font-size:1.05rem;color:#fde68a">👑 Top 3 Wizards (Highest Scores)</h3>
          <div class="arena-podium">${this.buildPodiumHtml(players)}</div>
        </div>

        <div style="margin-top:20px">
          <button class="btn primary" id="btn-alch-class-home">← Return to Great Hall</button>
        </div>
      </div>
    `;

    $("#btn-alch-class-home").onclick = () => this.intro();
  }
};

