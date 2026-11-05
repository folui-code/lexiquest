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

    // vault progress (mastered, familiar, challenging, unseen)
    let mastered = 0, familiar = 0, challenging = 0, unseen = 0;
    (window.VOCAB || []).forEach((c) => {
      const st = Store.getWordStatus ? Store.getWordStatus(c) : "new";
      if (st === "mastered") mastered++;
      else if (st === "familiar") familiar++;
      else if (st === "challenging") challenging++;
      else unseen++;
    });

    const totalV = (window.VOCAB || []).length || 1;
    $("#vault-fill").style.width = ((mastered / totalV) * 100) + "%";
    $("#vault-text").textContent = `${mastered} / ${totalV} Mastered`;

    const countMasteredEl = $("#vault-count-mastered");
    if (countMasteredEl) countMasteredEl.textContent = mastered;
    const countWeakEl = $("#vault-count-weak");
    if (countWeakEl) countWeakEl.textContent = familiar + challenging;
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

  getTomes() {
    const vocab = window.VOCAB || [];

    // Group cards by Set number
    const setGroups = new Map();
    vocab.forEach((c) => {
      let s = String(c.set || "").trim();
      if (!s && c.topic) {
        const m = c.topic.match(/Set\s*(\d+)/i);
        if (m) s = m[1];
      }
      if (!s) s = "1";
      if (!setGroups.has(s)) setGroups.set(s, []);
      setGroups.get(s).push(c);
    });

    const tomes = [];

    // 1. Omni Codex: All 107 Spells Mixed
    let omniM = 0, omniF = 0, omniCh = 0, omniU = 0;
    vocab.forEach((c) => {
      const st = Store.getWordStatus ? Store.getWordStatus(c) : "new";
      if (st === "mastered") omniM++;
      else if (st === "familiar") omniF++;
      else if (st === "challenging") omniCh++;
      else omniU++;
    });

    tomes.push({
      id: "all",
      num: "All Sets",
      title: "All Sets (107 Expressions)",
      subtitle: "Writing 1 Sample, DSE Reading & Feedback Combined",
      lore: "Practice all academic vocabulary across technology, reading comprehension, and writing feedback together.",
      icon: "🌟",
      banner: "All Sets",
      themeClass: "tome-omni",
      cards: vocab,
      total: vocab.length,
      mastered: omniM,
      familiar: omniF,
      challenging: omniCh,
      unseen: omniU,
      pct: vocab.length ? Math.round((omniM / vocab.length) * 100) : 0
    });

    // Explicit curriculum names sticking strictly to Set 1, 2, 3 and user's content
    const themes = {
      "1": {
        num: "Set 1",
        title: "Set 1: Writing 1 Sample (Technology)",
        subtitle: "51 Expressions · Writing 1 Sample",
        lore: "Academic vocabulary from Writing 1 Sample on technology and the modern digital world.",
        icon: "⚡",
        banner: "Set 1 · Technology",
        themeClass: "tome-tak"
      },
      "2": {
        num: "Set 2",
        title: "Set 2: DSE 2013 Reading (Terracotta Army)",
        subtitle: "19 Expressions · DSE Reading",
        lore: "Vocabulary from HKDSE 2013 Reading Paper on the Terracotta Army and ancient heritage.",
        icon: "🏛️",
        banner: "Set 2 · DSE Reading",
        themeClass: "tome-kin"
      },
      "3": {
        num: "Set 3",
        title: "Set 3: Writing 1 Feedback (Travelling)",
        subtitle: "37 Expressions · Writing 1 Feedback",
        lore: "Vocabulary, corrections, and expressions from Writing 1 Feedback on global travel.",
        icon: "🧭",
        banner: "Set 3 · Writing Feedback",
        themeClass: "tome-chi"
      }
    };

    // Sort sets in natural numerical order
    const sortedSets = Array.from(setGroups.keys()).sort((a, b) => {
      const na = parseInt(a, 10), nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });

    sortedSets.forEach((s) => {
      const cards = setGroups.get(s) || [];
      const theme = themes[s] || {
        num: `Set ${s}`,
        title: `Set ${s}: ${cards[0]?.content || cards[0]?.topic || `Set ${s}`}`,
        subtitle: `${cards.length} Expressions`,
        lore: `Academic vocabulary compiled for Set ${s}.`,
        icon: "📜",
        banner: `Set ${s}`,
        themeClass: "tome-kan"
      };

      let m = 0, f = 0, ch = 0, u = 0;
      cards.forEach((c) => {
        const st = Store.getWordStatus ? Store.getWordStatus(c) : "new";
        if (st === "mastered") m++;
        else if (st === "familiar") f++;
        else if (st === "challenging") ch++;
        else u++;
      });

      tomes.push({
        id: `set-${s}`,
        setNumber: s,
        ...theme,
        cards: cards,
        total: cards.length,
        mastered: m,
        familiar: f,
        challenging: ch,
        unseen: u,
        pct: cards.length ? Math.round((m / cards.length) * 100) : 0
      });
    });

    return tomes;
  },

  vault(view = "lobby", tomeId = "all", filter = "all", extra = {}) {
    if (typeof Leaderboard !== "undefined" && Leaderboard.syncProfilePull) {
      Leaderboard.syncProfilePull();
    }
    if (!$("#screen-vault").classList.contains("active")) showScreen("vault");

    if (view === "study") {
      this.vaultStudy(tomeId, filter, extra.cardIdx || 0, extra.deck || null);
    } else if (view === "index") {
      this.vaultIndex(tomeId, filter, extra.search || "");
    } else {
      this.vaultLobby();
    }
  },

  vaultLobby() {
    if (this.activeStudyKeyHandler) {
      window.removeEventListener("keydown", this.activeStudyKeyHandler);
      this.activeStudyKeyHandler = null;
    }
    const tomes = this.getTomes();
    const omni = tomes[0];
    const el = $("#screen-vault");

    el.innerHTML = `
      <div class="vault-lobby">
        <div class="vault-lobby-head">
          <button class="back-btn" id="btn-vault-home">← Great Hall</button>
          <div class="vault-title-group" style="text-align:center;flex:1">
            <h1>⚡ The Sanctum of Arcane Tomes ⚡</h1>
            <p>Curriculum English Vocabulary Grimoires · HPCCSS Academy of Wizardry</p>
          </div>
          <button class="btn small" id="vault-cloud-sync-btn" style="border-color:var(--cyan);color:var(--cyan);padding:8px 14px">
            🔄 Cloud Sync
          </button>
        </div>

        <!-- Overall Academy Mastery Banner -->
        <div class="vault-banner-card">
          <div style="flex:1;min-width:240px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
              <span style="font-size:1.6rem">🌟</span>
              <div>
                <h3 style="font-size:1.15rem;font-weight:800;color:#fef08a;margin:0">Total Academy Spell Mastery</h3>
                <span style="font-size:0.82rem;color:#cbd5e1">Mastery across all curriculum sets &amp; texts</span>
              </div>
            </div>
            <div class="vault-progress-wrap" style="margin-top:8px">
              <div class="vault-progress-bar" style="max-width:none;flex:1"><i style="width:${omni.pct}%"></i></div>
              <span class="vault-progress-text">${omni.mastered} / ${omni.total} Mastered (${omni.pct}%)</span>
            </div>
          </div>
          <div class="vault-banner-stats">
            <div class="banner-stat-chip"><span style="color:#6ee7b7">⚡</span><b>${omni.mastered}</b> Mastered</div>
            <div class="banner-stat-chip"><span style="color:#fde68a">📖</span><b>${omni.familiar}</b> Familiar</div>
            <div class="banner-stat-chip"><span style="color:#fda4af">🔮</span><b>${omni.challenging}</b> Challenging</div>
            <div class="banner-stat-chip"><span style="color:#94a3b8">✨</span><b>${omni.unseen}</b> Unseen</div>
          </div>
        </div>

        <!-- Grimoire Cards Grid -->
        <div class="grimoire-grid">
          ${tomes.map((tome) => `
            <div class="grimoire-card ${tome.themeClass}" id="grimoire-${tome.id}">
              <div>
                <div class="tome-top-badge-row">
                  <span class="tome-roman-badge">${tome.num}</span>
                  <span class="tome-count-badge">📜 ${tome.total} Spells</span>
                </div>
                <div class="tome-header">
                  <span class="tome-seal-icon">${tome.icon}</span>
                  <div class="tome-titles">
                    <h3>${esc(tome.title)}</h3>
                    <p>${esc(tome.subtitle)}</p>
                  </div>
                </div>
                <p class="tome-lore">"${esc(tome.lore)}"</p>
              </div>

              <div>
                <div class="tome-progress-block">
                  <div class="tome-progress-labels">
                    <span style="color:#cbd5e1;font-size:0.78rem">Grimoire Mastery</span>
                    <b>${tome.mastered} / ${tome.total} (${tome.pct}%)</b>
                  </div>
                  <div class="tome-bar"><i style="width:${tome.pct}%"></i></div>
                </div>

                <div class="tome-badges-grid">
                  <span class="vmini-chip"><span style="color:#6ee7b7">⚡</span> ${tome.mastered} Mastered</span>
                  <span class="vmini-chip"><span style="color:#fde68a">📖</span> ${tome.familiar} Familiar</span>
                  <span class="vmini-chip"><span style="color:#fda4af">🔮</span> ${tome.challenging} Drill</span>
                  <span class="vmini-chip"><span style="color:#94a3b8">✨</span> ${tome.unseen} New</span>
                </div>

                <div class="tome-actions">
                  <button class="tome-btn-primary" data-tome-action="study" data-tome="${tome.id}" title="Interactive 3D Spell Flashcard Study">
                    🎴 Revise Spells
                  </button>
                  <button class="tome-btn-secondary" data-tome-action="index" data-tome="${tome.id}" title="Browse all words in this Tome">
                    📜 Spell Index
                  </button>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    $("#btn-vault-home").onclick = () => showScreen("home");

    const syncBtn = $("#vault-cloud-sync-btn");
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
        toast("✅ Sanctum of Tomes synced with Google Cloud!");
        this.vaultLobby();
      };
    }

    $$("[data-tome-action]").forEach((btn) => {
      btn.onclick = () => {
        const act = btn.dataset.tomeAction;
        const tid = btn.dataset.tome;
        if (act === "study") this.vaultStudy(tid);
        else if (act === "index") this.vaultIndex(tid);
      };
    });
  },

  vaultStudy(tomeId = "all", filter = "all", cardIdx = 0, customDeck = null) {
    if (this.activeStudyKeyHandler) {
      window.removeEventListener("keydown", this.activeStudyKeyHandler);
      this.activeStudyKeyHandler = null;
    }

    const tomes = this.getTomes();
    const tome = tomes.find((t) => t.id === tomeId) || tomes[0];

    let deck = customDeck;
    if (!deck) {
      if (filter === "all") deck = [...tome.cards];
      else if (filter === "mastered") deck = tome.cards.filter((c) => Store.getWordStatus(c) === "mastered");
      else if (filter === "familiar") deck = tome.cards.filter((c) => Store.getWordStatus(c) === "familiar");
      else if (filter === "challenging") deck = tome.cards.filter((c) => Store.getWordStatus(c) === "challenging");
      else if (filter === "new") deck = tome.cards.filter((c) => Store.getWordStatus(c) === "new");
      else deck = [...tome.cards];
    }

    const el = $("#screen-vault");

    // Empty state
    if (!deck.length) {
      el.innerHTML = `
        <div class="vault-study-chamber" style="text-align:center;padding:40px 20px">
          <div style="font-size:3.5rem;margin-bottom:12px">🌟</div>
          <h2 style="font-size:1.8rem;margin-bottom:8px">Chamber Cleared!</h2>
          <p style="color:#cbd5e1;max-width:440px;margin:0 auto 24px;line-height:1.6">
            No spells currently match the <b>${filter.toUpperCase()}</b> filter in <i>${esc(tome.title)}</i>. All spells here have been mastered or are ready for full practice!
          </p>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
            <button class="btn primary" id="btn-study-all-fallback">↻ Practice All Spells (${tome.total})</button>
            <button class="btn" id="btn-study-return-lobby">← Return to Tomes</button>
          </div>
        </div>
      `;
      $("#btn-study-all-fallback").onclick = () => this.vaultStudy(tomeId, "all", 0);
      $("#btn-study-return-lobby").onclick = () => this.vaultLobby();
      return;
    }

    cardIdx = Math.max(0, Math.min(cardIdx, deck.length - 1));
    const c = deck[cardIdx];
    const curStatus = Store.getWordStatus ? Store.getWordStatus(c) : "new";
    const pct = Math.round(((cardIdx + 1) / deck.length) * 100);

    const frontSentence = esc(c.context || "").replace(/___/g, '<span class="mcard-blank-mark">______</span>');
    const backSentence = c.raw_sentence
      ? esc(c.raw_sentence)
      : esc(c.context || "").replace(/___/g, `<mark>${esc(c.word)}</mark>`);

    el.innerHTML = `
      <div class="vault-study-chamber">
        <div class="study-top-nav">
          <button class="back-btn" id="btn-study-back-tomes">← Tomes</button>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:1.3rem">${tome.icon}</span>
            <b style="font-size:0.95rem;color:#fef08a">${esc(tome.title)}</b>
          </div>
          <div style="display:flex;gap:6px">
            <button class="btn small" id="btn-study-shuffle" title="Shuffle remaining deck" style="padding:6px 12px;font-size:0.8rem">
              🔀 Shuffle
            </button>
            <button class="btn small" id="btn-study-index" title="View in Spell Index" style="padding:6px 12px;font-size:0.8rem">
              📜 Index
            </button>
          </div>
        </div>

        <!-- Filter tabs for quick drill selection -->
        <div class="study-filter-row">
          <button class="study-filter-btn ${filter === 'all' ? 'active' : ''}" data-drill-f="all">All (${tome.total})</button>
          <button class="study-filter-btn ${filter === 'challenging' ? 'active' : ''}" data-drill-f="challenging">🔴 Difficult (${tome.challenging})</button>
          <button class="study-filter-btn ${filter === 'familiar' ? 'active' : ''}" data-drill-f="familiar">🟡 Okay (${tome.familiar})</button>
          <button class="study-filter-btn ${filter === 'mastered' ? 'active' : ''}" data-drill-f="mastered">⚡ Mastered (${tome.mastered})</button>
          <button class="study-filter-btn ${filter === 'new' ? 'active' : ''}" data-drill-f="new">✨ Unseen (${tome.unseen})</button>
        </div>

        <!-- Progress bar -->
        <div class="study-progress-card">
          <span>Card ${cardIdx + 1} of ${deck.length}</span>
          <div class="bar"><i style="width:${pct}%"></i></div>
          <span>${pct}%</span>
        </div>

        <!-- 3D Interactive Magic Spell Card -->
        <div class="magic-card-stage" id="magic-card-stage">
          <div class="magic-card-flipper" id="card-flipper">
            <!-- FRONT FACE -->
            <div class="magic-card-face front">
              <div>
                <div class="mcard-ribbon">
                  <span>${tome.icon} ${esc(tome.num)} · ${esc(c.pos)}</span>
                  <span>${stars(c.id)}</span>
                </div>
                <div class="mcard-word-wrap">
                  <div class="mcard-word">${esc(c.word)}</div>
                  <button class="mcard-recite-btn" id="btn-chant-spell" title="Listen to word pronunciation">
                    🔊 Listen to Word
                  </button>
                </div>
                <div class="mcard-ctx-box">
                  <p>${frontSentence}</p>
                  <div style="display:flex;justify-content:flex-end;margin-top:8px">
                    <button class="btn small" id="btn-recite-example" style="font-size:0.82rem;padding:5px 14px;background:rgba(34,211,238,0.12);color:var(--cyan);border:1px solid rgba(34,211,238,0.3);font-weight:600" title="Listen to example sentence pronunciation">
                      🔊 Listen to Sentence
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <button class="mcard-flip-btn" id="btn-flip-front">
                  🔮 Flip Card · Reveal Meaning [Space]
                </button>
                <div class="mcard-flip-prompt">
                  <span>✦ Tap card or press [Space] to flip ✦</span>
                </div>
              </div>
            </div>

            <!-- BACK FACE -->
            <div class="magic-card-face back">
              <div>
                <div class="mcard-ribbon">
                  <span style="color:#38bdf8">✨ Meaning &amp; Definition</span>
                  <span>${curStatus === 'mastered' ? '<span class="arcane-status-pill mastered">⚡ Mastered</span>' : curStatus === 'familiar' ? '<span class="arcane-status-pill familiar">🟡 Okay</span>' : curStatus === 'challenging' ? '<span class="arcane-status-pill challenging">🔴 Difficult</span>' : '<span class="arcane-status-pill new">✨ Unseen</span>'}</span>
                </div>
                <div style="text-align:center;margin:12px 0 6px">
                  <h2 style="font-size:1.8rem;margin:0;color:#fff">${esc(c.word)}</h2>
                  <small style="color:var(--cyan);text-transform:uppercase;letter-spacing:0.06em">${esc(c.pos)}</small>
                </div>

                <div class="mcard-back-meaning">
                  ${c.meaning_chin ? `<div class="mcard-meaning-chin">${esc(c.meaning_chin)}</div>` : ''}
                  <div class="mcard-meaning-eng">${esc(c.meaning_eng || c.meaning)}</div>
                  ${c.synonyms && c.synonyms.length ? `
                    <div class="mcard-syn-list">
                      ${c.synonyms.map(s => `<span class="mcard-syn-chip">${esc(s)}</span>`).join('')}
                    </div>
                  ` : ''}
                </div>

                <div class="mcard-ctx-box" style="margin-top:10px">
                  <p>${backSentence}</p>
                </div>
              </div>

              <div>
                <button class="mcard-flip-btn" id="btn-flip-back" style="border-color:rgba(56,189,248,0.4);color:#bae6fd">
                  ↺ Flip Back to Word [Space]
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Arcane Assessment Bar (Game-like 3-way Self Assessment) -->
        <div class="arcane-assessment-bar">
          <button class="arcane-assess-btn challenging ${curStatus === 'challenging' ? 'active' : ''}" id="btn-mark-challenging" title="Mark as Difficult (Needs Practice)">
            <span class="assess-icon">🔴</span>
            <span class="assess-title">Difficult</span>
            <span class="assess-sub">Needs Practice</span>
            <span class="assess-key">Key: 1</span>
          </button>
          <button class="arcane-assess-btn familiar ${curStatus === 'familiar' ? 'active' : ''}" id="btn-mark-familiar" title="Mark as Okay (In Progress)">
            <span class="assess-icon">🟡</span>
            <span class="assess-title">Okay</span>
            <span class="assess-sub">In Progress</span>
            <span class="assess-key">Key: 2</span>
          </button>
          <button class="arcane-assess-btn mastered ${curStatus === 'mastered' ? 'active' : ''}" id="btn-mark-mastered" title="Mark as Mastered (Well Known)">
            <span class="assess-icon">⚡</span>
            <span class="assess-title">Mastered</span>
            <span class="assess-sub">Well Known!</span>
            <span class="assess-key">Key: 3</span>
          </button>
        </div>

        <!-- Deck navigation & shortcuts -->
        <div class="study-deck-controls">
          <button class="btn small" id="btn-deck-prev" ${cardIdx > 0 ? '' : 'disabled'} style="padding:8px 18px;font-size:0.9rem">
            ◀ Previous Spell
          </button>
          <button class="btn small" id="btn-deck-next" ${cardIdx < deck.length - 1 ? '' : 'disabled'} style="padding:8px 18px;font-size:0.9rem">
            Next Spell ▶
          </button>
        </div>

        <div class="deck-hotkeys-legend">
          Shortcuts: <kbd>Space</kbd> Flip · <kbd>1</kbd> Challenging · <kbd>2</kbd> Familiar · <kbd>3</kbd> Mastered · <kbd>←</kbd> <kbd>→</kbd> Navigate
        </div>
      </div>
    `;

    // Navigation bindings
    $("#btn-study-back-tomes").onclick = () => this.vaultLobby();
    $("#btn-study-index").onclick = () => this.vaultIndex(tomeId);

    $("#btn-study-shuffle").onclick = () => {
      const remaining = shuffle([...deck]);
      toast("🔀 Grimoire Deck Shuffled!");
      this.vaultStudy(tomeId, filter, 0, remaining);
    };

    $$("[data-drill-f]").forEach((b) => {
      b.onclick = () => this.vaultStudy(tomeId, b.dataset.drillF, 0);
    });

    // Flip logic
    const flipper = $("#card-flipper");
    const toggleFlip = (e) => {
      if (e) e.stopPropagation();
      if (flipper) flipper.classList.toggle("flipped");
      if (Sfx.cardFlip) Sfx.cardFlip();
    };

    flipper.onclick = toggleFlip;
    $("#btn-flip-front").onclick = toggleFlip;
    $("#btn-flip-back").onclick = toggleFlip;

    // Speech bindings
    $("#btn-chant-spell").onclick = (e) => {
      e.stopPropagation();
      pronounce(c.word, 0.88);
      const b = $("#btn-chant-spell");
      b.style.transform = "scale(1.1)";
      setTimeout(() => { if (b) b.style.transform = ""; }, 250);
    };

    $("#btn-recite-example").onclick = (e) => {
      e.stopPropagation();
      const sentence = c.raw_sentence || (c.context ? c.context.replace(/___/g, c.word) : c.word);
      pronounce(sentence, 0.95);
      const b = $("#btn-recite-example");
      b.style.transform = "scale(1.08)";
      setTimeout(() => { if (b) b.style.transform = ""; }, 250);
    };

    // Assessment handler
    const assessCard = (status) => {
      Store.setWordStatus(c, status);
      if (status === "mastered") {
        if (Sfx.spellCast) Sfx.spellCast();
        Fx.confetti(75);
        Store.addXP(10);
        toast("⚡ Marked as Mastered! (+10 XP)", true);
      } else if (status === "challenging") {
        if (Sfx.spellChallenging) Sfx.spellChallenging();
        Store.addXP(5);
        toast("🔴 Marked as Difficult — Queued for practice (+5 XP)");
      } else {
        if (Sfx.click) Sfx.click();
        Store.addXP(5);
        toast("🟡 Marked as Okay (+5 XP)");
      }
      this.renderTop();

      if (cardIdx < deck.length - 1) {
        this.vaultStudy(tomeId, filter, cardIdx + 1, deck);
      } else {
        // Deck completed!
        Sfx.fanfare();
        Fx.confetti(180);
        modal(`
          <div style="text-align:center;padding:12px">
            <div style="font-size:3.5rem;margin-bottom:10px">🏆</div>
            <h2 style="font-size:1.8rem;margin-bottom:6px">Grimoire Session Complete!</h2>
            <p style="color:#cbd5e1;line-height:1.6">You have completed all <b>${deck.length}</b> spell cards in this revision session!</p>
            <p style="font-family:var(--font-n);font-size:1.8rem;font-weight:800;color:#fbbf24;margin:14px 0">+50 Bonus XP</p>
            <div style="display:flex;gap:10px;justify-content:center;margin-top:18px">
              <button class="btn primary" id="btn-tome-restart">↻ Study Deck Again</button>
              <button class="btn" id="btn-tome-finish">← Return to Tomes</button>
            </div>
          </div>
        `);
        Store.addXP(50);
        $("#btn-tome-restart").onclick = () => { closeModal(); this.vaultStudy(tomeId, filter, 0, deck); };
        $("#btn-tome-finish").onclick = () => { closeModal(); this.vaultLobby(); };
      }
    };

    $("#btn-mark-challenging").onclick = (e) => { e.stopPropagation(); assessCard("challenging"); };
    $("#btn-mark-familiar").onclick = (e) => { e.stopPropagation(); assessCard("familiar"); };
    $("#btn-mark-mastered").onclick = (e) => { e.stopPropagation(); assessCard("mastered"); };

    if (cardIdx > 0) {
      $("#btn-deck-prev").onclick = () => this.vaultStudy(tomeId, filter, cardIdx - 1, deck);
    }
    if (cardIdx < deck.length - 1) {
      $("#btn-deck-next").onclick = () => this.vaultStudy(tomeId, filter, cardIdx + 1, deck);
    }

    // Keyboard shortcuts
    const keyHandler = (e) => {
      if (!$("#screen-vault") || !$("#screen-vault").classList.contains("active")) {
        window.removeEventListener("keydown", keyHandler);
        return;
      }
      if ($("#modal") && !$("#modal").classList.contains("hidden")) return;
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;

      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        toggleFlip();
      } else if (e.key === "1") {
        e.preventDefault();
        assessCard("challenging");
      } else if (e.key === "2") {
        e.preventDefault();
        assessCard("familiar");
      } else if (e.key === "3") {
        e.preventDefault();
        assessCard("mastered");
      } else if (e.key === "ArrowLeft" && cardIdx > 0) {
        e.preventDefault();
        this.vaultStudy(tomeId, filter, cardIdx - 1, deck);
      } else if (e.key === "ArrowRight" && cardIdx < deck.length - 1) {
        e.preventDefault();
        this.vaultStudy(tomeId, filter, cardIdx + 1, deck);
      }
    };

    this.activeStudyKeyHandler = keyHandler;
    window.addEventListener("keydown", keyHandler);
  },

  vaultIndex(tomeId = "all", filter = "all", search = "") {
    if (this.activeStudyKeyHandler) {
      window.removeEventListener("keydown", this.activeStudyKeyHandler);
      this.activeStudyKeyHandler = null;
    }

    const tomes = this.getTomes();
    const tome = tomes.find((t) => t.id === tomeId) || tomes[0];
    const el = $("#screen-vault");

    const q = (search || "").toLowerCase().trim();
    const list = tome.cards.filter((c) => {
      const st = Store.getWordStatus ? Store.getWordStatus(c) : "new";
      const matchesFilter = filter === "all" || st === filter;
      if (!matchesFilter) return false;
      if (!q) return true;
      return c.word.toLowerCase().includes(q) ||
        (c.meaning && c.meaning.toLowerCase().includes(q)) ||
        (c.meaning_chin && c.meaning_chin.toLowerCase().includes(q)) ||
        (c.synonyms && c.synonyms.some((s) => s.toLowerCase().includes(q)));
    });

    el.innerHTML = `
      <div class="vault-index-chamber">
        <div class="vault-index-head">
          <button class="back-btn" id="btn-index-back-tomes">← Tomes</button>
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:1.6rem">${tome.icon}</span>
            <div>
              <h2 style="font-size:1.4rem;margin:0;color:#fef08a">${esc(tome.title)}</h2>
              <span class="muted" style="font-size:0.82rem">Spell Index · ${list.length} / ${tome.total} Spells</span>
            </div>
          </div>
          <button class="btn small primary" id="btn-index-study" style="padding:8px 16px;font-size:0.88rem">
            🎴 Start Flashcards
          </button>
        </div>

        <div class="vault-search-bar">
          <span class="vault-search-icon">🔍</span>
          <input type="text" class="vault-search-input" id="vault-search-input" placeholder="Search spells, definitions, or Chinese meanings in this Tome..." value="${esc(search)}" />
        </div>

        <div class="study-filter-row" style="margin-bottom:20px">
          <button class="study-filter-btn ${filter === 'all' ? 'active' : ''}" data-idx-f="all">All (${tome.total})</button>
          <button class="study-filter-btn ${filter === 'mastered' ? 'active' : ''}" data-idx-f="mastered">⚡ Mastered (${tome.mastered})</button>
          <button class="study-filter-btn ${filter === 'familiar' ? 'active' : ''}" data-idx-f="familiar">🟡 Okay (${tome.familiar})</button>
          <button class="study-filter-btn ${filter === 'challenging' ? 'active' : ''}" data-idx-f="challenging">🔴 Difficult (${tome.challenging})</button>
          <button class="study-filter-btn ${filter === 'new' ? 'active' : ''}" data-idx-f="new">✨ Unseen (${tome.unseen})</button>
        </div>

        <div class="vault-grid">
          ${list.map((c) => {
      const st = Store.getWordStatus ? Store.getWordStatus(c) : "new";
      const badge = st === "mastered"
        ? '<span class="arcane-status-pill mastered">⚡ Mastered</span>'
        : st === "familiar"
          ? '<span class="arcane-status-pill familiar">🟡 Okay</span>'
          : st === "challenging"
            ? '<span class="arcane-status-pill challenging">🔴 Difficult</span>'
            : '<span class="arcane-status-pill new">✨ Unseen</span>';

      return `
              <button class="vword" id="vw-${c.id}" data-id="${c.id}">
                <div>
                  <div class="vword-top">
                    <b>${esc(c.word)}</b>
                    ${badge}
                  </div>
                  <small>${esc(c.pos)}</small>
                  ${c.meaning_chin ? `<div class="vword-chin">${esc(c.meaning_chin)}</div>` : ''}
                </div>
                <div>
                  ${stars(c.id)}
                </div>
              </button>
            `;
    }).join('') || `<p class="muted" style="padding:30px;text-align:center;grid-column:1/-1">No spells found matching your search.</p>`}
        </div>
      </div>
    `;

    $("#btn-index-back-tomes").onclick = () => this.vaultLobby();
    $("#btn-index-study").onclick = () => this.vaultStudy(tomeId, filter);

    const sInput = $("#vault-search-input");
    if (sInput) {
      sInput.focus();
      // place cursor at end
      sInput.selectionStart = sInput.selectionEnd = sInput.value.length;
      sInput.oninput = (e) => {
        this.vaultIndex(tomeId, filter, e.target.value);
      };
    }

    $$("[data-idx-f]").forEach((b) => {
      b.onclick = () => this.vaultIndex(tomeId, b.dataset.idxF, search);
    });

    $$(".vword").forEach((b) => {
      b.onclick = () => {
        const id = +b.dataset.id;
        const card = (window.VOCAB || []).find((x) => x.id === id) || (window.VOCAB || [])[id];
        if (card) showWord(card, list);
      };
    });
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
