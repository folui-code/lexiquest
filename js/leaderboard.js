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
    } catch (e) {}
    return "https://script.google.com/macros/s/AKfycbyopBjXA9bDALuzKIGd5NJSMLpqkJNPkBsVnVc9sLT4GMh7SveVum3ZPenaNgR7T9wt/exec";
  })(),

  cache: null,
  lastFetch: 0,
  CACHE_TTL_MS: 20000, // 20 seconds cache

  setApiUrl(url) {
    const clean = (url || "").trim();
    if (clean) {
      localStorage.setItem("hpccss_leaderboard_url", clean);
      this.API_URL = clean;
      this.cache = null;
    }
  },

  async getTopScores(mode = "rush") {
    const url = this.API_URL;
    if (!url) return null;

    const now = Date.now();
    if (this.cache && (now - this.lastFetch < this.CACHE_TTL_MS)) {
      return this.cache[mode] || null;
    }

    try {
      const target = `${url}${url.includes("?") ? "&" : "?"}action=get&mode=${encodeURIComponent(mode)}&_t=${now}`;
      const resp = await fetch(target, { method: "GET", cache: "no-store" });
      if (!resp.ok) return null;
      const data = await resp.json();
      if (data && data.leaderboard) {
        this.cache = data.leaderboard;
        this.lastFetch = now;
        return data.leaderboard[mode] || null;
      }
    } catch (e) {
      console.warn("[Leaderboard] Cloud sync unreachable, using local storage fallback.", e);
    }
    return null;
  },

  async submitScore(mode, score) {
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
          this.cache = data.leaderboard;
          this.lastFetch = Date.now();
          if (typeof App !== "undefined" && App.renderScoreboard) {
            App.renderScoreboard(mode);
          }
        }
      }
    } catch (e) {
      console.warn("[Leaderboard] Error submitting score to Google Sheet:", e);
    }

    // Also push Word Vault & XP progress in background
    await this.syncProfilePush();
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

        // Take higher XP and streak
        if (p.xp && p.xp > Store.d.xp) {
          Store.d.xp = p.xp;
          changed = true;
        }
        if (p.streak && p.streak > Store.d.streak) {
          Store.d.streak = p.streak;
          changed = true;
        }

        // Merge Word Vault mastery data across devices
        if (p.words && typeof p.words === "object") {
          Store.d.words = Store.d.words || {};
          for (const id in p.words) {
            const rw = p.words[id];
            const lw = Store.d.words[id];
            if (!lw) {
              Store.d.words[id] = rw;
              changed = true;
            } else {
              const maxSeen = Math.max(lw.seen || 0, rw.seen || 0);
              const maxReps = Math.max(lw.reps || 0, rw.reps || 0);
              const maxOk = Math.max(lw.ok || 0, rw.ok || 0);
              const maxBad = Math.max(lw.bad || 0, rw.bad || 0);
              const ef = rw.ef || lw.ef || 2.5;
              if (maxSeen > (lw.seen || 0) || maxReps > (lw.reps || 0)) {
                Store.d.words[id] = Object.assign({}, lw, rw, {
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
      for (const id in allWords) {
        if (allWords[id] && allWords[id].seen) {
          activeWords[id] = {
            reps: allWords[id].reps || 0,
            seen: allWords[id].seen || 0,
            ok: allWords[id].ok || 0,
            bad: allWords[id].bad || 0,
            ef: allWords[id].ef || 2.5
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
