/* ===================================================================
   HPCCSS LexiQuest — Live Cloud Leaderboard Connector
   - Synchronizes school-wide Hall of Fame scores via Google Sheets
   - Submits game runs upon completion
   - Caches responses locally to keep game snappy and offline-friendly
   =================================================================== */

const Leaderboard = {
  // Published Google Apps Script Web App URL
  API_URL: localStorage.getItem("hpccss_leaderboard_url") || "",

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
    const url = this.API_URL || localStorage.getItem("hpccss_leaderboard_url");
    if (!url) return null;

    const now = Date.now();
    if (this.cache && (now - this.lastFetch < this.CACHE_TTL_MS)) {
      return this.cache[mode] || null;
    }

    try {
      const target = `${url}${url.includes("?") ? "&" : "?"}action=get&mode=${encodeURIComponent(mode)}&_t=${now}`;
      const resp = await fetch(target, { method: "GET" });
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
    const url = this.API_URL || localStorage.getItem("hpccss_leaderboard_url");
    if (!url) return;

    const auth = (Store && Store.d && Store.d.auth) || {};
    const name = (Store && Store.d && Store.d.name) || auth.name || "Scholar";
    const role = auth.role || "student";
    const emailHash = auth.emailHash || "";

    try {
      const params = new URLSearchParams({
        action: "submit",
        mode: mode,
        name: name,
        score: String(score),
        role: role,
        hash: emailHash
      });

      const target = `${url}${url.includes("?") ? "&" : "?"}${params.toString()}`;
      
      // Fire-and-forget submission via GET to prevent CORS preflight delay
      const resp = await fetch(target, { method: "GET" });
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
  }
};
