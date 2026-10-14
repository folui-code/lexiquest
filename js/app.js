/* ===================================================================
   App shell: home dashboard, daily quests + chest, vault, navigation
   =================================================================== */
const QUESTS = [
  ["rush", "⚡ Score 1,000+ in Cryptic Rush"],
  ["wordle", "🟩 Solve today's Daily Wordle"],
  ["matrix", "🧩 Solve today's Daily Matrix"]
];

const App = {
  async init() {
    Store.load();
    $("#btn-logo").onclick = () => showScreen("home");
    $("#btn-mute").onclick = () => { Store.d.muted = !Store.d.muted; Store.save(); this.renderTop(); Sfx.click(); };
    $("#btn-user").onclick = () => {
      const a = Store.d.auth;
      if (!a) return Auth.renderAuthModal();
      modal(`
        <div style="text-align:center;padding:12px 6px">
          <div style="font-size:3rem">🎓</div>
          <h2 style="margin:8px 0 4px">${esc(Store.d.name)}</h2>
          <p class="muted" style="font-size:0.88rem;margin-bottom:16px">Role: <b style="color:var(--cyan)">${esc((a.role || "student").toUpperCase())}</b> (${esc(a.domain)})</p>
          <div style="display:flex;gap:10px;justify-content:center">
            <button class="btn small" id="btn-modal-logout" style="border-color:var(--red);color:#fca5a5">🚪 Switch / Logout</button>
            <button class="btn small primary" id="btn-modal-close-acc">Back</button>
          </div>
        </div>
      `);
      $("#btn-modal-logout").onclick = () => Auth.logout();
      $("#btn-modal-close-acc").onclick = closeModal;
    };
    $("#mode-rush").onclick = () => { Sfx.click(); Rush.intro(); };
    $("#mode-wordle").onclick = () => { Sfx.click(); Wordle.intro(); };
    $("#mode-matrix").onclick = () => { Sfx.click(); Matrix.intro(); };
    $("#btn-vault").onclick = () => this.vault();
    $("#btn-chest").onclick = () => this.openChest();
    $("#player-name").onclick = () => Auth.renderAuthModal();
    this.renderHome();

    // Enforce HPCCSS authentication and whitelist check
    await Auth.checkAuth();
  },

  askName() {
    modal(`<h2>👋 Welcome to <span class="grad-text">LexiQuest</span></h2>
      <p>Master <b>${VOCAB.length} academic words &amp; expressions</b> across three game modes. Play every day to keep your 🔥 streak alive!</p>
      <form id="name-form" onsubmit="return false;" style="margin-top:14px">
        <label for="name-input" class="muted" style="display:block;margin-bottom:6px;font-size:0.85rem">Enter your name or nickname:</label>
        <input id="name-input" maxlength="16" placeholder="e.g. Alex, Chris (or leave blank for Scholar)" value="${esc(Store.d.name || '')}" autocomplete="name" />
        <div class="modal-actions">
          <button type="submit" class="btn primary" id="name-go">Let's go →</button>
          <button type="button" class="btn secondary" id="name-skip">Play as Guest</button>
        </div>
      </form>`);

    const saveAndProceed = (nameVal) => {
      const v = (nameVal || "").trim() || Store.d.name || "Scholar";
      Store.d.name = v;
      Store.save();
      closeModal();
      this.renderHome();
      toast(`✨ Welcome, <b>${esc(v)}</b>! Choose a mode below.`);
      Sfx.levelup();
    };

    const form = $("#name-form");
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        saveAndProceed($("#name-input").value);
      };
    }
    const skipBtn = $("#name-skip");
    if (skipBtn) {
      skipBtn.onclick = () => saveAndProceed("Scholar");
    }

    const input = $("#name-input");
    if (input) {
      setTimeout(() => {
        input.focus();
        input.select();
      }, 80);
    }
  },

  renderTop() {
    const s = Store.liveStreak(), r = Store.rank();
    $("#streak-count").textContent = s;
    $("#streak-pill").classList.toggle("cold", Store.d.lastPlay !== todayKey());
    $("#streak-pill").classList.toggle("hot", Store.d.lastPlay === todayKey() && s >= 3);
    $("#streak-pill").title = `Daily streak · 🧊 ${Store.d.freezes} freeze(s)`;
    $("#rank-name").textContent = `${r.name} · ${fmt(Store.d.xp)} XP`;
    $("#xp-fill").style.width = r.pct + "%";
    $("#btn-mute").textContent = Store.d.muted ? "🔇" : "🔊";
  },

  renderHome() {
    this.renderTop();
    const d = Store.d, s = Store.liveStreak();
    $("#player-name").textContent = d.name || "Scholar";
    const msg = $("#streak-msg");
    if (Store.streakAtRisk()) { msg.className = "streak-msg risk"; msg.textContent = `⚠️ Your ${d.streak}-day streak ends at midnight! Play one game to keep it alive.`; }
    else if (d.lastPlay === todayKey()) { msg.className = "streak-msg"; msg.textContent = `🔥 ${s}-day streak secured for today. Keep the fire burning!`; }
    else { msg.className = "streak-msg"; msg.textContent = d.games ? "Your streak went cold. Start a fresh one today! 💪" : "Play your first game to start a daily streak 🔥"; }

    // daily quests
    const q = d.daily.q;
    $("#daily-list").innerHTML = QUESTS.map(([k, label]) => `<div class="quest ${q[k] ? "done" : ""}" id="quest-${k}"><div class="check">${q[k] ? "✓" : ""}</div><div><p>${label}</p><small>${q[k] ? "Completed" : "+ chest progress"}</small></div></div>`).join("");
    const allDone = QUESTS.every(([k]) => q[k]);
    const chest = $("#btn-chest");
    chest.disabled = !allDone || d.daily.chest;
    chest.querySelector("span").textContent = d.daily.chest ? "Chest opened. New quests tomorrow!" : allDone ? "Open your reward chest!" : `Complete all quests to open the chest (${QUESTS.filter(([k]) => q[k]).length}/3)`;
    const now = new Date(), mid = new Date(now); mid.setHours(24, 0, 0, 0);
    const h = Math.floor((mid - now) / 3600000), m = Math.floor(((mid - now) % 3600000) / 60000);
    $("#daily-reset").textContent = `Resets in ${h}h ${m}m`;

    // bests
    $("#best-rush").textContent = `Best ${fmt(d.best.rush || 0)}`;
    $("#best-wordle").textContent = d.daily.wordle ? (d.daily.wordle.won ? "Daily ✓" : "Daily ✗") : "Daily Ready!";
    $("#best-matrix").textContent = d.daily.matrix ? (d.daily.matrix.won ? "Daily ✓" : "Daily ✗") : "Daily ready!";

    // vault progress (≥3★ = mastered)
    const mastered = VOCAB.filter((c) => Store.mastery(c.id) >= 3).length;
    $("#vault-fill").style.width = (mastered / VOCAB.length) * 100 + "%";
    $("#vault-text").textContent = `${mastered} / ${VOCAB.length} mastered`;

    // achievements
    const keys = Object.keys(ACHIEVEMENTS);
    $("#ach-count").textContent = `${keys.filter((k) => d.ach[k]).length}/${keys.length}`;
    $("#ach-grid").innerHTML = keys.map((k) => { const [ic, n, desc] = ACHIEVEMENTS[k]; return `<div class="ach ${d.ach[k] ? "on" : ""}" title="${n}: ${desc}">${ic}</div>`; }).join("");

    // render pinned arena scoreboard
    this.renderScoreboard(this.currentSbTab || "rush");
  },

  renderScoreboard(mode = "rush") {
    this.currentSbTab = mode;
    const tabs = $$("#sb-tabs .sb-tab");
    tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === mode));

    // Event listener binding for tabs
    tabs.forEach(t => {
      t.onclick = () => {
        Sfx.click();
        this.renderScoreboard(t.dataset.tab);
      };
    });

    const listEl = $("#sb-list");
    if (!listEl) return;

    let rows = Store.d.lb && Store.d.lb[mode] ? [...Store.d.lb[mode]] : [];

    // Fallback seed demo records if leaderboard has few entries yet
    const defaults = {
      rush: [
        { n: "Alex W. (S5D)", s: 3420 },
        { n: "Chloe C. (S6A)", s: 2890 },
        { n: "Marcus T. (S4B)", s: 2340 },
        { n: "Kelly L. (S5C)", s: 1950 },
        { n: "HPCCSS Scholar", s: 1400 }
      ],
      wordle: [
        { n: "Kelly L. (S5C)", s: 700 },
        { n: "Marcus T. (S4B)", s: 600 },
        { n: "Alex W. (S5D)", s: 500 },
        { n: "Chloe C. (S6A)", s: 500 }
      ],
      matrix: [
        { n: "Chloe C. (S6A)", s: 1000 },
        { n: "Kelly L. (S5C)", s: 850 },
        { n: "Alex W. (S5D)", s: 700 }
      ]
    };

    if (rows.length === 0) {
      rows = defaults[mode] || [];
    }

    // Sort descending by score
    rows.sort((a, b) => b.s - a.s);

    const userName = (Store.d.name || "").toLowerCase().trim();

    listEl.innerHTML = rows.slice(0, 8).map((entry, idx) => {
      const rank = idx + 1;
      const rankClass = rank === 1 ? "rank-1" : rank === 2 ? "rank-2" : rank === 3 ? "rank-3" : "";
      const isUser = userName && entry.n.toLowerCase().includes(userName);
      const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;

      return `
        <div class="scoreboard-row ${rankClass} ${isUser ? "is-user" : ""}">
          <div class="sb-player-info">
            <span class="sb-rank-badge">${medal}</span>
            <span class="sb-player-name">${esc(entry.n)} ${isUser ? '<span style="color:var(--cyan);font-size:0.75rem">(You)</span>' : ''}</span>
          </div>
          <div class="sb-score-val">${fmt(entry.s)} <span style="font-size:0.75rem;color:var(--muted);font-weight:500">pts</span></div>
        </div>
      `;
    }).join("");
  },

  openChest() {
    if (Store.d.daily.chest) return;
    const xp = [100, 150, 150, 200, 250, 400][Math.floor(Math.random() * 6)]; // variable reward
    Store.d.daily.chest = true; Store.save(); Store.addXP(xp);
    Sfx.fanfare(); Fx.confetti(250);
    modal(`<div style="text-align:center"><div style="font-size:4rem">🎁</div><h2>Daily Chest!</h2>
      <p style="font-family:var(--font-n);font-size:2.4rem;font-weight:700" class="grad-text">+${xp} XP</p>
      <p>${xp >= 400 ? "🌟 JACKPOT! Legendary roll!" : "Nice haul. Come back tomorrow for another chest."}</p>
      <button class="btn primary" id="chest-ok">Awesome</button></div>`);
    $("#chest-ok").onclick = () => { closeModal(); this.renderHome(); };
  },

  vault(filter = "all") {
    const el = $("#screen-vault");
    const list = VOCAB.filter((c) => { const m = Store.mastery(c.id); return filter === "all" || (filter === "weak" && m > 0 && m < 3) || (filter === "new" && m === 0) || (filter === "mastered" && m >= 3); });
    el.innerHTML = `<button class="back-btn" id="vault-back">← Home</button>
      <div class="vault-head"><div><h1>📚 Word Vault</h1><p class="muted">Tap any word to study its card. ★ = mastery level.</p></div>
      <div class="vault-filter">${["all", "new", "weak", "mastered"].map((f) => `<button class="btn small ${f === filter ? "on" : ""}" id="vf-${f}" data-f="${f}">${f[0].toUpperCase() + f.slice(1)}</button>`).join("")}</div></div>
      <div class="vault-grid">${list.map((c) => `<button class="vword" id="vw-${c.id}" data-id="${c.id}"><b>${esc(c.word)}</b><small>${esc(c.pos)}</small>${stars(c.id)}</button>`).join("") || `<p class="muted">Nothing here yet. Go play!</p>`}</div>`;
    $("#vault-back").onclick = () => showScreen("home");
    $$(".vault-filter [data-f]").forEach((b) => (b.onclick = () => this.vault(b.dataset.f)));
    $$(".vword").forEach((b) => (b.onclick = () => showWord(VOCAB[+b.dataset.id])));
    if (!$("#screen-vault").classList.contains("active")) showScreen("vault");
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
