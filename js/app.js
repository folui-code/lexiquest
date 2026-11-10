/* ===================================================================
   App shell: home dashboard, daily quests + chest, vault, navigation
   =================================================================== */
const QUESTS = [
  ["rush", "⚡ Score 1,000+ in Cryptic Rush"],
  ["alchemy", "⚗️ Score 1,000+ in Collocation Alchemy"],
  ["reading", "📜 Complete today's Reading Oracle passage"]
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
  },
  DRAGON: {
    key: "DRAGON",
    name: "DRAGON",
    role: "FACULTY MASTER",
    mascot: "Shadow Dragon",
    color: "#c084fc",
    badge: "🐉 House of Dragon · Faculty",
    crest: "🐉",
    desc: "The High Council of Faculty and Masters of the Arcane"
  }
};

function isStaffMember(name, role) {
  if (role === "staff") return true;
  if (!name) return false;
  const n = String(name).trim().toUpperCase();
  if (n.includes("(VP)") || n.includes("(P)") || n.includes("(STAFF)") || n.includes("TEACHER") || n.startsWith("MR.") || n.startsWith("MS.") || n.startsWith("MRS.")) {
    return true;
  }
  const knownStaff = [
    "AU MING TAK", "CHAN KWUN TAT", "CHOI KA LAI CARRIE", "CHU HAU YING",
    "CHU WAI KEE GEORGE", "FONG HING PAN", "HSU TING LANG", "HUI YUK WAH",
    "IP CHOI WAN", "KONG KWOK LING", "LO YIU CHUEN", "NGAI KWAI MING",
    "POON KAM LUN", "STEPHEN WILLIAM HENRY", "TSE YUEN YING", "WONG CHIN LEUNG",
    "YICK YING LIN AUDREY", "LEE WING CHEUNG ALISTAIR", "WONG PUI SZE",
    "NG CHUNG HIN", "TSANG LAI SHEUNG", "WONG LEUNG KEE", "LUI FU ON",
    "CHEUNG TSZ TUNG"
  ];
  const cleanName = n.replace(/\s*\([^)]*\)/g, "").trim();
  if (knownStaff.some(s => cleanName === s || cleanName.includes(s))) return true;
  return false;
}

const App = {
  async init() {
    Store.load();
    $("#btn-logo").onclick = () => showScreen("home");
    $("#btn-mute").onclick = () => { Store.d.muted = !Store.d.muted; Store.save(); this.renderTop(); Sfx.click(); };
    $("#btn-user").onclick = () => this.showAccountModal();
    $("#player-name").onclick = () => this.showAccountModal();
    $("#mode-rush").onclick = () => { Sfx.click(); Rush.intro(); };
    const alchemyModeBtn = $("#mode-alchemy");
    if (alchemyModeBtn) {
      alchemyModeBtn.onclick = () => { Sfx.click(); Alchemy.intro(); };
    }
    const readingModeBtn = $("#mode-reading");
    if (readingModeBtn) {
      readingModeBtn.onclick = () => { Sfx.click(); Reading.intro(); };
    }
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

    // Start real-time auto-sync loop for leaderboard, class rank, and house cup
    this.startAutoSyncLoop();

    // Check URL parameters for 1v1 Challenge Duel or Teacher Class Arena
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.has("alchduel")) {
        const payload = sp.get("alchduel");
        if (payload && typeof Alchemy !== "undefined" && Alchemy.handleDuelUrl) Alchemy.handleDuelUrl(payload);
      } else if (sp.has("alchclass") || sp.has("alcharena")) {
        const room = sp.get("alchclass") || sp.get("alcharena");
        if (room && typeof Alchemy !== "undefined" && Alchemy.handleArenaUrl) Alchemy.handleArenaUrl(room);
      } else if (sp.has("duel")) {
        const payload = sp.get("duel");
        if (payload && typeof Rush !== "undefined" && Rush.handleDuelUrl) Rush.handleDuelUrl(payload);
      } else if (sp.has("arena") || sp.has("class")) {
        const room = sp.get("arena") || sp.get("class");
        if (room && typeof Rush !== "undefined" && Rush.handleArenaUrl) Rush.handleArenaUrl(room);
      }
    } catch (e) {
      console.error("Routing error:", e);
    }
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
    const d = Store.d || {};
    const auth = d.auth || {};
    const isStaff = isStaffMember(d.name, auth.role);

    $("#streak-count").textContent = s;
    $("#streak-pill").classList.toggle("cold", Store.d.lastPlay !== todayKey());
    $("#streak-pill").classList.toggle("hot", Store.d.lastPlay === todayKey() && s >= 3);
    $("#streak-pill").title = `Daily streak · 🧊 ${Store.d.freezes} freeze(s)`;
    
    if (isStaff) {
      $("#rank-name").textContent = `Faculty Master`;
      $("#xp-fill").style.width = "100%";
    } else {
      $("#rank-name").textContent = `${r.name} · ${fmt(Store.d.xp)} XP`;
      $("#xp-fill").style.width = r.pct + "%";
    }
    $("#btn-mute").textContent = Store.d.muted ? "🔇" : "🔊";

    const housePill = $("#house-pill");
    if (housePill) {
      const houseKey = isStaff ? "DRAGON" : (Store.d.house || (Store.d.auth && Store.d.auth.house) || "").toUpperCase();
      const hInfo = HOUSE_DATA[houseKey];
      if (hInfo) {
        housePill.className = `pill house-pill ${houseKey.toLowerCase()}`;
        housePill.textContent = hInfo.badge;
        housePill.title = isStaff ? "Faculty Council: House of Dragon" : `Your House: ${hInfo.name} — ${hInfo.role} (${hInfo.mascot})\nClick to view Great Hall`;
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
    const isStaff = isStaffMember(d.name, (d.auth && d.auth.role));
    const houseKey = isStaff ? "DRAGON" : (Store.d.house || (Store.d.auth && Store.d.auth.house) || "").toUpperCase();
    const hInfo = HOUSE_DATA[houseKey];
    const houseMsg = $("#house-greeting-msg");
    if (houseMsg) {
      if (isStaff) {
        houseMsg.innerHTML = `Faculty High Council · <b style="color:${hInfo.color}">House of Dragon</b> (✦ Shadow Dragon ✦)`;
      } else if (hInfo) {
        houseMsg.innerHTML = `Assigned to House <b style="color:${hInfo.color}">${hInfo.name}</b> (✦ ${hInfo.role} · Mascot: ${hInfo.mascot} ✦)`;
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

    // Render Wizard Personal Profile & Collection Showcase
    this.renderWizardProfile();

    // Render Class Honor Roll (Top 3 Students per class)
    this.renderClassHonorRoll();

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
    const bestAlchEl = $("#best-alchemy");
    if (bestAlchEl) {
      bestAlchEl.textContent = d.best && d.best.alchemy ? `Best ${fmt(d.best.alchemy)}` : "Play Now";
    }
    const bestReadingEl = $("#best-reading");
    if (bestReadingEl) {
      const rStore = d.reading || {};
      const compCount = rStore.completed ? Object.keys(rStore.completed).length : 0;
      bestReadingEl.textContent = compCount > 0 ? `${compCount} done (${rStore.streak || 0}🔥)` : "Daily Ready!";
    }
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

    // Wizard showcase, Class Honor Roll & House Cup
    this.renderWizardProfile();
    this.renderClassHonorRoll();
    this.renderHouseCup();

    // render pinned arena scoreboard
    this.renderScoreboard(this.currentSbTab || "rush");
  },

  renderWizardProfile() {
    const showcase = $("#wizard-profile-showcase");
    if (!showcase) return;

    const d = Store.d || {};
    const auth = d.auth || {};
    const isStaff = isStaffMember(d.name, auth.role);
    const houseKey = isStaff ? "DRAGON" : (d.house || auth.house || "TAK").toUpperCase();
    const hInfo = HOUSE_DATA[houseKey] || HOUSE_DATA.DRAGON;
    const r = isStaff ? { name: "Faculty Master" } : (Store.rank ? Store.rank() : { name: "Apprentice" });

    let className = isStaff ? "Staff" : "4A";
    let formName = isStaff ? "Faculty High Council" : "S4";

    const rawName = auth.name || d.name || (isStaff ? "Teacher" : "Scholar");
    const classMatch = rawName.match(/\((4[A-E]|5[A-E]|6[A-E]|\d[A-E]|Staff|VP|P)\)/i);
    if (classMatch) {
      className = classMatch[1].toUpperCase();
      if (className === "STAFF" || className === "VP" || className === "P") {
        formName = "Faculty";
      } else {
        formName = "S" + className.charAt(0);
      }
    }
    const cleanName = rawName.replace(/\s*\([^)]*\)/g, "").trim() || (isStaff ? "Teacher" : "Scholar");

    // Mastered words count
    let masteredCount = 0;
    (window.VOCAB || []).forEach(c => {
      const st = Store.getWordStatus ? Store.getWordStatus(c) : "new";
      if (st === "mastered") masteredCount++;
    });

    const crestImg = isStaff ? "assets/houses/crests/dragon.png" : `assets/houses/crests/${houseKey.toLowerCase()}.png`;
    const tierNum = Math.min(5, Math.max(1, (r.idx !== undefined ? r.idx : 0) + 1));
    const defaultAvatarImg = isStaff ? "assets/houses/avatars/dragon.png" : `assets/houses/avatars/${houseKey.toLowerCase()}.png`;
    const avatarImg = isStaff ? defaultAvatarImg : `assets/houses/avatars/${houseKey.toLowerCase()}_t${tierNum}.png`;

    showcase.innerHTML = `
      <!-- LEFT: HOUSE LOGO -->
      <div class="wp-house-logo-col">
        <img src="${crestImg}" alt="${hInfo.name} House Crest" class="wp-house-crest" onerror="this.onerror=null;this.src='assets/houses/house_concept_design.png';" />
        <span class="wp-house-name-tag" style="border-color:${hInfo.color};color:${hInfo.color}">${isStaff ? "HOUSE OF DRAGON" : "HOUSE " + esc(hInfo.name)}</span>
      </div>

      <!-- AVATAR PICTURE -->
      <div class="wp-avatar-col">
        <div class="wp-avatar-frame" id="wp-avatar-clickable" title="Click to view Wardrobe &amp; Tier Skin details" style="border-color:${hInfo.color};box-shadow:0 0 18px -2px ${hInfo.color}66">
          <img src="${avatarImg}" alt="${esc(cleanName)} Avatar (Tier ${tierNum})" class="wp-avatar-img" onerror="this.onerror=null;this.src='${defaultAvatarImg}';" />
          <span class="wp-avatar-inspect-pill">🔍 View</span>
          ${!isStaff ? `<span class="wp-avatar-tier-pill" style="border-color:${hInfo.color}">T${tierNum}</span>` : ''}
        </div>
      </div>

      <!-- PERSONAL INFO (MIDDLE) -->
      <div class="wp-info-col">
        <div class="wp-role-badge">
          ${isStaff ? "🎓 Faculty / Staff Member" : `🎓 ${esc(formName)} Student`}
        </div>
        <h2 class="wp-name">${esc(cleanName)}</h2>
        <div class="wp-meta-row">
          <span class="wp-meta-item">🏫 Class: <b>${isStaff ? "Faculty" : esc(className)}</b></span>
          <span class="wp-meta-item">🛡️ Order: <b style="color:${hInfo.color}">${isStaff ? "House of Dragon" : esc(hInfo.name) + " (" + esc(hInfo.mascot) + ")"}</b></span>
          <span class="wp-meta-item">🎖️ Rank: <b>${esc(r.name)}</b></span>
        </div>
        <div class="wp-stats-bar">
          <div class="wp-stat">
            <span class="wp-stat-num">${fmt(d.xp || 0)}</span>
            <span class="wp-stat-label">House XP</span>
          </div>
          <div class="wp-stat">
            <span class="wp-stat-num">${Store.liveStreak ? Store.liveStreak() : 0}🔥</span>
            <span class="wp-stat-label">Daily Streak</span>
          </div>
          <div class="wp-stat">
            <span class="wp-stat-num">${masteredCount}</span>
            <span class="wp-stat-label">Words Mastered</span>
          </div>
        </div>
      </div>

      <!-- RIGHT: SPACE FOR TOOLS, SPELLS & ITEMS (ARSENAL) -->
      <div class="wp-collection-col">
        <div class="wp-collection-header">
          <span style="font-size:1.2rem">🔮</span>
          <div>
            <div style="font-weight:800;font-size:0.9rem;color:#f8fafc">Arcane Arsenal</div>
            <div class="muted" style="font-size:0.75rem">Tools &amp; Spells Collection</div>
          </div>
        </div>
        <div class="wp-slots-grid">
          <div class="wp-item-slot" title="Elder Wand of Syntax (Available in upcoming quest)">
            <span class="wp-slot-icon">🪄</span>
            <span class="wp-slot-lock">🔒</span>
          </div>
          <div class="wp-item-slot" title="Ancient Spell Grimoire (Available in upcoming quest)">
            <span class="wp-slot-icon">📜</span>
            <span class="wp-slot-lock">🔒</span>
          </div>
          <div class="wp-item-slot" title="Alchemical Focus Elixir (Available in upcoming quest)">
            <span class="wp-slot-icon">🧪</span>
            <span class="wp-slot-lock">🔒</span>
          </div>
          <div class="wp-item-slot" title="Phoenix Feather Charm (Available in upcoming quest)">
            <span class="wp-slot-icon">🪶</span>
            <span class="wp-slot-lock">🔒</span>
          </div>
        </div>
        <div class="wp-collection-footer muted">✦ 4 Artifact slots reserved for collection</div>
      </div>
    `;

    // Clicking avatar frame opens wardrobe inspection modal
    const avFrame = $("#wp-avatar-clickable", showcase);
    if (avFrame) {
      avFrame.onclick = () => {
        Sfx.click();
        this.showWardrobeModal(tierNum, houseKey, r.name, cleanName, avatarImg, hInfo, isStaff);
      };
    }
  },

  showWardrobeModal(tierNum, houseKey, rankName, cleanName, avatarImg, hInfo, isStaff) {
    const tierDescriptions = [
      {
        tier: 1,
        title: "Apprentice",
        uniform: "👔 Novice Academy Shirt",
        desc: "Crisp white button-down with open collar. The comfortable everyday uniform worn upon entering LexiQuest Academy.",
        req: "0 XP"
      },
      {
        tier: 2,
        title: "Seeker",
        uniform: "👔 Official House Necktie & Shirt",
        desc: "Buttoned formal collar paired with the woven silk tie of your house. Worn by scholars formally inducted into their house order.",
        req: "1,000 XP"
      },
      {
        tier: 3,
        title: "Scholar",
        uniform: "🧥 Academy Knit Cardigan & Tie",
        desc: "V-neck knit cardigan with contrast collar trim over the house tie. The esteemed uniform of dedicated vocabulary scholars.",
        req: "10,000 XP"
      },
      {
        tier: 4,
        title: "Sorcerer",
        uniform: "🧙 Ceremonial Wizard Robe",
        desc: "Heavy draped dark robes with high-shouldered folds and house crest chest embroidery. Worn by advanced practitioners.",
        req: "50,000 XP"
      },
      {
        tier: 5,
        title: "Master",
        uniform: "👑 Archmage High Regalia",
        desc: "Ornate velvet gown with radiant gold brocade trim, high standing collar, and illuminated house sigil. The supreme rank.",
        req: "150,000 XP"
      }
    ];

    const cur = tierDescriptions[tierNum - 1] || tierDescriptions[0];

    modal(`
      <div style="text-align:center;padding:8px 4px">
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:12px">
          <span style="font-size:1.4rem">✨</span>
          <h2 style="margin:0;font-size:1.4rem">Wizard Wardrobe &amp; Avatar Skin</h2>
        </div>

        <!-- Large Portrait Frame -->
        <div style="width:160px;height:192px;margin:0 auto 14px;border-radius:20px;overflow:hidden;border:3px solid ${hInfo.color};box-shadow:0 0 24px -2px ${hInfo.color}88;background:#0f172a;position:relative">
          <img src="${avatarImg}" alt="${esc(cleanName)} Avatar" style="width:100%;height:100%;object-fit:cover;object-position:center center" />
          <span style="position:absolute;bottom:8px;right:8px;font-size:0.75rem;font-weight:900;padding:2px 8px;border-radius:999px;background:rgba(15,23,42,0.9);border:1px solid ${hInfo.color};color:#fff">Tier ${tierNum}</span>
        </div>

        <div style="display:inline-block;padding:3px 12px;border-radius:999px;background:rgba(255,255,255,0.06);border:1px solid ${hInfo.color};font-weight:800;color:${hInfo.color};font-size:0.85rem;margin-bottom:8px">
          ${isStaff ? "Faculty High Council" : `Tier ${tierNum} · ${cur.title}`}
        </div>

        <h3 style="margin:4px 0 6px;font-size:1.15rem">${isStaff ? "Grand Dragon Master Regalia" : cur.uniform}</h3>
        <p style="margin:0 0 16px;color:#cbd5e1;font-size:0.88rem;line-height:1.5;max-width:380px;margin-left:auto;margin-right:auto">
          ${isStaff ? "The ancient ceremonial dragon robe of the Faculty High Council." : cur.desc}
        </p>

        ${!isStaff ? `
          <!-- 5-Tier Wardrobe Roadmap -->
          <div style="background:rgba(255,255,255,0.025);border-radius:12px;border:1px solid rgba(255,255,255,0.07);padding:12px 10px;margin-bottom:14px;text-align:left">
            <div style="font-size:0.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;text-align:center">
              Wardrobe Progression Roadmap
            </div>
            <div style="display:grid;grid-template-columns:repeat(5, 1fr);gap:6px">
              ${tierDescriptions.map((td, idx) => {
                const isUnlocked = tierNum >= td.tier;
                const isCurrent = tierNum === td.tier;
                const tImg = `assets/houses/avatars/${houseKey.toLowerCase()}_t${td.tier}.png`;
                return `
                  <div style="text-align:center;padding:6px 2px;border-radius:8px;border:1px solid ${isCurrent ? hInfo.color : isUnlocked ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'};background:${isCurrent ? 'rgba(56,189,248,0.12)' : isUnlocked ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.3)'};opacity:${isUnlocked ? 1 : 0.45}">
                    <div style="width:40px;height:48px;margin:0 auto 4px;border-radius:6px;overflow:hidden;border:1px solid ${isCurrent ? hInfo.color : 'rgba(255,255,255,0.15)'}">
                      <img src="${tImg}" alt="T${td.tier}" style="width:100%;height:100%;object-fit:cover" onerror="this.onerror=null;this.src='${avatarImg}'" />
                    </div>
                    <div style="font-size:0.68rem;font-weight:800;color:${isCurrent ? hInfo.color : '#cbd5e1'}">T${td.tier}</div>
                    <div style="font-size:0.6rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${td.req}</div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        ` : ''}

        <button class="btn primary small" id="btn-close-wardrobe" style="min-width:140px">Close</button>
      </div>
    `);
    const closeBtn = $("#btn-close-wardrobe");
    if (closeBtn) closeBtn.onclick = () => closeModal();
  },

  renderClassHonorRoll(selectedClass, selectedForm) {
    const card = $("#class-honor-roll-card");
    if (!card) return;

    const d = Store.d || {};
    const auth = d.auth || {};
    const isStaff = isStaffMember(d.name, auth.role);

    // Detect user's own class and form
    let userForm = "S4";
    let userClass = "4D"; // default to 4D where active players exist
    const rawName = auth.name || d.name || "";
    const cm = rawName.match(/\((4[A-E]|5[A-E]|6[A-E])\)/i);
    if (cm) {
      userClass = cm[1].toUpperCase();
      userForm = "S" + userClass.charAt(0);
    }
    const cleanUserName = rawName.replace(/\s*\([^)]*\)/g, "").trim().toLowerCase();

    // Determine active form and active class
    // Default to user's own class on initial load
    this.chrActiveForm = selectedForm || this.chrActiveForm || userForm;
    const formPrefix = this.chrActiveForm.replace("S", "");
    const availableClasses = ['A', 'B', 'C', 'D', 'E'].map(sub => formPrefix + sub);

    if (selectedClass) {
      this.chrActiveClass = selectedClass;
    } else if (!this.chrActiveClass || !availableClasses.includes(this.chrActiveClass)) {
      this.chrActiveClass = (this.chrActiveForm === userForm && availableClasses.includes(userClass)) ? userClass : availableClasses[0];
    }

    const activeClass = this.chrActiveClass;
    const activeForm = this.chrActiveForm;
    const isMyClass = !isStaff && (userClass === activeClass);

    const data = typeof CLASS_HONOR_ROLL !== "undefined" ? CLASS_HONOR_ROLL : { S4: {}, S5: {}, S6: {} };

    // Get verified real scores for the selected class (strictly exclude teachers/staff)
    let rawList = (data[activeForm] && data[activeForm][activeClass]) ? [...data[activeForm][activeClass]] : [];
    rawList = rawList.filter(st => !isStaffMember(st.name, st.role) && Number(st.xp) > 0);

    // Incorporate current user's live score if in this class and has score > 0
    if (isMyClass && cleanUserName && (d.xp || 0) > 0 && !isStaff) {
      const userHouse = (d.house || auth.house || "TAK").toUpperCase();
      const existingIdx = rawList.findIndex(s => s.name.toLowerCase().includes(cleanUserName));
      const userEntry = {
        name: auth.name ? auth.name.replace(/\s*\([^)]*\)/g, "").trim() : d.name,
        house: userHouse,
        xp: d.xp || 0,
        isUser: true
      };

      if (existingIdx >= 0) {
        if ((d.xp || 0) >= rawList[existingIdx].xp) {
          rawList[existingIdx] = userEntry;
        } else {
          rawList[existingIdx].isUser = true;
        }
      } else {
        rawList.push(userEntry);
      }
    }

    rawList.sort((a, b) => b.xp - a.xp);

    // Prepare 3 ranks: fill missing or unplayed slots with "/"
    const top3 = [];
    for (let i = 0; i < 3; i++) {
      if (i < rawList.length) {
        top3.push({
          rank: i + 1,
          name: rawList[i].name,
          house: rawList[i].house || "TAK",
          xp: rawList[i].xp,
          isUser: rawList[i].isUser,
          empty: false
        });
      } else {
        top3.push({
          rank: i + 1,
          name: "—",
          house: "—",
          xp: "/",
          isUser: false,
          empty: true
        });
      }
    }

    const medals = ["🥇", "🥈", "🥉"];
    const hasAnyScore = rawList.length > 0;

    card.innerHTML = `
      <div class="chr-header">
        <div class="chr-title-group">
          <span class="chr-icon">🏆</span>
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <h2 style="margin:0">Class Honor Roll · Top Scholars</h2>
              <button class="chr-xp-info-btn" id="btn-chr-xp-info" title="How to earn Class &amp; House XP">❓ Ways to Earn XP</button>
            </div>
            <p class="muted" style="margin:0;font-size:0.85rem">Viewing Class ${esc(activeClass)} · Combined XP from 4 Game Modes + Word Vault + Daily Chest</p>
          </div>
        </div>

        <!-- Form Switcher: Form 4, 5, 6 -->
        <div class="chr-form-tabs">
          <button class="chr-form-tab ${activeForm === 'S4' ? 'active' : ''}" data-form="S4">Form 4</button>
          <button class="chr-form-tab ${activeForm === 'S5' ? 'active' : ''}" data-form="S5">Form 5</button>
          <button class="chr-form-tab ${activeForm === 'S6' ? 'active' : ''}" data-form="S6">Form 6</button>
        </div>
      </div>

      <!-- Class Switcher Pills: 4A, 4B, 4C, 4D, 4E -->
      <div class="chr-class-pills-bar">
        ${availableClasses.map(c => {
          const isOwn = (!isStaff && c === userClass);
          const isActive = (c === activeClass);
          return `
            <button class="chr-class-pill ${isActive ? 'active' : ''} ${isOwn ? 'is-own-class' : ''}" data-class="${c}">
              ${isOwn ? '★ ' : ''}Class ${c}
              ${isOwn ? '<span class="chr-pill-tag">You</span>' : ''}
            </button>
          `;
        }).join("")}
      </div>

      <!-- Focused Single Class Podium Showcase -->
      <div class="chr-single-showcase ${isMyClass ? 'is-my-class' : ''}">
        <div class="chr-showcase-head">
          <div style="display:flex;align-items:center;gap:10px">
            <h3 class="chr-class-big-title">Class ${esc(activeClass)}</h3>
            ${isMyClass ? '<span class="chr-own-badge">★ Your Class</span>' : ''}
          </div>
          <span class="muted" style="font-size:0.82rem">
            ${hasAnyScore ? `Verified top scholars (${rawList.length} ranked)` : `No games recorded yet`}
          </span>
        </div>

        <div class="chr-podium-list">
          ${top3.map((st, idx) => {
            const medal = medals[idx];
            const isCur = st.isUser || (!st.empty && cleanUserName && st.name.toLowerCase().includes(cleanUserName));
            const hKey = st.house ? st.house.toUpperCase() : "—";
            const scoreDisplay = st.empty ? `<span class="chr-slash">/</span>` : `${fmt(st.xp)} <small style="font-size:0.75rem;color:var(--muted)">XP</small>`;

            return `
              <div class="chr-podium-row rank-${st.rank} ${st.empty ? 'is-empty' : ''} ${isCur ? 'is-user' : ''}">
                <span class="chr-medal">${medal}</span>
                <div class="chr-student-details">
                  <div class="chr-student-name">
                    ${st.empty ? '<span class="muted">—</span>' : esc(st.name)}
                    ${isCur ? '<b style="color:#38bdf8;margin-left:6px">(You)</b>' : ''}
                  </div>
                </div>
                <div class="chr-house-wrap">
                  ${st.empty || hKey === "—" ? '<span class="muted">—</span>' : `<span class="chb-house-pill ${hKey.toLowerCase()}">${hKey}</span>`}
                </div>
                <div class="chr-score-col">
                  ${scoreDisplay}
                </div>
              </div>
            `;
          }).join("")}
        </div>

        ${rawList.length > 3 ? `
          <div class="chr-runners-up" style="margin-top:14px;padding-top:12px;border-top:1px dashed rgba(255,255,255,0.08)">
            <div style="font-size:0.75rem;font-weight:700;color:var(--muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">Honorable Mentions · Class ${esc(activeClass)} Scholars</div>
            ${rawList.slice(3).map((st, idx) => {
              const rankNum = idx + 4;
              const hKey = st.house ? st.house.toUpperCase() : "TAK";
              const isCur = st.isUser || (cleanUserName && st.name.toLowerCase().includes(cleanUserName));
              return `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 12px;background:rgba(255,255,255,0.025);border-radius:8px;margin-bottom:5px;border:1px solid rgba(255,255,255,0.05);font-size:0.86rem;${isCur ? 'border-color:rgba(56,189,248,0.4);background:rgba(56,189,248,0.08);' : ''}">
                  <div style="display:flex;align-items:center;gap:10px">
                    <span style="color:var(--muted);font-weight:700;font-size:0.75rem;min-width:22px">#${rankNum}</span>
                    <span style="font-weight:600">${esc(st.name)} ${isCur ? '<b style="color:#38bdf8;font-size:0.75rem">(You)</b>' : ''}</span>
                  </div>
                  <div style="display:flex;align-items:center;gap:10px">
                    <span class="chb-house-pill ${hKey.toLowerCase()}" style="font-size:0.7rem;padding:2px 7px">${hKey}</span>
                    <span style="font-weight:700;color:var(--cyan);font-size:0.88rem">${fmt(st.xp)} <small style="font-size:0.7rem;color:var(--muted);font-weight:500">XP</small></span>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        ` : ''}

        ${!hasAnyScore ? `
          <div class="chr-empty-notice muted">
            ✦ No student in Class ${esc(activeClass)} has recorded a score yet. Earn XP through <b>Cryptic Rush</b>, <b>Alchemy</b>, <b>Grammar Blitz</b>, <b>Reading Oracle</b>, <b>Word Vault mastery</b>, or the <b>Daily Chest</b> to claim 1st place!
          </div>
        ` : ''}
      </div>
    `;

    // Event listener for XP info modal
    const xpInfoBtn = $("#btn-chr-xp-info", card);
    if (xpInfoBtn) {
      xpInfoBtn.onclick = () => {
        Sfx.click();
        modal(`
          <div style="text-align:left;padding:8px 4px">
            <div style="text-align:center;margin-bottom:14px">
              <div style="font-size:3rem">✨</div>
              <h2 style="margin:0 0 6px">Ways to Earn Class &amp; House XP</h2>
              <p class="muted" style="margin:0;font-size:0.88rem">All XP gained contributes directly to your personal level, your Class Rank, and your House Cup standing!</p>
            </div>

            <div style="display:flex;flex-direction:column;gap:10px;margin:16px 0">
              <div style="display:flex;gap:12px;background:rgba(255,255,255,0.03);padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.06)">
                <div style="font-size:1.8rem">⚡</div>
                <div>
                  <b style="color:var(--cyan)">1. Cryptic Rush</b>
                  <p style="margin:2px 0 0;font-size:0.84rem;color:#cbd5e1">Fast-paced vocabulary guessing under the clock. Earn XP proportional to speed, combos, and round score.</p>
                </div>
              </div>

              <div style="display:flex;gap:12px;background:rgba(255,255,255,0.03);padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.06)">
                <div style="font-size:1.8rem">⚗️</div>
                <div>
                  <b style="color:#c084fc">2. Alchemy (Collocations)</b>
                  <p style="margin:2px 0 0;font-size:0.84rem;color:#cbd5e1">Match academic words into authentic collocations. Earn cauldron brew XP and combo multipliers.</p>
                </div>
              </div>

              <div style="display:flex;gap:12px;background:rgba(255,255,255,0.03);padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.06)">
                <div style="font-size:1.8rem">⚡</div>
                <div>
                  <b style="color:#fde047">3. Grammar Blitz</b>
                  <p style="margin:2px 0 0;font-size:0.84rem;color:#cbd5e1">Rapid-fire grammar drills across DSE sentence patterns. Earn accuracy and unit completion XP.</p>
                </div>
              </div>

              <div style="display:flex;gap:12px;background:rgba(255,255,255,0.03);padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.06)">
                <div style="font-size:1.8rem">📜</div>
                <div>
                  <b style="color:#38bdf8">4. Reading Oracle (Daily)</b>
                  <p style="margin:2px 0 0;font-size:0.84rem;color:#cbd5e1">Daily 140-word DSE Part B2 micro-passages. Earn <b>+50 XP</b> per correct answer and <b>+50 Bonus XP</b> for 100% accuracy.</p>
                </div>
              </div>

              <div style="display:flex;gap:12px;background:rgba(56,189,248,0.08);padding:10px 14px;border-radius:10px;border:1px solid rgba(56,189,248,0.28)">
                <div style="font-size:1.8rem">📖</div>
                <div>
                  <b style="color:#34d399">5. Word Vault &amp; Grimoire Study</b>
                  <p style="margin:2px 0 0;font-size:0.84rem;color:#cbd5e1">
                    Review cards and self-assess your vocab mastery:<br>
                    • <b>+3 XP</b> when you mark a word as <b>⚡ Mastered</b><br>
                    • <b>+1 XP</b> when marked as <b>📖 Familiar</b> or <b>🔴 Challenging</b><br>
                    • <b>+20 Bonus XP</b> upon completing a 10-card Tome revision deck!
                  </p>
                </div>
              </div>

              <div style="display:flex;gap:12px;background:rgba(255,255,255,0.03);padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.06)">
                <div style="font-size:1.8rem">🎁</div>
                <div>
                  <b style="color:#fbbf24">6. Daily Mystery Chest</b>
                  <p style="margin:2px 0 0;font-size:0.84rem;color:#cbd5e1">Open your free chest once a day on the homepage for <b>+100 to +400 instant XP</b>!</p>
                </div>
              </div>

              <div style="display:flex;gap:12px;background:rgba(234,179,8,0.08);padding:10px 14px;border-radius:10px;border:1px solid rgba(234,179,8,0.3)">
                <div style="font-size:1.8rem">⚔️</div>
                <div>
                  <b style="color:#fde047">7. 1v1 Wizards' Duel (Cross-Class Rivalry)</b>
                  <p style="margin:2px 0 0;font-size:0.84rem;color:#cbd5e1">Challenge students from other classes (e.g. 4A vs 4B, 4B vs 4D)! Earn regular battle XP plus <b>+50 Inter-Class Bonus XP</b> per duel to spark friendly competition across the grade!</p>
                </div>
              </div>
            </div>

            <button class="btn primary" id="btn-close-xp-modal" style="width:100%;margin-top:14px">Got it, Let's Level Up! 🚀</button>
          </div>
        `);
        const closeBtn = $("#btn-close-xp-modal");
        if (closeBtn) closeBtn.onclick = () => closeModal();
      };
    }

    // Event listeners for Form tabs
    $$(".chr-form-tab", card).forEach(tab => {
      tab.onclick = () => {
        Sfx.click();
        const newForm = tab.dataset.form;
        const newPrefix = newForm.replace("S", "");
        const newDefaultClass = (newForm === userForm) ? userClass : (newPrefix + "A");
        this.renderClassHonorRoll(newDefaultClass, newForm);
      };
    });

    // Event listeners for Class pills
    $$(".chr-class-pill", card).forEach(pill => {
      pill.onclick = () => {
        Sfx.click();
        this.renderClassHonorRoll(pill.dataset.class, activeForm);
      };
    });
  },

  syncClassHonorRollFromLeaderboard(leaderboardData, profilesData) {
    if (typeof CLASS_HONOR_ROLL === "undefined") return;

    const roster = window.HPCCSS_ROSTER || {};
    const houseMap = window.HPCCSS_HOUSE_MAP || {};
    const nameToHouse = {};
    Object.keys(roster).forEach(h => {
      const raw = roster[h];
      const clean = raw.replace(/\s*\([^)]*\)/g, "").trim().toUpperCase();
      nameToHouse[clean] = (houseMap[h] || "TAK").toUpperCase();
    });

    const resolveHouse = (cleanName, cls) => {
      if (nameToHouse[cleanName]) return nameToHouse[cleanName];
      for (const rName in nameToHouse) {
        if (rName.includes(cleanName) || cleanName.includes(rName)) {
          return nameToHouse[rName];
        }
      }
      return cls === "4D" ? "TAK" : "TAK";
    };

    // Convert per-mode high scores into XP using each game's exact conversion formula
    const modeToXP = (mode, score) => {
      const s = Number(score) || 0;
      if (s <= 0) return 0;
      const m = String(mode).toLowerCase().split("_")[0];
      if (m === "rush") return Math.max(30, Math.round(s / 4));
      if (m === "alchemy") return Math.max(10, Math.round(s / 5));
      if (m === "blitz") return Math.round(s * 0.435);
      if (m === "reading") return Math.round(s / 2);
      return 0;
    };

    // Track per-student converted XP per mode so we can sum across all 4 modes
    const studentMap = {}; // cleanName -> { name, class, house, modes: {}, profileXP: 0 }
    const ensureStudent = (rawName, role) => {
      if (!rawName || isStaffMember(rawName, role)) return null;
      const raw = String(rawName).trim();
      const cm = raw.match(/\((4[A-E]|5[A-E]|6[A-E])\)/i);
      if (!cm) return null;
      const cls = cm[1].toUpperCase();
      const clean = raw.replace(/\s*\([^)]*\)/g, "").trim().toUpperCase();
      if (!clean || isStaffMember(clean, role)) return null;
      if (!studentMap[clean]) {
        studentMap[clean] = {
          name: clean,
          class: cls,
          house: resolveHouse(clean, cls),
          modes: {},
          profileXP: 0
        };
      }
      return studentMap[clean];
    };

    if (leaderboardData && typeof leaderboardData === "object") {
      ["rush", "alchemy", "blitz", "reading"].forEach(m => {
        const rows = leaderboardData[m];
        if (!Array.isArray(rows)) return;
        rows.forEach(r => {
          const st = ensureStudent(r && r.n, r && r.role);
          if (!st) return;
          const xpVal = modeToXP(m, r.s);
          if (xpVal > (st.modes[m] || 0)) {
            st.modes[m] = xpVal;
          }
        });
      });
    }

    // Also incorporate full cloud UserProfiles XP if returned by Apps Script
    if (Array.isArray(profilesData)) {
      profilesData.forEach(p => {
        const st = ensureStudent(p && p.n, p && p.role);
        if (!st) return;
        const pxp = Number(p.xp) || 0;
        if (pxp > st.profileXP) st.profileXP = pxp;
      });
    }

    // Also incorporate currently logged-in student's live Store.d.xp
    const curName = (Store && Store.d && Store.d.name) || "";
    const curAuth = (Store && Store.d && Store.d.auth) || {};
    if (curName && Store && Store.d && Store.d.xp > 0) {
      const st = ensureStudent(curName, curAuth.role);
      if (st && Store.d.xp > st.profileXP) {
        st.profileXP = Store.d.xp;
        if (Store.d.house) st.house = Store.d.house.toUpperCase();
      }
    }

    let updated = false;

    Object.values(studentMap).forEach(st => {
      const modeSumXP = Object.values(st.modes).reduce((a, b) => a + b, 0);
      const calcXP = Math.max(modeSumXP, st.profileXP);
      if (calcXP <= 0) return;

      const form = "S" + st.class.charAt(0);
      if (CLASS_HONOR_ROLL[form] && CLASS_HONOR_ROLL[form][st.class]) {
        const list = CLASS_HONOR_ROLL[form][st.class];
        const exist = list.find(e => e.name.toUpperCase() === st.name);
        if (exist) {
          if (calcXP > exist.xp) {
            exist.xp = calcXP;
            updated = true;
          }
        } else {
          list.push({
            rank: list.length + 1,
            name: st.name,
            house: st.house,
            xp: calcXP
          });
          updated = true;
        }
        list.sort((a, b) => b.xp - a.xp);
        list.forEach((item, idx) => { item.rank = idx + 1; });
      }
    });

    if (updated) {
      this.renderClassHonorRoll();
      this.renderHouseCup();
    }
  },

  renderHouseCup() {
    const d = Store.d || {};
    const auth = d.auth || {};
    const isStaff = isStaffMember(d.name, auth.role);
    const myHouse = isStaff ? null : (d.house || auth.house || "").toUpperCase();

    // Sum points for each house directly from verified Class Honor Roll scholars
    const basePoints = { TAK: 0, CHI: 0, KIN: 0, KAN: 0 };

    if (typeof CLASS_HONOR_ROLL !== "undefined") {
      Object.keys(CLASS_HONOR_ROLL).forEach(form => {
        Object.keys(CLASS_HONOR_ROLL[form]).forEach(cls => {
          (CLASS_HONOR_ROLL[form][cls] || []).forEach(st => {
            if (!isStaffMember(st.name)) {
              const h = (st.house || "TAK").toUpperCase();
              if (basePoints[h] !== undefined) {
                basePoints[h] += (Number(st.xp) || 0);
              }
            }
          });
        });
      });
    }

    // Fallback baseline safety check for verified launch points
    if (basePoints.TAK === 0 && basePoints.CHI === 0) {
      basePoints.TAK = 1860;
      basePoints.CHI = 3868;
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
      // Exclude teachers/staff from student top score list
      const studentRows = (rows || []).filter(entry => !isStaffMember(entry.n, entry.role));
      const sorted = [...studentRows].sort((a, b) => b.s - a.s);
      const userName = (Store.d.name || "").toLowerCase().trim();

      if (sorted.length === 0) {
        listEl.innerHTML = `
          <div style="text-align:center;padding:28px 12px;color:var(--muted);font-style:italic">
            <span style="font-size:1.6rem;display:block;margin-bottom:6px">⚔️</span>
            No records yet for this mode. Play a match to claim #1 on the leaderboard!
          </div>
        `;
        return;
      }

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

    // Verified launch student top scores across school arena
    const defaults = {
      rush: [
        { n: "LEE SHING YU (4D)", s: 5000, role: "student" },
        { n: "TSAI TSZ CHING (4D)", s: 239, role: "student" },
        { n: "LI TSZ YU (4D)", s: 52, role: "student" }
      ],
      alchemy: [
        { n: "LI TSZ YU (4D)", s: 8300, role: "student" },
        { n: "TSAI TSZ CHING (4D)", s: 7200, role: "student" }
      ],
      blitz: [
        { n: "LI TSZ YU (4D)", s: 1550, role: "student" }
      ],
      reading: [
        { n: "LI TSZ YU (4D)", s: 500, role: "student" }
      ]
    };

    if (rows.length === 0) {
      rows = defaults[mode] || [];
    }

    renderList(rows);

    // Fetch live scores from Google Sheets if configured
    if (typeof Leaderboard !== "undefined" && Leaderboard.getTopScores) {
      Leaderboard.getTopScores(mode).then((cloudRows) => {
        const toShow = (cloudRows && cloudRows.length > 0) ? cloudRows : (defaults[mode] || []);
        if (this.currentSbTab === mode && toShow.length > 0) {
          renderList(toShow);
        }
        if (Leaderboard.cache) {
          this.syncClassHonorRollFromLeaderboard(Leaderboard.cache);
        }
      });
    }
  },

  startAutoSyncLoop() {
    // Bind refresh button click in Hall of Fame header
    const refreshBtn = $("#btn-refresh-scores");
    if (refreshBtn) {
      refreshBtn.onclick = () => {
        Sfx.click();
        this.refreshLiveScores(true);
      };
    }

    // Auto-refresh every 30 seconds
    if (this._syncInterval) clearInterval(this._syncInterval);
    this._syncInterval = setInterval(() => {
      // Only refresh if page is visible to conserve mobile battery / quota
      if (document.visibilityState === "visible") {
        this.refreshLiveScores(false);
      }
    }, 30000);

    // Refresh immediately on tab focus / visibility return
    if (!this._visibilityListenerBound) {
      this._visibilityListenerBound = true;
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          this.refreshLiveScores(false);
        }
      });
    }
  },

  async refreshLiveScores(manual = false) {
    const refreshBtn = $("#btn-refresh-scores");
    if (refreshBtn) refreshBtn.classList.add("spinning");

    try {
      if (typeof Leaderboard !== "undefined") {
        const mode = this.currentSbTab || "rush";
        const cloudRows = await Leaderboard.getTopScores(mode, manual);
        if (cloudRows && cloudRows.length > 0) {
          this.renderScoreboard(mode);
        }
        if (Leaderboard.cache) {
          this.syncClassHonorRollFromLeaderboard(Leaderboard.cache);
        }

        // Pull latest cross-device profile XP & Word Vault
        if (Leaderboard.syncProfilePull) {
          await Leaderboard.syncProfilePull();
        }

        // Re-render UI components with latest synchronized state
        this.renderHouseCup();
        this.renderTop();
        if (this.renderWizardProfile) this.renderWizardProfile();
      }

      if (manual) {
        toast("⚡ Scores & House Cup synchronized live!", true);
      }
    } catch (e) {
      console.warn("[App] Live sync refresh notice:", e);
    } finally {
      if (refreshBtn) {
        setTimeout(() => refreshBtn.classList.remove("spinning"), 600);
      }
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

    // Assessment handler - debounced, single XP per word per session, auto-advance
    let isAssessing = false;
    const assessCard = (status) => {
      if (isAssessing) return;
      isAssessing = true;

      // Lock buttons immediately to prevent rapid multi-clicks
      const btnC = $("#btn-mark-challenging");
      const btnF = $("#btn-mark-familiar");
      const btnM = $("#btn-mark-mastered");
      [btnC, btnF, btnM].forEach(b => {
        if (b) {
          b.disabled = true;
          b.style.pointerEvents = "none";
        }
      });

      Store.setWordStatus(c, status);
      const xpAmt = status === "mastered" ? 3 : 1;
      const xpRes = Store.awardWordXP(c, xpAmt);

      if (xpRes.awarded) {
        if (status === "mastered") {
          if (Sfx.spellCast) Sfx.spellCast();
          Fx.confetti(75);
          toast("⚡ Marked as Mastered! (+3 XP)", true);
        } else if (status === "challenging") {
          if (Sfx.spellChallenging) Sfx.spellChallenging();
          toast("🔴 Marked as Difficult — Queued for practice (+1 XP)");
        } else {
          if (Sfx.click) Sfx.click();
          toast("🟡 Marked as Okay (+1 XP)");
        }
      } else {
        if (Sfx.click) Sfx.click();
        toast(status === "mastered" ? "⚡ Marked as Mastered" : status === "challenging" ? "🔴 Marked as Difficult" : "🟡 Marked as Okay");
      }
      this.renderTop();

      // Immediately advance to next word
      setTimeout(() => {
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
              <p style="font-family:var(--font-n);font-size:1.8rem;font-weight:800;color:#fbbf24;margin:14px 0">+20 Bonus XP</p>
              <div style="display:flex;gap:10px;justify-content:center;margin-top:18px">
                <button class="btn primary" id="btn-tome-restart">↻ Study Deck Again</button>
                <button class="btn" id="btn-tome-finish">← Return to Tomes</button>
              </div>
            </div>
          `);
          Store.addXP(20);
          $("#btn-tome-restart").onclick = () => { closeModal(); this.vaultStudy(tomeId, filter, 0, deck); };
          $("#btn-tome-finish").onclick = () => { closeModal(); this.vaultLobby(); };
        }
      }, 180);
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
