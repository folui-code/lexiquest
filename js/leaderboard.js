/* ===================================================================
   HPCCSS LexiQuest — Live Cloud Leaderboard & Cross-Device Sync Connector
   - Synchronizes school-wide Hall of Fame scores via Google Sheets
   - Automatically saves and restores student Word Vault mastery across devices
   - Caches responses locally to keep game snappy and offline-friendly
   =================================================================== */

const Leaderboard = {
  // Official HPCCSS Google Apps Script Web App URL
  API_URL: (() => {
    try {
      const stored = (localStorage.getItem("hpccss_leaderboard_url") || "").trim();
      if (stored.startsWith("https://script.google.com/")) return stored;
    } catch (e) { }
    return "https://script.google.com/macros/s/AKfycbyopBjXA9bDALuzKIGd5NJSMLpqkJNPkBsVnVc9sLT4GMh7SveVum3ZPenaNgR7T9wt/exec";
  })(),

  cache: null,
  lastFetch: 0,
  CACHE_TTL_MS: 20000, // 20 seconds cache

  // Verified launch student top scores across school arena
  DEFAULT_SCORES: {
    rush: [
      { n: "LEE SHING YU (4D)", s: 5000, role: "student", rank: 1 },
      { n: "TSAI TSZ CHING (4D)", s: 239, role: "student", rank: 2 },
      { n: "LI TSZ YU (4D)", s: 52, role: "student", rank: 3 }
    ],
    alchemy: [
      { n: "LI TSZ YU (4D)", s: 8300, role: "student", rank: 1 },
      { n: "TSAI TSZ CHING (4D)", s: 7200, role: "student", rank: 2 }
    ],
    blitz: [
      { n: "LI TSZ YU (4D)", s: 1550, role: "student", rank: 1 }
    ],
    reading: [
      { n: "LI TSZ YU (4D)", s: 500, role: "student", rank: 1 }
    ]
  },

  setApiUrl(url) {
    const clean = (url || "").trim();
    if (clean) {
      localStorage.setItem("hpccss_leaderboard_url", clean);
      this.API_URL = clean;
      this.cache = null;
    }
  },

  async getTopScores(mode = "rush", force = false) {
    const url = this.API_URL;
    const cleanMode = (mode || "rush").split("_")[0];
    if (!url) return this.DEFAULT_SCORES[cleanMode] || null;

    const now = Date.now();
    if (!force && this.cache && (now - this.lastFetch < this.CACHE_TTL_MS)) {
      const cached = this.cache[cleanMode] || this.cache[mode];
      if (cached && cached.length) return cached;
      return this.DEFAULT_SCORES[cleanMode] || null;
    }

    try {
      const target = `${url}${url.includes("?") ? "&" : "?"}action=get&mode=${encodeURIComponent(cleanMode)}&_t=${now}`;
      const resp = await fetch(target, { method: "GET", cache: "no-store" });
      if (!resp.ok) return this.DEFAULT_SCORES[cleanMode] || null;
      const data = await resp.json();
      if (data && data.leaderboard) {
        // Normalize any seasoned keys (e.g. rush_s1 -> rush) so all modes map cleanly
        const normalized = {};
        Object.keys(data.leaderboard).forEach(k => {
          const cleanK = k.split("_")[0];
          if (!normalized[cleanK]) normalized[cleanK] = [];
          normalized[cleanK].push(...(data.leaderboard[k] || []));
        });
        // Sort each mode descending
        Object.keys(normalized).forEach(k => {
          normalized[k].sort((a, b) => b.s - a.s);
        });

        // Seed with default scores for any mode not yet in cloud return
        this.cache = Object.assign({}, this.DEFAULT_SCORES, data.leaderboard, normalized);
        ["rush", "alchemy", "blitz", "reading"].forEach(m => {
          if (!this.cache[m] || !this.cache[m].length) {
            this.cache[m] = [...(this.DEFAULT_SCORES[m] || [])];
          }
        });
        this.lastFetch = now;

        // Sync real scores to Class Honor Roll and House Cup
        if (typeof App !== "undefined" && App.syncClassHonorRollFromLeaderboard) {
          App.syncClassHonorRollFromLeaderboard(this.cache);
        }

        const out = this.cache[cleanMode] || this.cache[mode];
        return (out && out.length) ? out : (this.DEFAULT_SCORES[cleanMode] || null);
      }
    } catch (e) {
      console.warn("[Leaderboard] Cloud sync unreachable, using local storage fallback.", e);
    }
    return this.DEFAULT_SCORES[cleanMode] || null;
  },

  async submitScore(mode, score) {
    if (mode === "wordle" || mode === "matrix") return;
    if (!score || score <= 0) return;
    const url = this.API_URL;
    if (!url) return;

    const auth = (Store && Store.d && Store.d.auth) || {};
    const rawHash = auth.emailHash || "";
    const emailHash = (typeof window !== "undefined" && window.HPCCSS_CANONICAL_MAP && window.HPCCSS_CANONICAL_MAP[rawHash]) || rawHash;
    const officialName = (typeof window !== "undefined" && window.HPCCSS_ROSTER && window.HPCCSS_ROSTER[emailHash])
      || (Store && Store.d && Store.d.name)
      || auth.name
      || "Scholar";
    const role = auth.role || "student";

    // Also record into local Store.d.lb for instant feedback
    if (Store && Store.d) {
      Store.d.lb = Store.d.lb || {};
      Store.d.lb[mode] = Store.d.lb[mode] || [];
      const cleanName = officialName.replace(/\s*\([^)]*\)/g, "").trim().toUpperCase();
      const existingIdx = Store.d.lb[mode].findIndex(r => r.n && r.n.replace(/\s*\([^)]*\)/g, "").trim().toUpperCase() === cleanName);
      if (existingIdx !== -1) {
        if (score > (Store.d.lb[mode][existingIdx].s || 0)) {
          Store.d.lb[mode][existingIdx].s = score;
        }
      } else {
        Store.d.lb[mode].push({ n: officialName, s: score, role: role });
      }
      Store.d.lb[mode].sort((a, b) => b.s - a.s);
      Store.save();
    }

    try {
      const params = new URLSearchParams({
        action: "submit",
        mode: mode,
        name: officialName,
        score: String(score),
        role: role,
        hash: emailHash
      });

      const target = `${url}${url.includes("?") ? "&" : "?"}${params.toString()}&_t=${Date.now()}`;

      // Fire submission with cache no-store
      const resp = await fetch(target, { method: "GET", cache: "no-store" });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.leaderboard) {
          const normalized = {};
          Object.keys(data.leaderboard).forEach(k => {
            const cleanK = k.split("_")[0];
            if (!normalized[cleanK]) normalized[cleanK] = [];
            normalized[cleanK].push(...(data.leaderboard[k] || []));
          });
          Object.keys(normalized).forEach(k => {
            normalized[k].sort((a, b) => b.s - a.s);
          });

          this.cache = Object.assign({}, this.DEFAULT_SCORES, data.leaderboard, normalized);
          ["rush", "alchemy", "blitz", "reading"].forEach(m => {
            if (!this.cache[m] || !this.cache[m].length) {
              this.cache[m] = [...(this.DEFAULT_SCORES[m] || [])];
            }
          });
          this.lastFetch = Date.now();
          if (typeof App !== "undefined") {
            if (App.renderScoreboard) App.renderScoreboard(mode);
            if (App.syncClassHonorRollFromLeaderboard) App.syncClassHonorRollFromLeaderboard(this.cache);
            if (App.renderHouseCup) App.renderHouseCup();
            if (App.renderWizardProfile) App.renderWizardProfile();
          }
        }
      }
    } catch (e) {
      console.warn("[Leaderboard] Error submitting score to Google Sheet:", e);
    }

    // Also push Word Vault & XP progress in background
    await this.syncProfilePush();
  },

  _pushTimer: null,
  queueProfilePush() {
    if (this._pushTimer) clearTimeout(this._pushTimer);
    this._pushTimer = setTimeout(() => {
      this.syncProfilePush();
    }, 2000);
  },

  // Pull student's cross-device Word Vault & XP record from Google Sheets
  async syncProfilePull() {
    const auth = (Store && Store.d && Store.d.auth) || {};
    const rawHash = auth.emailHash || "";
    if (!rawHash) return;
    const emailHash = (typeof window !== "undefined" && window.HPCCSS_CANONICAL_MAP && window.HPCCSS_CANONICAL_MAP[rawHash]) || rawHash;
    const url = this.API_URL;
    if (!url) return;

    try {
      const target = `${url}${url.includes("?") ? "&" : "?"}action=sync_pull&hash=${encodeURIComponent(emailHash)}&_t=${Date.now()}`;
      const resp = await fetch(target, { method: "GET", cache: "no-store" });
      if (!resp.ok) return;
      const data = await resp.json();
      if (data && data.profile) {
        const p = data.profile;
        let changed = false;

        // Ensure official roster name is enforced locally
        if (typeof window !== "undefined" && window.HPCCSS_ROSTER && window.HPCCSS_ROSTER[emailHash]) {
          const off = window.HPCCSS_ROSTER[emailHash];
          if (Store.d.name !== off) {
            Store.d.name = off;
            changed = true;
          }
        }

        // In the official launch version, sync verified launch student XP from cloud profile
        if (p.xp && p.xp > (Store.d.xp || 0)) {
          Store.d.xp = p.xp;
          changed = true;
        }
        if (p.streak && p.streak > (Store.d.streak || 0)) {
          Store.d.streak = p.streak;
          changed = true;
        }

        // Merge Word Vault mastery data across devices
        if (p.words && typeof p.words === "object") {
          Store.d.words = Store.d.words || {};
          for (const rawId in p.words) {
            const k = (Store && Store.cardKey) ? Store.cardKey(rawId) : rawId;
            const rw = p.words[rawId];
            const lw = Store.d.words[k];
            if (!lw) {
              Store.d.words[k] = rw;
              changed = true;
            } else {
              const maxSeen = Math.max(lw.seen || 0, rw.seen || 0);
              const maxReps = Math.max(lw.reps || 0, rw.reps || 0);
              const maxOk = Math.max(lw.ok || 0, rw.ok || 0);
              const maxBad = Math.max(lw.bad || 0, rw.bad || 0);
              const ef = rw.ef || lw.ef || 2.5;
              if (maxSeen > (lw.seen || 0) || maxReps > (lw.reps || 0)) {
                Store.d.words[k] = Object.assign({}, lw, rw, {
                  seen: maxSeen,
                  reps: maxReps,
                  ok: maxOk,
                  bad: maxBad,
                  ef: ef
                });
                changed = true;
              }
            }
          }
        }

        if (changed) {
          Store.save();
          if (typeof App !== "undefined") {
            if (App.renderTop) App.renderTop();
            if (App.renderHome) App.renderHome();
            if (App.renderClassHonorRoll) App.renderClassHonorRoll();
            if (App.renderHouseCup) App.renderHouseCup();
            if ($("#screen-vault") && $("#screen-vault").classList.contains("active") && App.vault) {
              App.vault();
            }
          }
        }
      } else {
        // Cloud profile not found or empty, but local device has existing progress!
        if (Store.d.xp > 0 || Object.keys(Store.d.words || {}).length > 0) {
          await this.syncProfilePush();
        }
      }
    } catch (e) {
      console.warn("[Leaderboard] Cloud profile pull note:", e);
    }
  },

  // Push student's cross-device Word Vault & XP record to Google Sheets
  async syncProfilePush() {
    const auth = (Store && Store.d && Store.d.auth) || {};
    const rawHash = auth.emailHash || "";
    if (!rawHash) return;
    const emailHash = (typeof window !== "undefined" && window.HPCCSS_CANONICAL_MAP && window.HPCCSS_CANONICAL_MAP[rawHash]) || rawHash;
    const url = this.API_URL;
    if (!url) return;

    try {
      const officialName = (typeof window !== "undefined" && window.HPCCSS_ROSTER && window.HPCCSS_ROSTER[emailHash])
        || (Store && Store.d && Store.d.name)
        || auth.name
        || "Scholar";
      const role = auth.role || "student";
      const xp = Store.d.xp || 0;
      const streak = Store.d.streak || 0;

      // Compact only active words that have been encountered
      const activeWords = {};
      const allWords = Store.d.words || {};
      for (const rawId in allWords) {
        if (allWords[rawId] && allWords[rawId].seen) {
          const k = (Store && Store.cardKey) ? Store.cardKey(rawId) : rawId;
          activeWords[k] = {
            reps: allWords[rawId].reps || 0,
            seen: allWords[rawId].seen || 0,
            ok: allWords[rawId].ok || 0,
            bad: allWords[rawId].bad || 0,
            ef: allWords[rawId].ef || 2.5,
            status: allWords[rawId].status || ""
          };
        }
      }
      const words = JSON.stringify(activeWords);

      const params = new URLSearchParams({
        action: "sync_push",
        hash: emailHash,
        name: officialName,
        role: role,
        xp: String(xp),
        streak: String(streak),
        words: words
      });

      const target = `${url}${url.includes("?") ? "&" : "?"}${params.toString()}&_t=${Date.now()}`;
      await fetch(target, { method: "GET", cache: "no-store" });
    } catch (e) {
      console.warn("[Leaderboard] Cloud profile push note:", e);
    }
  }
};
