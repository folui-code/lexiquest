/* ===================================================================
   App shell: home dashboard, daily quests + chest, vault, navigation
   =================================================================== */
const QUESTS = [
  ["rush", "⚡ Score 1,000+ in Cryptic Rush"],
  ["wordle", "🟩 Solve today's Daily Wordle"],
  ["matrix", "🧩 Solve today's Daily Matrix"]
];

const HOUSE_DATA = {
  TAK: {
    key: "TAK",
    name: "TAK",
    role: "DUELIST",
    mascot: "Phoenix",
    color: "#e11d48",
    badge: "🔴 TAK · Duelist",
    crest: "🦅",
    desc: "Masters of lightning reflexes and vocabulary duels"
  },
  CHI: {
    key: "CHI",
    name: "CHI",
    role: "ALCHEMIST",
    mascot: "Baize",
    color: "#10b981",
    badge: "🟢 CHI · Alchemist",
    crest: "🐐",
    desc: "Alchemists of word morphology and semantic formulas"
  },
  KIN: {
    key: "KIN",
    name: "KIN",
    role: "CARETAKER",
    mascot: "Qilin",
    color: "#f59e0b",
    badge: "🟡 KIN · Caretaker",
    crest: "🦄",
    desc: "Caretakers of ancient botanical lore and wisdom"
  },
  KAN: {
    key: "KAN",
    name: "KAN",
    role: "SCHOLAR",
    mascot: "Eagle-Fish",
    color: "#3b82f6",
    badge: "🔵 KAN · Scholar",
    crest: "🐟",
    desc: "Scholars of profound syntax and illuminated manuscripts"
  }
};

const App = {
  async init() {
    Store.load();
    $("#btn-logo").onclick = () => showScreen("home");
    $("#btn-mute").onclick = () => { Store.d.muted = !Store.d.muted; Store.save(); this.renderTop(); Sfx.click(); };
    $("#btn-user").onclick = () => this.showAccountModal();
    $("#player-name").onclick = () => this.showAccountModal();
    $("#mode-rush").onclick = () => { Sfx.click(); Rush.intro(); };
    $("#mode-wordle").onclick = () => { Sfx.click(); Wordle.intro(); };
    $("#mode-matrix").onclick = () => { Sfx.click(); Matrix.intro(); };
    const blitzModeBtn = $("#mode-blitz");
    if (blitzModeBtn) {
      blitzModeBtn.onclick = () => { Sfx.click(); Blitz.intro(); };
    }
    const topVaultBtn = $("#btn-top-vault");
    if (topVaultBtn) {
      topVaultBtn.onclick = () => this.vault();
    }
    $("#btn-vault").onclick = () => this.vault();
    $("#btn-chest").onclick = () => this.openChest();

    // House stage column click inspection
    ["tak", "chi", "kin", "kan"].forEach(h => {
      const el = $(`#house-col-${h}`);
      if (el) {
        el.onclick = () => {
          const info = HOUSE_DATA[h.toUpperCase()];
          if (info) {
            Sfx.click();
            const myHouse = (Store.d.house || (Store.d.auth && Store.d.auth.house) || "").toUpperCase();
            const isMine = (myHouse === h.toUpperCase());
            toast(`🏰 <b>House ${info.name}</b> · ${info.role} (Mascot: ${info.mascot}) ${isMine ? "— <b>★ Your Assigned House!</b>" : ""}<br><small>${info.desc}</small>`);
          }
        };
      }
    });

    this.renderHome();

    // Enforce HPCCSS authentication and whitelist check
    await Auth.checkAuth();
  },

  showAccountModal() {
    const a = Store.d.auth;
    if (!a) return Auth.renderAuthModal();
    const hash = a.emailHash || "";
    const officialName = (typeof window !== "undefined" && window.HPCCSS_ROSTER && window.HPCCSS_ROSTER[hash]) || Store.d.name || a.name || "Scholar";
    const myHouse = (Store.d.house || (a && a.house) || "").toUpperCase();
    const hInfo = HOUSE_DATA[myHouse];
    modal(`
      <div style="text-align:center;padding:12px 6px">
        <div style="font-size:3rem">🎓</div>
        <h2 style="margin:8px 0 4px">${esc(officialName)}</h2>
        <div style="display:inline-block;padding:3px 10px;border-radius:12px;background:rgba(56,189,248,0.15);border:1px solid var(--cyan);color:var(--cyan);font-size:0.78rem;font-weight:700;margin-bottom:8px">
          ✅ OFFICIAL HPCCSS ACCOUNT (${esc((a.role || "student").toUpperCase())})
        </div>
        ${hInfo ? `
          <div style="display:block;margin-bottom:12px">
            <span style="display:inline-block;padding:4px 14px;border-radius:12px;background:${hInfo.color}22;border:1px solid ${hInfo.color}88;color:${hInfo.color};font-size:0.85rem;font-weight:700">
              🏰 Assigned House: <b>${hInfo.name}</b> · ${hInfo.role} (${hInfo.mascot})
            </span>
          </div>
        ` : ""}
        <p class="muted" style="font-size:0.85rem;line-height:1.4;margin-bottom:16px;text-align:left;background:rgba(255,255,255,0.03);padding:10px 12px;border-radius:8px;border:1px solid var(--line)">
          🔒 <b>Display Name Locked:</b> Names and House assignments are strictly bound to your official school roster to ensure consistent records and verified school leaderboards across all your devices.
        </p>

        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px">
          <button class="btn primary" id="btn-modal-sync" style="font-size:0.9rem;padding:10px 16px">🔄 Sync Cloud Data Now (Phone &amp; Mac)</button>
          <div style="display:flex;gap:10px;justify-content:center">
            <button class="btn small" id="btn-modal-logout" style="border-color:var(--red);color:#fca5a5">🚪 Switch / Logout</button>
            <button class="btn small secondary" id="btn-modal-close-acc">Close</button>
          </div>
        </div>

        ${a.role === "staff" ? `
        <div style="margin-top:14px;padding-top:12px;border-top:1px dashed var(--line);text-align:left">
          <details style="font-size:0.8rem;color:var(--muted)">
            <summary style="color:var(--gold);cursor:pointer;font-weight:600">⚙️ Teacher / Admin Settings: Cloud Backend URL</summary>
            <div style="margin-top:8px">
              <p style="margin-bottom:6px">Default is your school Google Sheet Web App. Only modify if updating deployments:</p>
              <div style="display:flex;gap:6px">
                <input id="input-lb-url" type="text" placeholder="https://script.google.com/macros/s/.../exec" value="${esc(localStorage.getItem("hpccss_leaderboard_url") || Leaderboard.API_URL || "")}" style="flex:1;font-size:0.75rem;padding:6px 10px;margin:0" />
                <button class="btn secondary" id="btn-save-lb-url" style="padding:6px 12px;font-size:0.8rem">Save</button>
              </div>
            </div>
          </details>
        </div>` : ""}
      </div>
    `);

    const syncBtn = $("#btn-modal-sync");
    if (syncBtn) {
      syncBtn.onclick = async () => {
        syncBtn.textContent = "⏳ Syncing...";
        syncBtn.disabled = true;
        if (typeof Leaderboard !== "undefined") {
          if (Store.d.xp > 0 || Object.keys(Store.d.words || {}).length > 0) {
            await Leaderboard.syncProfilePush();
          }
          await Leaderboard.syncProfilePull();
        }
        syncBtn.textContent = "✅ Synced!";
        toast("✅ Progress synced with Google Cloud!");
        setTimeout(() => {
          closeModal();
          this.renderHome();
        }, 600);
      };
    }
    $("#btn-modal-logout").onclick = () => Auth.logout();
    $("#btn-modal-close-acc").onclick = closeModal;
    const saveLbBtn = $("#btn-save-lb-url");
    if (saveLbBtn) {
      saveLbBtn.onclick = () => {
        const val = ($("#input-lb-url").value || "").trim();
        Leaderboard.setApiUrl(val);
        toast("✅ Leaderboard Web App URL saved!");
        this.renderScoreboard(this.currentSbTab || "rush");
      };
    }
  },

  askName() {
    // Prohibited: Custom nicknames are disabled. Official school names are locked.
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

    const housePill = $("#house-pill");
    if (housePill) {
      const houseKey = (Store.d.house || (Store.d.auth && Store.d.auth.house) || "").toUpperCase();
      const hInfo = HOUSE_DATA[houseKey];
      if (hInfo) {
        housePill.className = `pill house-pill ${houseKey.toLowerCase()}`;
        housePill.textContent = hInfo.badge;
        housePill.title = `Your House: ${hInfo.name} — ${hInfo.role} (${hInfo.mascot})\nClick to view Great Hall`;
        housePill.classList.remove("hidden");
        housePill.onclick = () => {
          const stage = $("#great-hall-stage");
          if (stage) stage.scrollIntoView({ behavior: "smooth" });
        };
      } else {
        housePill.classList.add("hidden");
      }
    }
  },

  renderHome() {
    this.renderTop();
    const d = Store.d, s = Store.liveStreak();
    $("#player-name").textContent = d.name || "Scholar";
    const msg = $("#streak-msg");
    if (Store.streakAtRisk()) { msg.className = "streak-msg risk"; msg.textContent = `⚠️ Your ${d.streak}-day streak ends at midnight! Play one game to keep it alive.`; }
    else if (d.lastPlay === todayKey()) { msg.className = "streak-msg"; msg.textContent = `🔥 ${s}-day streak secured for today. Keep the fire burning!`; }
    else { msg.className = "streak-msg"; msg.textContent = d.games ? "Your streak went cold. Start a fresh one today! 💪" : "Play your first game to start a daily streak 🔥"; }

    // Great Hall welcome text & House status
    const houseKey = (Store.d.house || (Store.d.auth && Store.d.auth.house) || "").toUpperCase();
    const hInfo = HOUSE_DATA[houseKey];
    const houseMsg = $("#house-greeting-msg");
    if (houseMsg) {
      if (hInfo) {
        houseMsg.innerHTML = `Assigned to House <b>${hInfo.name}</b> (✦ ${hInfo.role} · Mascot: ${hInfo.mascot} ✦)`;
      } else {
        houseMsg.innerHTML = `HPCCSS Academy of Wizardry · Four Houses Arena`;
      }
    }

    // Highlight student's assigned house on the master Great Hall stage
    ["tak", "chi", "kin", "kan"].forEach(h => {
      const col = $(`#house-col-${h}`);
      if (col) {
        const isMine = (houseKey.toLowerCase() === h);
        col.classList.toggle("my-house", isMine);
        col.classList.toggle(h, isMine);
        const badge = col.querySelector(".house-my-badge");
        if (badge) badge.classList.toggle("hidden", !isMine);
      }
    });

    // Render House Cup Standings
    this.renderHouseCup();

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
    const bestBlitzEl = $("#best-blitz");
    if (bestBlitzEl) {
      const blitzBests = (d.best && d.best.blitz) ? Object.values(d.best.blitz) : [];
      const topBlitz = blitzBests.length ? Math.max(...blitzBests) : 0;
      bestBlitzEl.textContent = topBlitz > 0 ? `Best ${fmt(topBlitz)}` : "Play Now";
    }

    // vault progress (≥3★ = mastered, 1-2★ = learning, 0★ = unseen)
    const mastered = VOCAB.filter((c) => Store.mastery(c.id) >= 3).length;
    const learning = VOCAB.filter((c) => Store.mastery(c.id) > 0 && Store.mastery(c.id) < 3).length;
    const unseen = Math.max(0, VOCAB.length - mastered - learning);

    $("#vault-fill").style.width = (mastered / VOCAB.length) * 100 + "%";
    $("#vault-text").textContent = `${mastered} / ${VOCAB.length} Mastered`;

    const countMasteredEl = $("#vault-count-mastered");
    if (countMasteredEl) countMasteredEl.textContent = mastered;
    const countWeakEl = $("#vault-count-weak");
    if (countWeakEl) countWeakEl.textContent = learning;
    const countNewEl = $("#vault-count-new");
    if (countNewEl) countNewEl.textContent = unseen;

    // achievements
    const keys = Object.keys(ACHIEVEMENTS);
    $("#ach-count").textContent = `${keys.filter((k) => d.ach[k]).length}/${keys.length}`;
    $("#ach-grid").innerHTML = keys.map((k) => { const [ic, n, desc] = ACHIEVEMENTS[k]; return `<div class="ach ${d.ach[k] ? "on" : ""}" title="${n}: ${desc}">${ic}</div>`; }).join("");

    // render pinned arena scoreboard
    this.renderScoreboard(this.currentSbTab || "rush");
  },

  renderHouseCup() {
    const d = Store.d;
    const myHouse = (d.house || (d.auth && d.auth.house) || "").toUpperCase();

    // Baseline house points + live player XP
    const basePoints = {
      TAK: 14250,
      CHI: 13920,
      KIN: 14680,
      KAN: 14100
    };

    if (myHouse && basePoints[myHouse] !== undefined) {
      basePoints[myHouse] += (d.xp || 0);
    }

    const totalXP = Object.values(basePoints).reduce((a, b) => a + b, 0);

    // Update multi-segment progress bar
    ["tak", "chi", "kin", "kan"].forEach(h => {
      const seg = $(`#hcup-bar-${h}`);
      if (seg) {
        const pct = ((basePoints[h.toUpperCase()] / totalXP) * 100).toFixed(1);
        seg.style.width = pct + "%";
        seg.title = `House ${h.toUpperCase()}: ${fmt(basePoints[h.toUpperCase()])} XP (${pct}%)`;
      }
    });

    // Sort houses for rank cards
    const sorted = Object.keys(basePoints)
      .map(k => ({ key: k, xp: basePoints[k], ...HOUSE_DATA[k] }))
      .sort((a, b) => b.xp - a.xp);

    const leaderBadge = $("#house-cup-leader-badge");
    if (leaderBadge && sorted.length > 0) {
      leaderBadge.textContent = `👑 Current Leader: House ${sorted[0].name} (${fmt(sorted[0].xp)} XP)`;
    }

    const rankClasses = ["gold", "silver", "bronze", ""];
    const grid = $("#house-cup-grid");
    if (grid) {
      grid.innerHTML = sorted.map((h, idx) => {
        const isMine = (myHouse === h.key);
        const rankNum = idx + 1;
        const rankCls = rankClasses[idx] || "";
        return `
          <div class="hcup-item ${isMine ? "my-house" : ""}" data-house="${h.key}">
            <div class="hcup-rank ${rankCls}">#${rankNum}</div>
            <div class="hcup-crest ${h.key.toLowerCase()}">${h.crest || "🛡️"}</div>
            <div class="hcup-info">
              <div class="hcup-name-row">
                <span class="hcup-house-name" style="color:${h.color}">House ${h.name}</span>
                <span class="hcup-xp">${fmt(h.xp)} XP</span>
              </div>
              <div class="hcup-role">✦ ${h.role} · ${h.mascot}</div>
            </div>
          </div>
        `;
      }).join("");

      // Clicking house card shows info
      $$(".hcup-item", grid).forEach(item => {
        item.onclick = () => {
          const hk = item.dataset.house;
          const info = HOUSE_DATA[hk];
          if (info) {
            Sfx.click();
            toast(`🏰 <b>House ${info.name}</b> (${info.badge})<br><small>${info.desc}</small>`);
          }
        };
      });
    }
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

    const renderList = (rows) => {
      const sorted = [...rows].sort((a, b) => b.s - a.s);
      const userName = (Store.d.name || "").toLowerCase().trim();

      listEl.innerHTML = sorted.slice(0, 8).map((entry, idx) => {
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
    };

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
      blitz: [
        { n: "Marcus T. (S4B)", s: 3850 },
        { n: "Alex W. (S5D)", s: 3400 },
        { n: "Chloe C. (S6A)", s: 3120 },
        { n: "Kelly L. (S5C)", s: 2750 },
        { n: "HPCCSS Scholar", s: 2100 }
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

    renderList(rows);

    // Fetch live scores from Google Sheets if configured
    if (typeof Leaderboard !== "undefined" && Leaderboard.getTopScores) {
      Leaderboard.getTopScores(mode).then((cloudRows) => {
        if (cloudRows && cloudRows.length > 0 && this.currentSbTab === mode) {
          renderList(cloudRows);
        }
      });
    }
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

  vault(filter = "all", setFilter = "all") {
    if (typeof Leaderboard !== "undefined" && Leaderboard.syncProfilePull) {
      Leaderboard.syncProfilePull();
    }
    const el = $("#screen-vault");

    // Extract available sets
    const availableSets = [];
    const setMap = new Map();
    (window.VOCAB || []).forEach(c => {
      const key = c.topic || (c.set ? `Set ${c.set}` : "General");
      if (!setMap.has(key)) {
        setMap.set(key, 0);
        availableSets.push(key);
      }
      setMap.set(key, setMap.get(key) + 1);
    });

    const list = (window.VOCAB || []).filter((c) => {
      const m = Store.mastery(c.id);
      const matchesMastery = filter === "all" || (filter === "weak" && m > 0 && m < 3) || (filter === "new" && m === 0) || (filter === "mastered" && m >= 3);
      const cardSetKey = c.topic || (c.set ? `Set ${c.set}` : "General");
      const matchesSet = setFilter === "all" || cardSetKey === setFilter;
      return matchesMastery && matchesSet;
    });

    el.innerHTML = `<button class="back-btn" id="vault-back">← Home</button>
      <div class="vault-head">
        <div>
          <h1>📚 Word Vault</h1>
          <p class="muted">Tap any word to study its card. ★ = mastery level.</p>
        </div>
        <div style="display:flex;gap:10px;align-items:flex-end;flex-direction:column">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end">
            <button class="btn small" id="vault-sync-btn" title="Sync with Google Cloud" style="font-size:0.75rem;padding:6px 12px;border-color:var(--cyan);color:var(--cyan)">🔄 Cloud Sync</button>
            <div class="vault-filter">${["all", "new", "weak", "mastered"].map((f) => `<button class="btn small ${f === filter ? "on" : ""}" id="vf-${f}" data-f="${f}">${f[0].toUpperCase() + f.slice(1)}</button>`).join("")}</div>
          </div>
          ${availableSets.length > 1 ? `
            <div class="vault-set-filter" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">
              <button class="btn small ${setFilter === 'all' ? 'on' : ''}" data-sf="all" style="font-size:0.75rem;padding:4px 10px">All Sets (${(window.VOCAB || []).length})</button>
              ${availableSets.map(s => `
                <button class="btn small ${setFilter === s ? 'on' : ''}" data-sf="${esc(s)}" style="font-size:0.75rem;padding:4px 10px">${esc(s)} (${setMap.get(s)})</button>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
      <div class="vault-grid">${list.map((c) => `<button class="vword" id="vw-${c.id}" data-id="${c.id}"><b>${esc(c.word)}</b><small>${esc(c.pos)}${c.topic ? ` · ${esc(c.topic)}` : ''}</small>${stars(c.id)}</button>`).join("") || `<p class="muted">No words matching this filter.</p>`}</div>`;
    $("#vault-back").onclick = () => showScreen("home");
    const syncBtn = $("#vault-sync-btn");
    if (syncBtn) {
      syncBtn.onclick = async () => {
        syncBtn.textContent = "⏳ Syncing...";
        syncBtn.disabled = true;
        if (typeof Leaderboard !== "undefined") {
          if (Store.d.xp > 0 || Object.keys(Store.d.words || {}).length > 0) {
            await Leaderboard.syncProfilePush();
          }
          await Leaderboard.syncProfilePull();
        }
        syncBtn.textContent = "🔄 Cloud Sync";
        syncBtn.disabled = false;
        toast("✅ Word Vault synced with Google Cloud!");
        this.vault(filter, setFilter);
      };
    }
    $$(".vault-filter [data-f]").forEach((b) => (b.onclick = () => this.vault(b.dataset.f, setFilter)));
    $$(".vault-set-filter [data-sf]").forEach((b) => (b.onclick = () => this.vault(filter, b.dataset.sf)));
    $$(".vword").forEach((b) => (b.onclick = () => {
      const id = +b.dataset.id;
      const card = (window.VOCAB || []).find((x) => x.id === id) || (window.VOCAB || [])[id];
      if (card) showWord(card, list);
    }));
    if (!$("#screen-vault").classList.contains("active")) showScreen("vault");
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
