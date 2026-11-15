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

const ALCH_HOUSE_COLORS = { TAK: "#e11d48", CHI: "#10b981", KIN: "#f59e0b", KAN: "#3b82f6" };

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
    try {
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
    } catch (e) {
      console.warn("[AlchemyNet] cloudPut fallback:", e);
      return { status: "local_only" };
    }
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

    const ansA = a.answers || {}, ansB = b.answers || {};
    const answers = {};
    new Set([...Object.keys(ansA), ...Object.keys(ansB)]).forEach(qid => {
      answers[qid] = { ...(ansA[qid] || {}), ...(ansB[qid] || {}) };
    });

    return {
      room: b.room || a.room,
      roundId: rb,
      seed: b.seed || a.seed,
      cat: b.cat || a.cat || "all",
      host: b.host || a.host || "Teacher",
      status,
      startAt: b.startAt || a.startAt || 0,
      qIndex: b.qIndex !== undefined ? b.qIndex : (a.qIndex !== undefined ? a.qIndex : 0),
      qPhase: b.qPhase || a.qPhase || "question",
      qStartAt: b.qStartAt || a.qStartAt || 0,
      qDuration: b.qDuration || a.qDuration || 10,
      totalQ: b.totalQ || a.totalQ || 10,
      answers,
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
      qIndex: raw.qIndex !== undefined ? raw.qIndex : 0,
      qPhase: raw.qPhase || "question",
      qStartAt: raw.qStartAt || 0,
      qDuration: raw.qDuration || 10,
      totalQ: raw.totalQ || 10,
      answers: raw.answers || {},
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
        qIndex: 0,
        qPhase: "question",
        qStartAt: 0,
        qDuration: 10,
        totalQ: parseInt(params.totalQ, 10) || 10,
        answers: {},
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
        cur.qIndex = 0;
        cur.qPhase = "question";
        cur.qStartAt = 0;
        cur.answers = {};
        cur.seed = String(params.seed || this.newSeed());
        Object.values(cur.pMap || {}).forEach(p => { p.s = 0; p.c = 0; p.d = 0; p.tl = []; p.t = Date.now(); });
      }
      this.memRooms[room] = cur;
      await this.cloudPut(key, cur, cur.host);
      return { status: "success", arena: this.toSnapshot(cur) };
    }

    if (action === "arena_sync_state") {
      if (params.status) cur.status = params.status;
      if (params.qIndex !== undefined) cur.qIndex = parseInt(params.qIndex, 10);
      if (params.qPhase) cur.qPhase = params.qPhase;
      if (params.qStartAt !== undefined) cur.qStartAt = parseInt(params.qStartAt, 10);
      if (params.qDuration !== undefined) cur.qDuration = parseInt(params.qDuration, 10);
      if (params.totalQ !== undefined) cur.totalQ = parseInt(params.totalQ, 10);
      this.memRooms[room] = cur;
      await this.cloudPut(key, cur, cur.host);
      return { status: "success", arena: this.toSnapshot(cur) };
    }

    if (action === "arena_submit") {
      const pid = String(params.pid || "").replace(/[^0-9A-Za-z_-]/g, "").slice(0, 24);
      const qIndex = parseInt(params.qIndex, 10) || 0;
      const choice = String(params.choice || "").trim();
      const isCorrect = params.isCorrect === true || params.isCorrect === 1 || params.isCorrect === "1";

      cur.answers = cur.answers || {};
      cur.answers[qIndex] = cur.answers[qIndex] || {};
      cur.answers[qIndex][pid] = { choice, isCorrect, t: Date.now() };

      if (cur.pMap && cur.pMap[pid]) {
        if (isCorrect) {
          cur.pMap[pid].s = (cur.pMap[pid].s || 0) + 100;
          cur.pMap[pid].c = (cur.pMap[pid].c || 0) + 1;
        }
        cur.pMap[pid].t = Date.now();
        if (this.myRecord[room] && this.myRecord[room].player && this.myRecord[room].player.pid === pid) {
          this.myRecord[room].player.s = cur.pMap[pid].s;
          this.myRecord[room].player.c = cur.pMap[pid].c;
        }
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

  // Exam Traps for Prepositions (common Hong Kong / DSE / IELTS student errors)
  PREP_TRAPS: {
    "accuse": ["for", "with", "about"],
    "agree": ["on", "to", "at"],
    "apologise": ["to", "about", "with"],
    "apologize": ["to", "about", "with"],
    "argue": ["about", "on", "to"],
    "ask": ["to", "about", "with"],
    "belong": ["with", "for", "in"],
    "beware": ["for", "to", "with"],
    "borrow": ["with", "to", "by"],
    "bump": ["with", "to", "at"],
    "care": ["with", "on", "to"],
    "complain": ["with", "for", "on"],
    "concentrate": ["in", "at", "to"],
    "congratulate": ["for", "to", "about"],
    "consist": ["with", "in", "by"],
    "depend": ["in", "of", "to"],
    "grin": ["to", "on", "with"],
    "hear": ["with", "to", "for"],
    "hope": ["to", "about", "on"],
    "insist": ["to", "in", "for"],
    "know": ["with", "of", "to"],
    "laugh": ["to", "with", "for"],
    "listen": ["for", "at", "with"],
    "look": ["to", "at", "on"],
    "participate": ["to", "at", "with"],
    "pay": ["to", "with", "about"],
    "praise": ["to", "with", "on"],
    "prefer": ["than", "with", "over"],
    "prevent": ["to", "from", "against"],
    "provide": ["to", "for", "in"],
    "qualify": ["to", "with", "in"],
    "recover": ["of", "to", "with"],
    "refer": ["with", "about", "on"],
    "rely": ["in", "to", "with"],
    "remind": ["about", "to", "with"],
    "smile": ["to", "on", "with"],
    "speak": ["with", "at", "for"],
    "talk": ["with", "at", "for"],
    "succeed": ["at", "to", "on"],
    "suffer": ["of", "with", "by"],
    "wait": ["to", "about", "with"],
    "warn": ["to", "for", "with"],
    "write": ["on", "with", "for"],

    // Adjectives + Prepositions
    "absent": ["in", "at", "to"],
    "accustomed": ["with", "in", "for"],
    "addicted": ["with", "on", "in"],
    "afraid": ["to", "with", "about"],
    "amazed": ["with", "to", "about"],
    "amused": ["with", "at", "to"],
    "angry": ["to", "for", "in"],
    "annoyed": ["to", "for", "in"],
    "anxious": ["with", "for", "to"],
    "ashamed": ["with", "to", "about"],
    "aware": ["to", "with", "about"],
    "bad": ["in", "with", "to"],
    "bored": ["at", "to", "for"],
    "capable": ["to", "in", "with"],
    "careful": ["for", "to", "in"],
    "clever": ["in", "with", "to"],
    "concerned": ["for", "with", "to"],
    "conscious": ["to", "with", "about"],
    "convinced": ["with", "to", "about"],
    "delighted": ["to", "for", "about"],
    "different": ["with", "to", "than"],
    "dressed": ["with", "at", "on"],
    "easy": ["to", "with", "of"],
    "difficult": ["to", "with", "of"],
    "envious": ["to", "with", "about"],
    "essential": ["for", "with", "of"],
    "experienced": ["at", "with", "to"],
    "faithful": ["with", "for", "in"],
    "familiar": ["about", "to", "for"],
    "famous": ["with", "to", "in"],
    "fond": ["with", "to", "about"],
    "frightened": ["with", "to", "about"],
    "full": ["with", "in", "to"],
    "furious": ["to", "for", "in"],
    "generous": ["for", "with", "about"],
    "good": ["in", "with", "for"],
    "guilty": ["with", "for", "to"],
    "happy": ["for", "to", "in"],
    "impatient": ["to", "for", "about"],
    "impressed": ["to", "at", "about"],
    "incapable": ["to", "in", "with"],
    "interested": ["on", "about", "to"],
    "jealous": ["with", "to", "about"],
    "keen": ["in", "at", "about"],
    "kind": ["with", "for", "at"],
    "late": ["to", "at", "in"],
    "nervous": ["with", "to", "for"],
    "opposed": ["with", "for", "against"],
    "pleased": ["to", "for", "about"],
    "polite": ["with", "for", "at"],
    "popular": ["to", "in", "for"],
    "proud": ["with", "to", "for"],
    "qualified": ["to", "with", "in"],
    "ready": ["to", "with", "in"],
    "related": ["with", "for", "about"],
    "responsible": ["to", "with", "of"],
    "safe": ["against", "with", "to"],
    "satisfied": ["to", "for", "about"],
    "scared": ["with", "to", "about"],
    "sensitive": ["with", "for", "about"],
    "shocked": ["with", "to", "about"],
    "short": ["with", "in", "to"],
    "similar": ["with", "as", "like"],
    "sorry": ["to", "with", "in"],
    "successful": ["at", "to", "on"],
    "suitable": ["with", "to", "of"],
    "sure": ["with", "to", "in"],
    "surprised": ["with", "to", "for"],
    "suspicious": ["with", "to", "about"],
    "terrified": ["with", "to", "about"],
    "tired": ["with", "at", "to"],
    "typical": ["with", "for", "to"],
    "upset": ["with", "to", "for"],
    "used": ["with", "for", "in"],
    "welcome": ["for", "with", "at"],
    "worried": ["with", "for", "to"],

    // Noun + Prepositions
    "cause": ["for", "to", "about"],
    "chance": ["for", "to", "in"],
    "choice": ["among", "with", "in"],
    "criticism": ["to", "on", "about"],
    "decrease": ["of", "at", "to"],
    "decline": ["of", "at", "to"],
    "drop": ["of", "at", "to"],
    "fall": ["of", "at", "to"],
    "increase": ["of", "at", "to"],
    "rise": ["of", "at", "to"],
    "demand": ["of", "to", "with"],
    "difference": ["among", "with", "in"],
    "difficulty": ["for", "to", "about"],
    "disadvantage": ["to", "for", "in"],
    "example": ["to", "for", "with"],
    "excuse": ["of", "to", "about"],
    "invitation": ["for", "at", "of"],
    "reaction": ["on", "about", "for"],
    "reason": ["of", "to", "about"],
    "solution": ["of", "for", "with"],
    "answer": ["of", "for", "with"],
    "attitude": ["on", "about", "with"],
    "control": ["in", "with", "to"]
  },

  // Plausible Confusable Pairs for Verbs & Nouns
  CONFUSABLE_VERBS: {
    "make": ["do", "take", "create"],
    "do": ["make", "take", "conduct"],
    "take": ["make", "have", "bring"],
    "have": ["take", "make", "hold"],
    "conduct": ["do", "make", "perform"],
    "perform": ["conduct", "make", "do"],
    "gain": ["earn", "win", "get"],
    "win": ["beat", "gain", "earn"],
    "beat": ["win", "defeat", "overcome"],
    "lose": ["miss", "waste", "drop"],
    "catch": ["take", "get", "contract"],
    "cause": ["make", "bring", "lead"],
    "handle": ["cope", "tackle", "manage"],
    "raise": ["rise", "lift", "increase"],
    "rise": ["raise", "arise", "grow"],
    "say": ["tell", "speak", "talk"],
    "tell": ["say", "speak", "talk"],
    "speak": ["talk", "say", "tell"],
    "talk": ["speak", "say", "tell"],
    "break": ["violate", "spoil", "destroy"],
    "keep": ["hold", "retain", "maintain"],
    "pay": ["give", "offer", "grant"],
    "give": ["offer", "provide", "grant"],
    "throw": ["waste", "cast", "dump"],
    "overcome": ["beat", "defeat", "surpass"],
    "seek": ["find", "look", "search"],
    "accept": ["receive", "admit", "agree"],
    "answer": ["reply", "respond", "take"],
    "join": ["enter", "attend", "unite"],
    "set": ["fix", "put", "establish"],
    "score": ["win", "gain", "make"],
    "spend": ["waste", "cost", "take"],
    "hurt": ["harm", "damage", "injure"],
    "fight": ["battle", "struggle", "combat"],
    "start": ["begin", "commence", "initiate"],
    "express": ["show", "voice", "convey"]
  },

  CONFUSABLE_NOUNS: {
    "decision": ["choice", "resolution", "verdict"],
    "situation": ["condition", "circumstance", "position"],
    "responsibility": ["blame", "duty", "fault"],
    "promise": ["pledge", "vow", "agreement"],
    "record": ["benchmark", "history", "score"],
    "rules": ["laws", "orders", "guidelines"],
    "cold": ["flu", "fever", "illness"],
    "fire": ["flame", "heat", "burn"],
    "trouble": ["problem", "distress", "issue"],
    "mind": ["thought", "opinion", "idea"],
    "search": ["seeking", "lookout", "quest"],
    "survey": ["questionnaire", "poll", "census"],
    "experiment": ["trial", "test", "investigation"],
    "research": ["study", "investigation", "analysis"],
    "dishes": ["plates", "bowls", "cups"],
    "disapproval": ["objection", "dislike", "criticism"],
    "injustice": ["unfairness", "inequality", "prejudice"],
    "prejudice": ["bias", "discrimination", "racism"],
    "poverty": ["hardship", "scarcity", "need"],
    "racism": ["discrimination", "bias", "prejudice"],
    "fame": ["popularity", "reputation", "celebrity"],
    "finances": ["funds", "money", "budget"],
    "pressure": ["stress", "tension", "strain"],
    "weight": ["body", "mass", "fat"],
    "welcome": ["greeting", "reception", "entry"],
    "word": ["promise", "trust", "pledge"],
    "hand": ["aid", "favor", "help"],
    "argument": ["debate", "dispute", "quarrel"],
    "disagreement": ["conflict", "division", "clash"],
    "effect": ["affect", "result", "outcome"],
    "feelings": ["emotions", "hearts", "sensations"],
    "team": ["squad", "group", "crew"],
    "opponent": ["rival", "enemy", "competitor"],
    "opposition": ["opponents", "rivals", "adversaries"],
    "difference": ["change", "contrast", "gap"],
    "mistake": ["fault", "error", "blunder"],
    "effort": ["attempt", "try", "endeavor"],
    "hurdles": ["barriers", "fences", "obstacles"],
    "obstacles": ["hurdles", "barriers", "blocks"],
    "compliment": ["flattery", "praise", "honor"],
    "trick": ["joke", "prank", "deceit"],
    "aspirations": ["ambitions", "dreams", "goals"],
    "expectations": ["demands", "hopes", "assumptions"],
    "funds": ["finances", "money", "capital"],
    "hopes": ["dreams", "wishes", "expectations"],
    "prayers": ["wishes", "blessings", "grace"],
    "grace": ["thanks", "blessing", "prayer"],
    "goal": ["target", "aim", "purpose"],
    "advice": ["suggestion", "counsel", "recommendation"],
    "task": ["duty", "assignment", "job"],
    "chance": ["opportunity", "luck", "possibility"],
    "risk": ["danger", "hazard", "threat"],
    "opportunity": ["chance", "occasion", "opening"],
    "secret": ["mystery", "private", "confidential"],
    "truth": ["fact", "reality", "veracity"],
    "party": ["celebration", "feast", "gathering"]
  },

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
    // Prioritize pedagogical "Exam Traps" & plausible confusable distractors
    const distractors = new Set();
    const maxAttempts = 60;
    let attempts = 0;

    if (targetType === "preposition") {
      // 1. Try curated exam trap prepositions for this headword
      const headKey = (ht.base || item.head || "").toLowerCase().trim();
      const traps = this.PREP_TRAPS[headKey] || [];
      traps.forEach(t => {
        if (t.toLowerCase() !== correctVal.toLowerCase() && distractors.size < 2) {
          distractors.add(t.toLowerCase());
        }
      });

      // 2. Fill remaining from pool
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
      const baseKey = (ht.base || "").toLowerCase().trim();

      // 1. Check for curated confusable verbs (e.g. make vs do, say vs tell, raise vs rise, win vs beat)
      const confusableBases = this.CONFUSABLE_VERBS[baseKey] || [];
      confusableBases.forEach(cb => {
        if (distractors.size < 2) {
          const inflected = this.inflectVerbToTense(cb, targetTense);
          if (inflected && inflected.toLowerCase() !== correctVal.toLowerCase()) {
            distractors.add(inflected);
          }
        }
      });

      // 2. Pick other verbs from the active pool in the exact same tense
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
      const nounKey = (token.base || correctVal || "").toLowerCase().trim();

      // 1. Check for plausible confusable nouns (e.g. decision vs choice, cold vs flu, mistake vs fault)
      const confusableNouns = this.CONFUSABLE_NOUNS[nounKey] || [];
      confusableNouns.forEach(cn => {
        if (distractors.size < 2 && cn.toLowerCase() !== correctVal.toLowerCase()) {
          distractors.add(cn);
        }
      });

      // 2. Pick other nouns from the pool
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

  /* ---------------------------------------------------------
     GLOSSARY REVISION VIEW (INDEPENDENT FROM WORD VAULT)
     --------------------------------------------------------- */
  showGlossary(activeTab = "all", searchQuery = "") {
    const el = $("#screen-alchemy");
    if (!el) return;

    const data = this.getDataset();
    const categories = [
      { id: "all", name: "All (250)" },
      { id: "Verb + Noun", name: "Verb + Noun (75)" },
      { id: "Verb + Preposition", name: "Verb + Prep (47)" },
      { id: "Noun + Preposition", name: "Noun + Prep (60)" },
      { id: "Adjective + Preposition", name: "Adj + Prep (68)" }
    ];

    let filtered = activeTab === "all" ? [...data] : data.filter(d => d.cat === activeTab);
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      filtered = filtered.filter(d => 
        d.phrase.toLowerCase().includes(q) || 
        d.meaning_chin.toLowerCase().includes(q) || 
        d.meaning_eng.toLowerCase().includes(q) ||
        d.sentence.toLowerCase().includes(q)
      );
    }

    el.innerHTML = `
      <div class="alch-glossary-view">
        <div class="alch-glossary-head">
          <button class="back-btn" id="btn-alch-glossary-back">← Alchemy Arena</button>
          <div style="text-align:center;flex:1">
            <h2 style="font-family:var(--font-h);margin:0;color:#fde68a">⚗️ Collocation Revision Glossary</h2>
            <p class="muted" style="margin:4px 0 0;font-size:0.88rem">Master the complete curriculum of 250 Academic Collocations &amp; Sentence Patterns</p>
          </div>
        </div>

        <!-- SEARCH & CATEGORY FILTER BAR -->
        <div class="alch-glossary-controls card" style="margin:16px 0;padding:14px">
          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px">
            <div style="flex:1;min-width:240px;position:relative">
              <input type="text" id="alch-glossary-search" placeholder="🔍 Search phrase, preposition, or Chinese meaning..." value="${esc(searchQuery)}" style="width:100%;margin:0;font-size:0.92rem;padding:10px 14px" />
            </div>
            <span class="muted" style="font-size:0.85rem">Showing <b>${filtered.length}</b> of ${data.length} collocations</span>
          </div>

          <div class="alch-glossary-tabs">
            ${categories.map(c => `
              <button class="alch-glossary-tab ${c.id === activeTab ? "active" : ""}" data-tab="${c.id}">${c.name}</button>
            `).join("")}
          </div>
        </div>

        <!-- CARDS LIST -->
        <div class="alch-glossary-list">
          ${filtered.length ? filtered.map((item, idx) => `
            <div class="alch-glossary-card card">
              <div class="agc-head">
                <span class="agc-num">#${item.id}</span>
                <span class="alch-cat-badge">${esc(item.cat)}</span>
                <span class="agc-pos">${esc(item.pos)}</span>
              </div>
              <div class="agc-phrase-row">
                <h3 class="agc-phrase">${esc(item.phrase)}</h3>
                <span class="agc-meaning-chin">${esc(item.meaning_chin)}</span>
              </div>
              <div class="agc-meaning-eng muted">${esc(item.meaning_eng)}</div>
              <div class="agc-sentence-box">
                <span class="agc-sentence-icon">💡</span>
                <div class="agc-sentence-text">${this.highlightCollocationInSentence(item)}</div>
              </div>
            </div>
          `).join("") : `
            <div class="card" style="text-align:center;padding:40px;color:var(--muted)">
              No collocations found matching "<b>${esc(searchQuery)}</b>".
            </div>
          `}
        </div>
      </div>
    `;

    $("#btn-alch-glossary-back").onclick = () => this.intro();

    // Tab switching
    $$(".alch-glossary-tab").forEach(tab => {
      tab.onclick = () => {
        Sfx.click();
        this.showGlossary(tab.dataset.tab, $("#alch-glossary-search").value);
      };
    });

    // Search input
    const searchInput = $("#alch-glossary-search");
    if (searchInput) {
      searchInput.oninput = () => {
        this.showGlossary(activeTab, searchInput.value);
      };
    }
  },

  highlightCollocationInSentence(item) {
    const s = item.sentence || "";
    const ht = item.head_token;
    const pt = item.partner_token;

    if (ht && pt && ht.start !== undefined && pt.start !== undefined) {
      // Order by start
      const first = ht.start < pt.start ? ht : pt;
      const second = ht.start < pt.start ? pt : ht;

      if (first.end <= second.start) {
        return (
          esc(s.slice(0, first.start)) +
          `<b class="agc-highlight">${esc(s.slice(first.start, first.end))}</b>` +
          esc(s.slice(first.end, second.start)) +
          `<b class="agc-highlight">${esc(s.slice(second.start, second.end))}</b>` +
          esc(s.slice(second.end))
        );
      }
    }

    return esc(s);
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
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:center;margin-bottom:14px">
            <div class="alch-best-pill" style="margin-bottom:0">🏆 Personal Best: <b>${fmt(best)}</b></div>
            <button class="btn small" id="btn-alch-glossary" style="border-color:#c084fc;color:#e9d5ff;background:rgba(168,85,247,0.18)">📖 Study Revision Glossary (250)</button>
          </div>
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
    const glossaryBtn = $("#btn-alch-glossary");
    if (glossaryBtn) glossaryBtn.onclick = () => this.showGlossary();

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
      stage.innerHTML = `
        <div class="card" style="max-width:580px;margin:20px auto;text-align:center">
          <div style="font-size:2.8rem;margin-bottom:6px">🏰</div>
          <h3 style="margin:0 0 6px">Collocation Class Arena</h3>
          <p class="muted" style="margin:0 0 16px;font-size:0.9rem">Live synchronized class battle! Questions and options appear on the big whiteboard and students' devices for 10s each.</p>

          <!-- STUDENT PIN JOIN -->
          <div style="margin:16px 0;padding:16px;background:rgba(255,255,255,0.03);border:1px solid var(--line);border-radius:16px">
            <h4 style="margin:0 0 8px;color:#fde68a;font-size:1rem">📱 Students: Join with Room PIN</h4>
            <div style="display:flex;gap:10px;justify-content:center;max-width:340px;margin:0 auto">
              <input type="text" id="alch-arena-pin-input" maxlength="6" placeholder="Room PIN (e.g. 4821)" autocomplete="off" style="text-transform:uppercase;text-align:center;font-size:1.1rem;font-weight:800;letter-spacing:0.1em;padding:10px;margin:0" />
              <button class="btn primary" id="btn-alch-join-arena" style="white-space:nowrap">Join Match →</button>
            </div>
          </div>

          <!-- TEACHER HOST SECTION -->
          <div style="margin-top:16px;border-top:1px solid var(--line);padding-top:16px">
            <h4 style="margin:0 0 6px;color:#38bdf8;font-size:1rem">🎓 Teachers: Project Whiteboard</h4>
            <p class="muted" style="font-size:0.85rem;margin-bottom:12px">Project the live big-screen Whiteboard with QR Code &amp; 10s synchronized timer.</p>
            ${isTeacher ? `
              <button class="btn big-cta" id="btn-alch-host-arena" style="background:#10b981;border-color:#059669;color:#fff;font-size:1.1rem;padding:12px 28px">
                🏰 Launch Classroom Whiteboard
              </button>
            ` : `
              <button class="btn secondary" id="btn-alch-teacher-auth" style="font-size:0.95rem">
                🔑 Teacher Unlock (Host Room)
              </button>
            `}
          </div>
        </div>
      `;

      $("#btn-alch-join-arena").onclick = () => {
        const pin = ($("#alch-arena-pin-input")?.value || "").trim().toUpperCase();
        if (!pin) return toast("Please enter the 4-digit Room PIN");
        this.handleArenaUrl(pin);
      };
      $("#alch-arena-pin-input")?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") $("#btn-alch-join-arena")?.click();
      });

      if (isTeacher) {
        $("#btn-alch-host-arena").onclick = () => this.createArenaRoom();
      } else {
        $("#btn-alch-teacher-auth").onclick = () => this.promptTeacherAuth();
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
          <div class="duel-fighter-card ready" style="--hc:${ALCH_HOUSE_COLORS[me.house] || "#38bdf8"}">
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
          if (rHouse) { rHouse.textContent = rival.h || "ROGUE"; rHouse.style.color = ALCH_HOUSE_COLORS[rival.h] || "#cbd5e1"; }
          if (rStatus) rStatus.textContent = rival.d ? "Finished" : (rival.s > 0 ? `Racing (${rival.s} pts)` : "Connected");
          if (rCard) { rCard.classList.remove("waiting"); rCard.classList.add("ready"); rCard.style.setProperty("--hc", ALCH_HOUSE_COLORS[rival.h] || "#fda4af"); }
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

  /* ---------------------------------------------------------
     SYNCHRONIZED CLASS ARENA (TEACHER WHITEBOARD & STUDENT SCREEN)
     --------------------------------------------------------- */
  qrSvg(text) {
    if (typeof qrcode === "function") {
      try {
        const qr = qrcode(0, "M");
        qr.addData(text);
        qr.make();
        return qr.createSvgTag(6, 2);
      } catch (e) {
        console.warn("[Alchemy] QR SVG error:", e);
      }
    }
    return "";
  },

  getSyncQuestion(qIndex, totalQ, seed) {
    if (!this.cachedSyncQuestions || this.cachedSyncSeed !== seed || this.cachedSyncTotal !== totalQ) {
      this.cachedSyncQuestions = this.buildQuestionQueue(Math.max(totalQ, 30), seed);
      this.cachedSyncSeed = seed;
      this.cachedSyncTotal = totalQ;
    }
    return this.cachedSyncQuestions[qIndex % this.cachedSyncQuestions.length];
  },

  renderTeacherWhiteboard() {
    const a = this.arena;
    if (!a) return;
    const el = $("#screen-alchemy");
    const link = `${AlchemyNet.baseUrl()}?alchclass=${a.room}`;
    const qrSvgHtml = this.qrSvg(link);

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
            <div class="arena-qr-box" id="cah-qr-box" style="display:flex;align-items:center;justify-content:center;background:#fff;border-radius:16px;padding:12px;margin:12px auto;width:240px;height:240px;box-shadow:0 10px 25px rgba(0,0,0,0.4)">
              ${qrSvgHtml || '<div class="muted" style="color:#000;font-size:0.85rem">Scan with phone camera</div>'}
            </div>
            <div style="margin:10px auto;max-width:260px">
              <button class="btn small secondary" id="btn-cah-copy-link" style="width:100%;font-size:0.85rem">📋 Copy Student Join Link</button>
            </div>
            <div class="cah-hint muted" style="font-size:0.82rem;word-break:break-all">Direct URL: <b>${link}</b></div>
          </div>

          <div class="cah-board">
            <div class="cah-board-head">
              <h2>Student Roster (<span id="cah-count">0</span> Joined)</h2>
              <div class="cah-controls">
                <select id="cah-total-q-select" style="background:#1e293b;color:#fff;border:1px solid var(--line);border-radius:8px;padding:6px 10px;font-size:0.9rem;font-weight:700">
                  <option value="10" selected>10 Questions (10s each)</option>
                  <option value="15">15 Questions (10s each)</option>
                  <option value="20">20 Questions (10s each)</option>
                </select>
                <button class="btn primary" id="btn-cah-start">⚡ Launch Class Battle</button>
                <button class="btn small secondary hidden" id="btn-cah-export-csv" title="Download Excel (.csv)" style="background:#10b981;border-color:#059669;color:#fff">📥 Excel (.csv)</button>
                <button class="btn small secondary hidden" id="btn-cah-email-gmail" title="Open Gmail report" style="background:#ea4335;border-color:#d93025;color:#fff">✉️ Gmail</button>
                <button class="btn small secondary hidden" id="btn-cah-copy-sheets" title="Copy for Google Sheets" style="background:#0284c7;border-color:#0369a1;color:#fff">📋 Copy for Sheets</button>
                <button class="btn small secondary" id="btn-cah-reset">🔄 Reset</button>
              </div>
            </div>

            <div class="arena-roster" id="cah-roster">
              <div class="arena-empty muted">Waiting for students to enter Room PIN or scan QR code...</div>
            </div>

            <div class="card" id="cah-house-card" style="margin-top:14px">
              <h3 style="font-size:1rem;margin-bottom:8px">🏆 Four Houses Mark Comparison</h3>
              <div class="arena-house-cup" id="cah-house-cup"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    $("#btn-cah-copy-link").onclick = () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(() => toast("📋 Join link copied to clipboard!"));
      } else {
        prompt("Copy join link:", link);
      }
    };

    $("#btn-cah-close").onclick = () => {
      if (this.arenaPollTimer) clearInterval(this.arenaPollTimer);
      if (this.syncTimerInterval) clearInterval(this.syncTimerInterval);
      this.intro();
    };

    $("#btn-cah-start").onclick = async () => {
      const qSel = $("#cah-total-q-select");
      const totalQ = qSel ? parseInt(qSel.value, 10) : 10;
      await this.startSynchronizedBattle(totalQ);
    };

    $("#btn-cah-reset").onclick = async () => {
      try {
        await AlchemyNet.call("arena_reset", { room: a.room, role: "staff", seed: AlchemyNet.newSeed() });
        toast("🔄 Room reset!");
      } catch (e) { toast("Error: " + e.message); }
    };

    $("#btn-cah-export-csv").onclick = () => this.exportClassCsv(this.lastArenaSnap?.players || [], a.room, "Collocation Alchemy");
    $("#btn-cah-email-gmail").onclick = () => this.emailClassResults(this.lastArenaSnap?.players || [], a.room, "Collocation Alchemy");
    $("#btn-cah-copy-sheets").onclick = () => this.copyForGoogleSheets(this.lastArenaSnap?.players || []);

    // Poll teacher lobby state
    if (this.arenaPollTimer) clearInterval(this.arenaPollTimer);
    this.arenaPollTimer = setInterval(async () => {
      try {
        const res = await AlchemyNet.call("arena_state", { room: a.room });
        this.updateTeacherBoardUI(res.arena);
      } catch {}
    }, 1500);
  },

  async startSynchronizedBattle(totalQ = 10) {
    const a = this.arena;
    if (!a) return;
    toast("🚀 Starting Class Battle! 10s per question...");
    if (this.arenaPollTimer) clearInterval(this.arenaPollTimer);

    try {
      const res = await AlchemyNet.call("arena_sync_state", {
        room: a.room,
        status: "live",
        qIndex: 0,
        qPhase: "question",
        qStartAt: Date.now(),
        qDuration: 10,
        totalQ
      });
      this.lastArenaSnap = res.arena;
      this.renderTeacherLiveQuestion(res.arena);
    } catch (e) {
      toast("❌ Error starting match: " + e.message);
    }
  },

  renderTeacherLiveQuestion(snap) {
    if (!snap) return;
    this.lastArenaSnap = snap;
    const a = this.arena;
    const el = $("#screen-alchemy");

    if (snap.status === "ended") {
      this.renderTeacherFinalPodium(snap);
      return;
    }

    const qIndex = snap.qIndex || 0;
    const totalQ = snap.totalQ || 10;
    const qDuration = snap.qDuration || 10;
    const qStartAt = snap.qStartAt || Date.now();
    const q = this.getSyncQuestion(qIndex, totalQ, snap.seed);

    const answersMap = (snap.answers && snap.answers[qIndex]) || {};
    const answeredCount = Object.keys(answersMap).length;
    const correctCount = Object.values(answersMap).filter(ans => ans.isCorrect).length;
    const totalStudents = Math.max(snap.players.length, 1);
    const correctPct = Math.round((correctCount / totalStudents) * 100);

    const elapsed = Math.floor((Date.now() - qStartAt) / 1000);
    const remaining = Math.max(0, qDuration - elapsed);
    const isReveal = snap.qPhase === "reveal" || remaining === 0;

    let sentenceDisplay = q.sentenceWithBlank;
    if (isReveal) {
      sentenceDisplay = sentenceDisplay.replace("****", `<span class="sync-blank correct">${esc(q.correctVal)}</span>`);
    } else {
      sentenceDisplay = sentenceDisplay.replace("****", `<span class="sync-blank">______</span>`);
    }

    const letters = ["A", "B", "C", "D"];
    const optionCounts = {};
    (q.options || []).forEach(opt => { optionCounts[opt] = 0; });
    Object.values(answersMap).forEach(ans => {
      if (optionCounts[ans.choice] !== undefined) optionCounts[ans.choice]++;
    });

    const timerClass = remaining <= 2 ? "danger" : (remaining <= 5 ? "warning" : "");

    el.innerHTML = `
      <div class="sync-arena-stage">
        <!-- HEADER HUD -->
        <div class="sync-arena-header">
          <button class="back-btn" id="btn-sync-exit" style="padding:6px 14px">← Exit Room</button>
          <div class="sync-q-badge">🎯 Question ${qIndex + 1} of ${totalQ}</div>
          <div class="sync-timer-box ${timerClass}" id="sync-timer-display">
            ⏱️ <span>${isReveal ? "TIME UP" : remaining + "s"}</span>
          </div>
          <div class="sync-answered-pill" id="sync-answered-display">
            👥 ${answeredCount} / ${snap.players.length} Answered
          </div>
        </div>

        <!-- MAIN QUESTION CARD -->
        <div class="sync-question-card">
          <div class="sync-pattern-tag">⚗️ ${esc(q.item.cat || "Collocation Pattern")}</div>
          <div class="sync-sentence">${sentenceDisplay}</div>
          <div class="sync-clues">
            <span>📖 Meaning: <b class="sync-clue-chin">${esc(q.item.chin || "")}</b></span>
            <span>💡 Target: <b>${esc(q.directionText || "Fill in missing word")}</b></span>
          </div>
        </div>

        <!-- REVEAL STATISTICS (WHEN TIME UP) -->
        ${isReveal ? `
          <div class="sync-reveal-card">
            <div class="sync-reveal-title">✅ Correct Collocation: <span style="color:#a7f3d0">${esc(q.item.phrase)}</span></div>
            <div class="sync-reveal-stats">
              🎉 <b>${correctCount}</b> of <b>${totalStudents}</b> students answered correctly! (<b>${correctPct}%</b>)
            </div>
          </div>
        ` : ''}

        <!-- OPTIONS GRID -->
        <div class="sync-options-grid">
          ${(q.options || []).map((opt, idx) => {
            const isCorr = opt.toLowerCase() === q.correctVal.toLowerCase();
            let optClass = "sync-opt-btn";
            if (isReveal) {
              if (isCorr) optClass += " correct";
              else optClass += " dimmed";
            }
            const countForOpt = optionCounts[opt] || 0;
            return `
              <div class="${optClass}">
                <span class="sync-opt-letter">${letters[idx]}</span>
                <span class="sync-opt-text">${esc(opt)}</span>
                ${isReveal ? `<span class="sync-opt-stats">👥 ${countForOpt}</span>` : ''}
              </div>
            `;
          }).join("")}
        </div>

        <!-- TEACHER CONTROL FOOTER -->
        <div style="display:flex;justify-content:center;gap:14px;margin-top:20px;flex-wrap:wrap">
          ${isReveal ? (
            qIndex + 1 < totalQ ? `
              <button class="btn primary big-cta" id="btn-sync-next-q" style="font-size:1.15rem;padding:12px 32px">
                Next Question (Q${qIndex + 2}/${totalQ}) ➔
              </button>
            ` : `
              <button class="btn primary big-cta" id="btn-sync-finish-battle" style="font-size:1.15rem;padding:12px 32px;background:#10b981;border-color:#059669">
                🏆 View Final Results ➔
              </button>
            `
          ) : `
            <button class="btn secondary" id="btn-sync-force-reveal">Skip Timer &amp; Reveal Answer ➔</button>
          `}
        </div>
      </div>
    `;

    $("#btn-sync-exit").onclick = () => {
      if (this.syncTimerInterval) clearInterval(this.syncTimerInterval);
      if (this.arenaPollTimer) clearInterval(this.arenaPollTimer);
      this.intro();
    };

    if ($("#btn-sync-force-reveal")) {
      $("#btn-sync-force-reveal").onclick = () => this.triggerRevealPhase();
    }
    if ($("#btn-sync-next-q")) {
      $("#btn-sync-next-q").onclick = () => this.nextSynchronizedQuestion();
    }
    if ($("#btn-sync-finish-battle")) {
      $("#btn-sync-finish-battle").onclick = () => this.endSynchronizedBattle();
    }

    // Start teacher live countdown & polling loop
    this.startTeacherSyncLoop();
  },

  startTeacherSyncLoop() {
    if (this.syncTimerInterval) clearInterval(this.syncTimerInterval);
    const a = this.arena;
    if (!a) return;

    this.syncTimerInterval = setInterval(async () => {
      const snap = this.lastArenaSnap;
      if (!snap || snap.status !== "live") return;

      const qDuration = snap.qDuration || 10;
      const qStartAt = snap.qStartAt || Date.now();
      const elapsed = Math.floor((Date.now() - qStartAt) / 1000);
      const remaining = Math.max(0, qDuration - elapsed);

      // Update timer HUD directly
      const timerEl = $("#sync-timer-display span");
      if (timerEl && snap.qPhase === "question") {
        timerEl.textContent = remaining + "s";
        const box = $("#sync-timer-display");
        if (box) {
          box.className = "sync-timer-box " + (remaining <= 2 ? "danger" : (remaining <= 5 ? "warning" : ""));
        }
      }

      // If time expired and still in question phase, trigger reveal!
      if (remaining === 0 && snap.qPhase === "question") {
        clearInterval(this.syncTimerInterval);
        await this.triggerRevealPhase();
        return;
      }

      // Refresh answers and student count from server every 1s
      try {
        const res = await AlchemyNet.call("arena_state", { room: a.room });
        const curSnap = res.arena;
        if (!curSnap) return;
        this.lastArenaSnap = curSnap;

        const answersMap = (curSnap.answers && curSnap.answers[curSnap.qIndex]) || {};
        const answeredCount = Object.keys(answersMap).length;
        const ansEl = $("#sync-answered-display");
        if (ansEl) ansEl.textContent = `👥 ${answeredCount} / ${curSnap.players.length} Answered`;

        // If everyone answered before 10s, auto-reveal!
        if (curSnap.players.length > 0 && answeredCount >= curSnap.players.length && curSnap.qPhase === "question") {
          clearInterval(this.syncTimerInterval);
          await this.triggerRevealPhase();
        }
      } catch {}
    }, 1000);
  },

  async triggerRevealPhase() {
    const a = this.arena;
    if (!a) return;
    try {
      const res = await AlchemyNet.call("arena_sync_state", {
        room: a.room,
        qPhase: "reveal"
      });
      this.lastArenaSnap = res.arena;
      this.renderTeacherLiveQuestion(res.arena);
    } catch (e) {
      console.warn("Reveal trigger error", e);
    }
  },

  async nextSynchronizedQuestion() {
    const a = this.arena;
    const snap = this.lastArenaSnap;
    if (!a || !snap) return;

    const nextQ = (snap.qIndex || 0) + 1;
    try {
      const res = await AlchemyNet.call("arena_sync_state", {
        room: a.room,
        qIndex: nextQ,
        qPhase: "question",
        qStartAt: Date.now()
      });
      this.lastArenaSnap = res.arena;
      this.renderTeacherLiveQuestion(res.arena);
    } catch (e) {
      toast("Error loading next question: " + e.message);
    }
  },

  async endSynchronizedBattle() {
    const a = this.arena;
    if (!a) return;
    try {
      const res = await AlchemyNet.call("arena_sync_state", {
        room: a.room,
        status: "ended"
      });
      this.lastArenaSnap = res.arena;
      this.renderTeacherFinalPodium(res.arena);
    } catch (e) {
      toast("Error concluding match: " + e.message);
    }
  },

  renderTeacherFinalPodium(snap) {
    if (!snap) return;
    const a = this.arena;
    const el = $("#screen-alchemy");

    el.innerHTML = `
      <div class="sync-arena-stage">
        <div class="sync-arena-header">
          <button class="back-btn" id="btn-sync-exit-final">← Exit Room</button>
          <div class="sync-q-badge" style="background:rgba(16,185,129,0.2);border-color:#10b981;color:#a7f3d0">🏆 Battle Concluded</div>
          <div style="font-size:1.1rem;font-weight:800;color:#fde68a">Room PIN: ${a.room}</div>
        </div>

        <div class="arena-top3-section" style="margin:20px 0">
          <h2 style="text-align:center;color:#fde68a;font-size:1.8rem;margin-bottom:14px">👑 Champions Podium</h2>
          <div class="arena-podium">${this.buildPodiumHtml(snap.players)}</div>
        </div>

        <div style="display:flex;justify-content:center;gap:12px;margin:24px 0;flex-wrap:wrap">
          <button class="btn primary" id="btn-sync-csv" style="background:#10b981;border-color:#059669;color:#fff">📥 Download Excel (.csv)</button>
          <button class="btn secondary" id="btn-sync-sheets" style="background:#0284c7;border-color:#0369a1;color:#fff">📋 Copy for Google Sheets</button>
          <button class="btn secondary" id="btn-sync-gmail" style="background:#ea4335;border-color:#d93025;color:#fff">✉️ Email Gmail Report</button>
          <button class="btn secondary" id="btn-sync-restart">🔄 Host Another Match</button>
        </div>

        <div class="card" style="margin-top:20px">
          <h3>🏆 Final Four Houses Marks</h3>
          <div class="arena-house-cup" id="sync-final-houses"></div>
        </div>
      </div>
    `;

    $("#btn-sync-exit-final").onclick = () => this.intro();
    $("#btn-sync-csv").onclick = () => this.exportClassCsv(snap.players, a.room);
    $("#btn-sync-sheets").onclick = () => this.copyForGoogleSheets(snap.players);
    $("#btn-sync-gmail").onclick = () => this.emailClassResults(snap.players, a.room);
    $("#btn-sync-restart").onclick = () => this.renderTeacherWhiteboard();

    // Populate houses
    const houseEl = $("#sync-final-houses");
    if (houseEl) {
      const houseScores = { TAK: 0, CHI: 0, KIN: 0, KAN: 0 };
      snap.players.forEach(p => { if (houseScores[p.h] !== undefined) houseScores[p.h] += (p.s || 0); });
      const maxH = Math.max(...Object.values(houseScores), 100);
      houseEl.innerHTML = Object.keys(houseScores).map(h => {
        const sc = houseScores[h];
        const pct = Math.min(100, Math.round((sc / maxH) * 100));
        return `
          <div class="ahc-row" style="--hc:${ALCH_HOUSE_COLORS[h]}">
            <span>${h}</span>
            <div class="ahc-bar"><i style="width:${pct}%"></i></div>
            <b>${fmt(sc)} pts</b>
          </div>
        `;
      }).join("");
    }
  },

  /* ---------------------------------------------------------
     STUDENT LIVE ARENA SCREEN (SYNCHRONIZED WITH TEACHER)
     --------------------------------------------------------- */
  renderStudentLiveQuestion(snap) {
    if (!snap) return;
    this.lastArenaSnap = snap;
    const a = this.arena;
    const el = $("#screen-alchemy");
    const me = AlchemyNet.me();

    if (snap.status === "ended") {
      this.renderStudentFinalPodium(snap);
      return;
    }

    const qIndex = snap.qIndex || 0;
    const totalQ = snap.totalQ || 10;
    const qDuration = snap.qDuration || 10;
    const qStartAt = snap.qStartAt || Date.now();
    const q = this.getSyncQuestion(qIndex, totalQ, snap.seed);

    const answersMap = (snap.answers && snap.answers[qIndex]) || {};
    const myAns = answersMap[me.pid];
    const hasAnswered = !!myAns;
    const elapsed = Math.floor((Date.now() - qStartAt) / 1000);
    const remaining = Math.max(0, qDuration - elapsed);
    const isReveal = snap.qPhase === "reveal" || remaining === 0;

    let sentenceDisplay = q.sentenceWithBlank;
    if (isReveal) {
      sentenceDisplay = sentenceDisplay.replace("****", `<span class="sync-blank correct">${esc(q.correctVal)}</span>`);
    } else {
      sentenceDisplay = sentenceDisplay.replace("****", `<span class="sync-blank">______</span>`);
    }

    const letters = ["A", "B", "C", "D"];
    const timerClass = remaining <= 2 ? "danger" : (remaining <= 5 ? "warning" : "");

    const correctCount = Object.values(answersMap).filter(ans => ans.isCorrect).length;
    const totalStudents = Math.max(snap.players.length, 1);
    const correctPct = Math.round((correctCount / totalStudents) * 100);

    el.innerHTML = `
      <div class="sync-arena-stage" style="max-width:680px">
        <!-- STUDENT TOP HUD -->
        <div class="sync-arena-header">
          <div class="sync-q-badge">🎯 Q${qIndex + 1} of ${totalQ}</div>
          <div class="sync-timer-box ${timerClass}" id="student-sync-timer">
            ⏱️ <span>${isReveal ? "TIME UP" : remaining + "s"}</span>
          </div>
          <div class="sync-answered-pill">
            Score: <b>${fmt(snap.players.find(p => p.id === me.pid)?.s || 0)}</b> pts
          </div>
        </div>

        <!-- QUESTION CARD -->
        <div class="sync-question-card" style="padding:20px 16px">
          <div class="sync-pattern-tag">⚗️ ${esc(q.item.cat || "Collocation Pattern")}</div>
          <div class="sync-sentence" style="font-size:1.35rem">${sentenceDisplay}</div>
          <div class="sync-clues" style="font-size:0.95rem">
            <span>📖 Meaning: <b class="sync-clue-chin">${esc(q.item.chin || "")}</b></span>
          </div>
        </div>

        <!-- STATUS FEEDBACK -->
        ${isReveal ? `
          <div class="sync-student-status ${myAns?.isCorrect ? 'correct' : 'wrong'}">
            ${myAns?.isCorrect ? '🎉 Correct! +100 pts' : `❌ Not quite! Correct was: <b>${esc(q.correctVal)}</b>`}
            <div style="font-size:0.85rem;margin-top:4px;color:#cbd5e1">
              📊 ${correctCount} of ${totalStudents} students got this right (${correctPct}%)
            </div>
          </div>
        ` : (
          hasAnswered ? `
            <div class="sync-student-status waiting">
              ✅ Answer locked in: <b>${esc(myAns.choice)}</b>. Waiting for time up...
            </div>
          ` : `
            <div class="sync-student-status waiting" style="background:rgba(255,255,255,0.05);color:#cbd5e1;border-color:rgba(255,255,255,0.1)">
              👆 Tap your answer below!
            </div>
          `
        )}

        <!-- 4 TAP OPTIONS -->
        <div class="sync-options-grid">
          ${(q.options || []).map((opt, idx) => {
            const isSelected = myAns && myAns.choice === opt;
            const isCorr = opt.toLowerCase() === q.correctVal.toLowerCase();
            let optClass = "sync-opt-btn";
            if (isReveal) {
              if (isCorr) optClass += " correct";
              else if (isSelected) optClass += " wrong";
              else optClass += " dimmed";
            } else if (isSelected) {
              optClass += " selected";
            }

            return `
              <button class="${optClass}" data-opt="${esc(opt)}" ${hasAnswered || isReveal ? 'disabled' : ''} style="cursor:${hasAnswered || isReveal ? 'default' : 'pointer'}">
                <span class="sync-opt-letter">${letters[idx]}</span>
                <span class="sync-opt-text">${esc(opt)}</span>
              </button>
            `;
          }).join("")}
        </div>
      </div>
    `;

    // Bind option tap buttons
    if (!hasAnswered && !isReveal) {
      el.querySelectorAll(".sync-opt-btn").forEach(btn => {
        btn.onclick = async () => {
          const choice = btn.getAttribute("data-opt");
          const isCorrect = choice.toLowerCase() === q.correctVal.toLowerCase();
          btn.classList.add("selected");
          el.querySelectorAll(".sync-opt-btn").forEach(b => b.disabled = true);

          try {
            await AlchemyNet.call("arena_submit", {
              room: a.room,
              pid: me.pid,
              qIndex,
              choice,
              isCorrect
            });
            // Re-fetch snapshot and update view
            const res = await AlchemyNet.call("arena_state", { room: a.room });
            this.renderStudentLiveQuestion(res.arena);
          } catch (e) {
            console.warn("Submit error", e);
          }
        };
      });
    }

    // Start student polling loop
    this.startStudentSyncLoop();
  },

  startStudentSyncLoop() {
    if (this.syncTimerInterval) clearInterval(this.syncTimerInterval);
    const a = this.arena;
    if (!a) return;

    this.syncTimerInterval = setInterval(async () => {
      try {
        const res = await AlchemyNet.call("arena_state", { room: a.room });
        const curSnap = res.arena;
        if (!curSnap) return;

        const prevSnap = this.lastArenaSnap;
        this.lastArenaSnap = curSnap;

        // If question or phase changed, re-render
        if (!prevSnap || prevSnap.qIndex !== curSnap.qIndex || prevSnap.qPhase !== curSnap.qPhase || prevSnap.status !== curSnap.status) {
          this.renderStudentLiveQuestion(curSnap);
          return;
        }

        // Otherwise update local countdown timer
        const qDuration = curSnap.qDuration || 10;
        const qStartAt = curSnap.qStartAt || Date.now();
        const elapsed = Math.floor((Date.now() - qStartAt) / 1000);
        const remaining = Math.max(0, qDuration - elapsed);

        const timerEl = $("#student-sync-timer span");
        if (timerEl && curSnap.qPhase === "question") {
          timerEl.textContent = remaining + "s";
          const box = $("#student-sync-timer");
          if (box) box.className = "sync-timer-box " + (remaining <= 2 ? "danger" : (remaining <= 5 ? "warning" : ""));
        }
      } catch {}
    }, 1200);
  },

  renderStudentFinalPodium(snap) {
    if (this.syncTimerInterval) clearInterval(this.syncTimerInterval);
    const el = $("#screen-alchemy");
    const me = AlchemyNet.me();
    const myPlayer = snap.players.find(p => p.id === me.pid) || {};

    el.innerHTML = `
      <div class="sync-arena-stage" style="max-width:580px;text-align:center">
        <div style="font-size:3.5rem;margin:16px 0 6px">🏆</div>
        <h2 style="color:#fde68a;margin-bottom:4px">Class Battle Finished!</h2>
        <p class="muted">Collocation Alchemy · Room ${this.arena?.room || ""}</p>

        <div class="card" style="margin:20px auto;max-width:320px;padding:20px;border-color:var(--gold)">
          <div style="font-size:0.85rem;color:var(--muted);text-transform:uppercase;font-weight:800">Your Final Mark</div>
          <div style="font-size:2.8rem;font-weight:900;color:#fde68a;margin:8px 0">${fmt(myPlayer.s || 0)}</div>
          <div style="font-size:0.95rem;color:#a7f3d0;font-weight:800">Solved ${myPlayer.c || 0} questions</div>
        </div>

        <div class="arena-top3-section" style="margin:20px 0">
          <h3 style="color:#fde68a;margin-bottom:12px">👑 Class Champions</h3>
          <div class="arena-podium">${this.buildPodiumHtml(snap.players)}</div>
        </div>

        <button class="btn primary" id="btn-student-leave-final" style="margin-top:16px">Back to Main Menu</button>
      </div>
    `;

    $("#btn-student-leave-final").onclick = () => this.intro();
  },

  updateTeacherBoardUI(snap) {
    if (!snap) return;
    this.lastArenaSnap = snap;
    const countEl = $("#cah-count");
    if (countEl) countEl.textContent = snap.players.length;

    const statusEl = $("#cah-status-pill");
    if (statusEl) {
      statusEl.textContent = snap.status === "live" ? "🔥 BATTLE IN PROGRESS" : (snap.status === "ended" ? "🏆 MATCH COMPLETED" : "WAITING IN LOBBY");
      statusEl.className = "cah-status " + snap.status;
    }

    const showExports = (snap.status === "ended" || snap.players.some(p => p.d || p.s > 0)) && snap.players.length > 0;
    $("#btn-cah-export-csv")?.classList.toggle("hidden", !showExports);
    $("#btn-cah-email-gmail")?.classList.toggle("hidden", !showExports);
    $("#btn-cah-copy-sheets")?.classList.toggle("hidden", !showExports);

    const rosterEl = $("#cah-roster");
    if (rosterEl) {
      if (!snap.players.length) {
        rosterEl.innerHTML = `<div class="arena-empty muted">Waiting for students to scan the QR code...</div>`;
      } else {
        rosterEl.innerHTML = snap.players.map(p => `
          <div class="arena-chip" style="--hc:${ALCH_HOUSE_COLORS[p.h] || "#38bdf8"}">
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
          <div class="ahc-row" style="--hc:${ALCH_HOUSE_COLORS[h]}">
            <span>${h}</span>
            <div class="ahc-bar"><i style="width:${pct}%"></i></div>
            <b>${fmt(sc)} pts</b>
          </div>
        `;
      }).join("");
    }
  },

  exportClassCsv(players, room, mode = "Collocation Alchemy") {
    if (!players || !players.length) { toast("No student scores to export yet."); return; }
    const sorted = [...players].sort((a, b) => (b.s || 0) - (a.s || 0));
    const rows = [
      ["Rank", "Student Name", "Class", "House", "Score", "Collocations Forged", "Finished", "Mode", "Room Code", "Timestamp"]
    ];
    sorted.forEach((p, idx) => {
      const cleanName = (p.n || "").replace(/\s*\([^)]*\)/g, "").trim();
      const cls = ((p.n || "").match(/\(([4-6][A-E])\)/i) || [])[1]?.toUpperCase() || "";
      rows.push([
        idx + 1,
        cleanName || p.n,
        cls,
        p.h || "",
        p.s || 0,
        p.c || 0,
        p.d ? "Yes" : "No",
        mode,
        room,
        new Date().toLocaleString()
      ]);
    });
    const csvContent = "\uFEFF" + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `HPCCSS_${mode.replace(/\s+/g, "_")}_Room_${room}_Results.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast("📥 Class results downloaded as Excel (.csv)!", true);
  },

  emailClassResults(players, room, mode = "Collocation Alchemy") {
    if (!players || !players.length) { toast("No student scores to email yet."); return; }
    const sorted = [...players].sort((a, b) => (b.s || 0) - (a.s || 0));
    const dateStr = new Date().toLocaleDateString();
    const subject = encodeURIComponent(`HPCCSS LexiQuest Class Results — ${mode} (Room ${room} · ${dateStr})`);
    let body = `HPCCSS LexiQuest — Class Battle Summary\n`;
    body += `Game Mode: ${mode}\nRoom Code: ${room}\nDate: ${new Date().toLocaleString()}\nTotal Participants: ${sorted.length}\n\n`;
    body += `RANK | STUDENT NAME | CLASS | HOUSE | SCORE | COLLOCATIONS FORGED\n`;
    body += `--------------------------------------------------------------------\n`;
    sorted.forEach((p, idx) => {
      const cleanName = (p.n || "").replace(/\s*\([^)]*\)/g, "").trim();
      const cls = ((p.n || "").match(/\(([4-6][A-E])\)/i) || [])[1]?.toUpperCase() || "-";
      body += `#${idx + 1} | ${cleanName} | ${cls} | ${p.h || "-"} | ${fmt(p.s || 0)} pts | ${p.c || 0} solved\n`;
    });
    body += `\nGenerated automatically from HPCCSS LexiQuest Class Arena.`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, "_blank");
  },

  copyForGoogleSheets(players) {
    if (!players || !players.length) { toast("No student scores to copy yet."); return; }
    const sorted = [...players].sort((a, b) => (b.s || 0) - (a.s || 0));
    const tsv = ["Rank\tStudent Name\tClass\tHouse\tScore\tCollocations Forged\tFinished"].concat(
      sorted.map((p, idx) => {
        const cleanName = (p.n || "").replace(/\s*\([^)]*\)/g, "").trim();
        const cls = ((p.n || "").match(/\(([4-6][A-E])\)/i) || [])[1]?.toUpperCase() || "";
        return `${idx + 1}\t${cleanName}\t${cls}\t${p.h || ""}\t${p.s || 0}\t${p.c || 0}\t${p.d ? "Yes" : "No"}`;
      })
    ).join("\n");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(tsv).then(() => {
        toast("📋 Copied to clipboard! Open Google Sheets and press Paste (Ctrl+V).", true);
      }).catch(() => {
        const ta = document.createElement("textarea");
        ta.value = tsv;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        toast("📋 Copied to clipboard! Open Google Sheets and press Paste (Ctrl+V).", true);
      });
    }
  },

  buildPodiumHtml(players) {
    const top = [...players].sort((a, b) => (b.s || 0) - (a.s || 0)).slice(0, 3);
    const p1 = top[0], p2 = top[1], p3 = top[2];

    const col = (p, rank, cls, medal) => {
      if (!p) return `<div class="arena-podium-col empty"></div>`;
      return `
        <div class="arena-podium-col ${cls}" style="--hc:${ALCH_HOUSE_COLORS[p.h] || "#fde68a"}">
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

        <div class="duel-fighter-card ready" style="--hc:${ALCH_HOUSE_COLORS[me.house] || "#38bdf8"};margin:16px auto;max-width:280px">
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
          toast("🚀 Teacher launched the battle! 10s per question...");
          this.playMode = "class";
          this.renderStudentLiveQuestion(curSnap);
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
          <div class="duel-player-tag me" style="--hc:${ALCH_HOUSE_COLORS[me.house] || "#38bdf8"}">
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

    // No extra toggle button needed since the sentence is already directly shown in full!
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

    // Record score in local leaderboard & best score
    Store.setBest("alchemy", this.score);
    Store.addLB("alchemy", this.score);
    Store.recordPlay();

    // Award XP (proportional to score)
    const xpAward = Math.max(10, Math.round(this.score / 5));
    Store.addXP(xpAward);

    if (this.score >= 1000) Store.quest("alchemy");
    if (this.solvedCount >= 10) Store.unlock("alchemist");

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

  renderDuelResult() {
    if (this.duelPollTimer) clearInterval(this.duelPollTimer);
    const el = $("#screen-alchemy");
    const me = AlchemyNet.me();
    this._celebratedAlchDuel = false;

    const updateView = async () => {
      let opp = { n: "Rival", s: 0, c: 0, h: "", d: 0 };

      try {
        const res = await AlchemyNet.call("arena_state", { room: this.duel.room });
        const snap = res.arena;
        if (snap && snap.players) {
          const found = snap.players.find(p => p.pid !== me.pid);
          if (found) opp = found;
        }
      } catch {}

      const oppDone = Boolean(opp.d === "1" || opp.d === 1);
      const won = this.score > (opp.s || 0);
      const tied = this.score === (opp.s || 0);

      const myClass = (me.name.match(/\(([4-6][A-E])\)/i) || [])[1]?.toUpperCase() || "";
      const oppClass = (opp.n.match(/\(([4-6][A-E])\)/i) || [])[1]?.toUpperCase() || "";
      const isCrossClass = Boolean(myClass && oppClass && myClass !== oppClass);

      if (isCrossClass && !this._alchDuelCrossGiven) {
        this._alchDuelCrossGiven = true;
        Store.addXP(50);
        toast(`⚔️ Inter-Class Rivalry Bonus: +50 XP for dueling ${oppClass}!`, true);
      }

      const title = oppDone
        ? (won ? "🏆 VICTORY!" : (tied ? "⚖️ A Perfect Tie!" : "💀 Defeated…"))
        : `⏳ ${esc(opp.n)} is brewing live (${fmt(opp.s || 0)} pts)…`;

      el.innerHTML = `
        <div class="card duel-result-podium ${oppDone ? (won ? 'win' : 'lose') : ''}" style="max-width:580px;margin:30px auto;text-align:center">
          <div class="duel-result-banner">${title}</div>
          ${isCrossClass ? `
            <div style="background:rgba(251,191,36,0.14);border:1px solid #fbbf24;color:#fbbf24;font-weight:700;padding:6px 14px;border-radius:8px;margin:8px auto;max-width:440px;font-size:0.88rem">
              ⚔️ Inter-Class Rivalry (${myClass} vs ${oppClass}): +50 Bonus XP Awarded! 🚀
            </div>
          ` : ""}
          <p class="muted">Collocation Alchemy 1v1 Wizards' Duel · Room ${esc(this.duel.room)}</p>

          <div class="duel-podium-row">
            <div class="duel-podium-col ${oppDone && won ? 'top' : ''}">
              <div class="dpc-crown">${oppDone && won ? "👑" : ""}</div>
              <div class="dpc-name">${esc(me.name)} (You)</div>
              <div class="dpc-house">${me.house || "ROGUE"}</div>
              <div class="dpc-bar" style="--hc:${ALCH_HOUSE_COLORS[me.house] || "#38bdf8"}"><i style="height:${Math.min(100, Math.round((this.score / Math.max(1, this.score, opp.s || 0)) * 100))}%"></i></div>
              <div class="dpc-score">${fmt(this.score)}</div>
              <div class="dpc-meta">${this.solvedCount} solved</div>
            </div>
            <div class="duel-podium-col ${oppDone && !won && !tied ? 'top' : ''}">
              <div class="dpc-crown">${oppDone && !won && !tied ? "👑" : ""}</div>
              <div class="dpc-name">${esc(opp.n)}</div>
              <div class="dpc-house">${opp.h || "ROGUE"}</div>
              <div class="dpc-bar" style="--hc:${ALCH_HOUSE_COLORS[opp.h] || "#fda4af"}"><i style="height:${Math.min(100, Math.round(((opp.s || 0) / Math.max(1, this.score, opp.s || 0)) * 100))}%"></i></div>
              <div class="dpc-score">${oppDone || opp.s ? fmt(opp.s || 0) : "—"}</div>
              <div class="dpc-meta">${oppDone ? `${opp.c || 0} solved ✅` : `Playing live (${opp.c || 0} solved)…`}</div>
            </div>
          </div>

          <div style="display:flex;gap:12px;justify-content:center;margin-top:20px">
            <button class="btn primary" id="btn-alch-duel-rematch">⚔️ Rematch</button>
            <button class="btn secondary" id="btn-alch-duel-home">← Mode Select</button>
          </div>
        </div>
      `;

      if (oppDone && won && !this._celebratedAlchDuel) {
        this._celebratedAlchDuel = true;
        Sfx.fanfare();
        Fx.confetti(200);
      }

      $("#btn-alch-duel-rematch").onclick = () => {
        if (this.duelPollTimer) clearInterval(this.duelPollTimer);
        this.createDuel();
      };
      $("#btn-alch-duel-home").onclick = () => {
        if (this.duelPollTimer) clearInterval(this.duelPollTimer);
        this.intro();
      };

      if (oppDone && this.duelPollTimer) {
        clearInterval(this.duelPollTimer);
        this.duelPollTimer = null;
      }
    };

    updateView();
    this.duelPollTimer = setInterval(updateView, 2500);
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

