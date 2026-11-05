/* ===================================================================
   MODE 1 — CRYPTIC RUSH (Scrambled Tile Bank / Anagram Mode)
   - Fast-paced contextual deduction & tile spelling mastery.
   - Supports 2 distinct play styles:
       1) 🎯 Practice Mode: Untimed, choose specific Set+Content or Mixed.
       2) ⚡ Game Mode: 60s ticking clock, bonus time refills, combo multipliers,
          plus +25% Score Bonus when choosing "All Sets Mixed".
   - Desktop: Click tiles or type on physical keyboard.
   - Mobile: Zero-lag tactile tap on large scrambled tiles.
   =================================================================== */

const Rush = {
  START: 60,
  BASE_ADD: 4,
  selectedMode: "practice", // "practice" or "game"
  selectedSet: "all",       // "all" or specific set key (e.g. "Set 1 · Writing 1")

  getAvailableSets() {
    const map = new Map();
    (window.VOCAB || []).forEach(c => {
      const key = c.topic || (c.set ? `Set ${c.set}${c.content ? ` · ${c.content}` : ''}` : 'General');
      if (!map.has(key)) {
        map.set(key, {
          key: key,
          level: c.level || 'S4',
          set: c.set || '1',
          content: c.content || '',
          count: 0
        });
      }
      map.get(key).count++;
    });
    return Array.from(map.values());
  },

  getStartBtnText() {
    const isGame = this.selectedMode === "game";
    const setName = this.selectedSet === "all" ? "All Sets Mixed" : this.selectedSet;
    if (isGame) {
      const bonus = this.selectedSet === "all" ? " (+25% Bonus)" : "";
      return `⚡ Start 60s Game · ${setName}${bonus}`;
    } else {
      return `🎯 Start Practice · ${setName}`;
    }
  },

  renderRulesHtml() {
    if (this.selectedMode === "game") {
      return `
        <ul>
          <li>⏳ <b>60s on the clock:</b> The ticking clock starts at ${this.START}s and counts down</li>
          <li>📝 <b>Contextual deduction:</b> Deduce the missing expression from the sentence &amp; meaning</li>
          <li>🧩 <b>Unscramble tiles:</b> Word-by-word with the 1st letter hint pre-pressed</li>
          <li>✅ <b>Time Refills:</b> Each solve adds <b style="color:var(--emerald)">+${this.BASE_ADD}s to +8s</b> back to your clock</li>
          <li>🔥 <b>All Sets Mixed Bonus:</b> Play all sets mixed together for an automatic <b style="color:var(--amber)">+25% score bonus (1.25x)</b>!</li>
          <li>⚡ <b>Combo multipliers:</b> Consecutive solves amplify your score up to 5x</li>
        </ul>
      `;
    } else {
      return `
        <ul>
          <li>🎯 <b>100% Untimed:</b> No clock countdown and no time penalty — learn at your own pace</li>
          <li>📚 <b>Targeted set study:</b> Master vocabulary from specific Writing tasks or mix all sets</li>
          <li>💡 <b>Free hints:</b> Autoplace tiles whenever you need guidance without losing score</li>
          <li>⭐ <b>Earn XP &amp; Mastery:</b> Every solved expression updates your spaced repetition mastery</li>
          <li>🏁 <b>Full completion:</b> Step through every expression in the set with a complete review</li>
        </ul>
      `;
    }
  },

  updateIntroSelection() {
    // Update active class on mode cards
    $$(".rush-mode-card").forEach(c => {
      const isAct = c.dataset.mode === this.selectedMode;
      c.classList.toggle("active", isAct);
    });

    // Update active class on set cards
    $$(".rush-set-card").forEach(c => {
      const isAct = c.dataset.set === this.selectedSet;
      c.classList.toggle("active", isAct);
    });

    // Update perk badge on "All Sets Mixed" card
    const mixedPerk = $("#rush-mixed-perk");
    if (mixedPerk) {
      mixedPerk.innerHTML = this.selectedMode === "game"
        ? '<span class="bonus-badge">🔥 +25% Score Bonus (1.25x)</span>'
        : '<span class="neutral-badge">📚 Comprehensive Practice</span>';
    }

    // Update rules box
    const rulesBox = $("#rush-rules-box");
    if (rulesBox) {
      rulesBox.innerHTML = this.renderRulesHtml();
    }

    // Update launch button text
    const startBtn = $("#rush-start");
    if (startBtn) {
      startBtn.innerHTML = this.getStartBtnText();
    }
  },

  intro() {
    const availableSets = this.getAvailableSets();
    const totalVocab = (window.VOCAB || []).length;

    // Reset selectedSet if it's no longer valid
    if (this.selectedSet !== "all" && !availableSets.some(s => s.key === this.selectedSet)) {
      this.selectedSet = "all";
    }

    const el = $("#screen-rush");
    el.innerHTML = `
      <button class="back-btn" id="rush-back">← Home</button>
      <div class="card intro rush-intro-card">
        <div class="mode-icon" style="background:var(--g-rush)">⚡</div>
        <h1>Cryptic Rush</h1>
        <p class="muted" style="margin-bottom:22px">Contextual deduction meets lightning tile unscrambling.</p>

        <!-- 1. MODE SELECTION -->
        <div class="rush-section-block">
          <div class="rush-section-title">1. Choose Play Mode</div>
          <div class="rush-mode-grid">
            <div class="rush-mode-card ${this.selectedMode === 'practice' ? 'active' : ''}" data-mode="practice">
              <div class="rush-mode-header">
                <span class="rush-mode-badge practice">🎯 UNTIMED</span>
                <span class="rush-check-icon">✓</span>
              </div>
              <div class="rush-mode-name">🎯 Practice Mode</div>
              <div class="rush-mode-desc">Untimed, stress-free learning. Deduce expressions, master tile spelling, and track completion without a clock.</div>
            </div>

            <div class="rush-mode-card ${this.selectedMode === 'game' ? 'active' : ''}" data-mode="game">
              <div class="rush-mode-header">
                <span class="rush-mode-badge game">⚡ 60s COUNTDOWN</span>
                <span class="rush-check-icon">✓</span>
              </div>
              <div class="rush-mode-name">⚡ Game Mode</div>
              <div class="rush-mode-desc">60s ticking countdown! Fast solves add +4s to +8s &amp; build multipliers. Compete on the leaderboard!</div>
            </div>
          </div>
        </div>

        <!-- 2. VOCABULARY SET SELECTION -->
        <div class="rush-section-block">
          <div class="rush-section-title">2. Choose Vocabulary Set</div>
          <div class="rush-sets-grid" id="rush-sets-grid">
            <!-- All sets mixed -->
            <div class="rush-set-card ${this.selectedSet === 'all' ? 'active' : ''}" data-set="all">
              <div class="rush-set-header">
                <span class="rush-set-pill all">🌟 ALL SETS MIXED</span>
                <span class="rush-check-icon">✓</span>
              </div>
              <div class="rush-set-title">All Sets Mixed Together</div>
              <div class="rush-set-meta">${totalVocab} expressions across all writing units</div>
              <div class="rush-set-perk" id="rush-mixed-perk">
                ${this.selectedMode === 'game' 
                  ? '<span class="bonus-badge">🔥 +25% Score Bonus (1.25x)</span>' 
                  : '<span class="neutral-badge">📚 Comprehensive Practice</span>'}
              </div>
            </div>

            <!-- Specific sets -->
            ${availableSets.map(s => `
              <div class="rush-set-card ${this.selectedSet === s.key ? 'active' : ''}" data-set="${esc(s.key)}">
                <div class="rush-set-header">
                  <span class="rush-set-pill lvl">${esc(s.level)}</span>
                  <span class="rush-check-icon">✓</span>
                </div>
                <div class="rush-set-title">📚 ${esc(s.key)}</div>
                <div class="rush-set-meta">${s.count} targeted expressions</div>
                <div class="rush-set-perk">
                  ${this.selectedMode === 'game' 
                    ? '<span class="standard-badge">Standard 1.0x</span>' 
                    : '<span class="neutral-badge">Focused Set</span>'}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- How To Play Rules Summary -->
        <div class="rush-rules-box" id="rush-rules-box">
          ${this.renderRulesHtml()}
        </div>

        <div class="row" style="margin-top:20px">
          <button class="btn rush" id="rush-start" style="font-size:1.15rem;padding:14px 36px">
            ${this.getStartBtnText()}
          </button>
        </div>
        <p class="muted" style="margin-top:14px">
          Personal Best (Game Mode): <b>${fmt(Store.d.best.rush || 0)} pts</b>
        </p>
      </div>
    `;

    $("#rush-back").onclick = () => showScreen("home");

    // Hook mode clicks
    $$(".rush-mode-card").forEach(card => {
      card.onclick = () => {
        this.selectedMode = card.dataset.mode;
        Sfx.click();
        this.updateIntroSelection();
      };
    });

    // Hook set clicks
    $$(".rush-set-card").forEach(card => {
      card.onclick = () => {
        this.selectedSet = card.dataset.set;
        Sfx.click();
        this.updateIntroSelection();
      };
    });

    $("#rush-start").onclick = () => this.start();
    showScreen("rush");
  },

  start() {
    showScreen("rush");

    // Resolve card pool
    let pool = window.VOCAB || [];
    if (this.selectedSet !== "all") {
      pool = (window.VOCAB || []).filter(c =>
        c.topic === this.selectedSet ||
        `Set ${c.set}${c.content ? ` · ${c.content}` : ''}` === this.selectedSet ||
        c.set === this.selectedSet
      );
      if (!pool.length) pool = window.VOCAB || [];
    }

    this.pool = pool;
    this.isMixed = (this.selectedSet === "all");
    this.isPractice = (this.selectedMode === "practice");
    this.practiceQueue = this.isPractice ? shuffle([...this.pool]) : [];
    this.practiceCompleted = new Set();
    this.START = 60; // 60s starting time for game mode

    Object.assign(this, {
      time: this.isPractice ? 0 : this.START,
      score: 0,
      combo: 0,
      maxCombo: 0,
      correct: 0,
      level: 1,
      elapsed: 0,
      missed: new Map(),
      recent: [],
      locked: false,
      lastSec: null,
      over: false,
      activeIdx: 0,
      slots: [],
      tiles: [],
      isPhrase: false
    });

    const el = $("#screen-rush");
    const setTitle = this.isMixed ? "🌟 All Sets Mixed" : this.selectedSet;

    el.innerHTML = `
      <div class="game-head">
        <button class="back-btn" id="rush-quit" style="margin:0">✕ ${this.isPractice ? "Finish" : "Quit"}</button>
        <div class="hud">
          <div class="pill">${esc(setTitle)}</div>
          ${this.isPractice ? `
            <div class="pill practice-pill">🎯 Untimed</div>
            <div class="pill">⭐ <b id="r-score">0</b> XP</div>
          ` : `
            <div class="pill">Lv <b id="r-level">1</b></div>
            <div class="pill" id="r-mult-pill">${this.isMixed ? "🔥 1.25x Bonus" : "x<b id='r-mult'>1</b>"}</div>
            <div class="pill">⭐ <b id="r-score">0</b></div>
          `}
        </div>
      </div>

      ${this.isPractice ? `
        <div class="timer-wrap practice-timer-wrap" id="r-timer">
          <div class="practice-hud-row">
            <span class="practice-hud-badge">🎯 UNTIMED PRACTICE</span>
            <span class="practice-hud-counter">Card <b id="r-curr-num">1</b> of <b>${this.pool.length}</b></span>
          </div>
          <div class="timer-bar"><i id="r-bar" style="width:0%;background:linear-gradient(90deg,#06b6d4,#10b981)"></i></div>
        </div>
      ` : `
        <div class="timer-wrap" id="r-timer">
          <div class="timer-num" id="r-time">${this.START}</div>
          <div class="timer-bar"><i id="r-bar" style="width:100%"></i></div>
        </div>
      `}

      <div class="combo" id="r-combo"></div>
      
      <div class="card cr-card" id="r-card">
        <div class="cr-meta">
          <span class="chip" id="r-pos"></span>
          <span class="muted" id="r-topic"></span>
        </div>
        <div class="cr-sentence" id="r-sentence"></div>
        <div class="cr-clues" id="r-clues"></div>
      </div>

      <div class="cr-typing-area">
        <div class="cr-slots-container" id="r-slots"></div>
        <div class="cr-actions">
          <button class="btn small" id="r-hint-btn">💡 Hint ${this.isPractice ? "" : "<small>(−2s)</small>"}</button>
          <button class="btn small" id="r-undo-btn">⌫ Undo</button>
          <button class="btn small" id="r-skip-btn">⏩ Skip ${this.isPractice ? "" : "<small>(−5s)</small>"}</button>
        </div>
      </div>

      <!-- Scrambled Tiles Bank -->
      <div class="cr-tile-bank-wrap">
        <div class="cr-tiles-bank" id="r-tiles"></div>
      </div>
    `;

    $("#rush-quit").onclick = () => { 
      this.stop(); 
      if (this.isPractice && this.correct > 0) {
        this.endPractice();
      } else {
        this.intro(); 
      }
    };
    $("#r-hint-btn").onclick = () => this.useHintLetter();
    $("#r-undo-btn").onclick = () => this.handleBackspace();
    $("#r-skip-btn").onclick = () => this.skipCard();

    // Physical desktop keyboard support
    this.keyHandler = (e) => {
      if (this.over || this.locked) return;
      if (e.key === "Backspace") {
        e.preventDefault();
        this.handleBackspace();
      } else if (e.key.length === 1 && /[a-zA-Z0-9'-]/.test(e.key)) {
        e.preventDefault();
        this.handleKey(e.key);
      }
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

  drain() {
    return Math.min(1.85, 1.0 + (this.level - 1) * 0.15);
  },

  loop(t) {
    if (this.over) return;
    const dt = (t - this.last) / 1000;
    this.last = t;
    this.elapsed += dt;

    if (this.isPractice) {
      // Untimed mode: clock does not drain
      this.raf = requestAnimationFrame((tt) => this.loop(tt));
      return;
    }

    // Game Mode: 60s timer drains
    this.time -= dt * this.drain();

    if (this.time <= 0) {
      this.time = 0;
      this.renderTimer();
      return this.end();
    }

    const sec = Math.ceil(this.time);
    if (this.time < 10 && sec !== this.lastSec) Sfx.tick();
    this.lastSec = sec;
    this.renderTimer();
    this.raf = requestAnimationFrame((tt) => this.loop(tt));
  },

  renderTimer() {
    if (this.isPractice) {
      const pct = Math.min(100, (this.correct / Math.max(1, this.pool.length)) * 100);
      const bar = $("#r-bar");
      if (bar) bar.style.width = pct + "%";
      const curr = $("#r-curr-num");
      if (curr) curr.textContent = Math.min(this.correct + 1, this.pool.length);
      return;
    }

    const timeNum = $("#r-time");
    if (timeNum) {
      timeNum.textContent = this.time < 10 ? this.time.toFixed(1) : Math.ceil(this.time);
    }
    const bar = $("#r-bar");
    if (bar) {
      bar.style.width = Math.min(100, (this.time / 60) * 100) + "%";
    }
    const timerWrap = $("#r-timer");
    if (timerWrap) {
      timerWrap.classList.toggle("danger", this.time < 10);
    }
  },

  mult() {
    return Math.min(5, 1 + Math.floor(this.combo / 3));
  },

  floatTime(txt, cls) {
    const f = document.createElement("div");
    f.className = `float-time ${cls}`;
    f.textContent = txt;
    const tWrap = $("#r-timer");
    if (tWrap) {
      tWrap.appendChild(f);
      setTimeout(() => f.remove(), 1000);
    }
  },

  nextCard() {
    let target;
    if (this.isPractice) {
      if (this.practiceQueue.length === 0) {
        return this.endPractice();
      }
      target = this.practiceQueue.shift();
      this.practiceCompleted.add(target.id);
      const curr = $("#r-curr-num");
      if (curr) curr.textContent = this.practiceCompleted.size;
    } else {
      const exclude = new Set(this.recent);
      target = Store.pickWords(1, exclude, this.pool)[0];
      if (!target) target = shuffle([...this.pool])[0];
      this.recent.push(target.key || target.id);
      if (this.recent.length > 10) this.recent.shift();
    }

    this.card = target;
    this.qStart = performance.now();
    this.locked = false;

    $("#r-pos").textContent = target.pos;
    $("#r-topic").textContent = target.topic ? `• ${target.topic}` : "";
    
    // Format context sentence with animated blank
    const sent = esc(target.context).replace(/___/g, `<span class="cr-blank">[ ________ ]</span>`);
    $("#r-sentence").innerHTML = sent;
    $("#r-clues").innerHTML = `<b>Meaning:</b> ${esc(target.meaning)}<br><b>Synonyms:</b> ${esc((target.synonyms || []).join(", "))}`;

    this.setupSlots(target.word);
  },

  setupSlots(rawWord) {
    this.slots = [];
    this.tiles = [];
    this.activeIdx = 0;

    const trimmed = rawWord.trim();
    const words = trimmed.split(/\s+/);
    this.isPhrase = words.length > 1;

    let globalSlotId = 0;
    let globalTileId = 0;

    words.forEach((w, wIdx) => {
      const chars = [...w.toUpperCase()];
      const wordLetterTiles = [];
      let firstLetterSlot = null;

      chars.forEach((ch) => {
        const isLetter = /[A-Z0-9]/.test(ch);
        const slot = {
          id: globalSlotId++,
          wIdx: wIdx,
          ch: ch,
          norm: ch,
          isLetter: isLetter,
          typedCh: isLetter ? null : ch,
          tileId: null,
          correct: !isLetter,
          isHint: false,
          hasError: false
        };
        this.slots.push(slot);

        if (isLetter) {
          const tile = {
            id: globalTileId++,
            wIdx: wIdx,
            val: ch,
            norm: ch,
            used: false,
            isHint: false
          };
          wordLetterTiles.push(tile);
          if (!firstLetterSlot) {
            firstLetterSlot = slot;
          }
        }
      });

      // Scramble letter tiles for this word
      const scrambled = this.scrambleWordTiles(wordLetterTiles);

      // Pre-fill the first letter of this word as a hint
      if (firstLetterSlot && wordLetterTiles.length > 0) {
        const hintTile = scrambled.find(t => t.val === firstLetterSlot.norm && !t.used);
        if (hintTile) {
          hintTile.used = true;
          hintTile.isHint = true;
          firstLetterSlot.typedCh = hintTile.val;
          firstLetterSlot.tileId = hintTile.id;
          firstLetterSlot.correct = true;
          firstLetterSlot.isHint = true;
        }
      }

      this.tiles.push(...scrambled);
    });

    // Advance cursor to first unsolved slot
    this.advanceCursorToStart();

    // Render slots & tiles
    this.renderSlots();
    this.renderTiles();
  },

  advanceCursorToStart() {
    const firstUnsolved = this.slots.findIndex(s => s.isLetter && !s.correct);
    this.activeIdx = firstUnsolved !== -1 ? firstUnsolved : 0;
  },

  scrambleWordTiles(wordTiles) {
    if (wordTiles.length <= 1) return [...wordTiles];
    if (wordTiles.length === 2) {
      return [wordTiles[1], wordTiles[0]];
    }
    const originalStr = wordTiles.map(t => t.val).join("");
    const firstVal = wordTiles[0].val;
    let arr = [...wordTiles];
    let attempts = 0;
    do {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      attempts++;
    } while (attempts < 30 && (arr.map(t => t.val).join("") === originalStr || arr[0].val === firstVal));

    if (arr.map(t => t.val).join("") === originalStr || arr[0].val === firstVal) {
      arr.push(arr.shift());
    }
    return arr;
  },

  renderSlots() {
    const container = $("#r-slots");
    if (!container) return;

    // Group slots by wIdx
    const wordGroups = [];
    let curGroup = [];
    let lastWIdx = null;

    this.slots.forEach((s) => {
      if (lastWIdx !== null && s.wIdx !== lastWIdx) {
        if (curGroup.length) wordGroups.push(curGroup);
        curGroup = [];
      }
      lastWIdx = s.wIdx;
      curGroup.push(s);
    });
    if (curGroup.length) wordGroups.push(curGroup);

    const maxWordLen = Math.max(...wordGroups.map(g => g.length), 1);
    container.style.setProperty("--wlen", maxWordLen);

    let html = [];
    wordGroups.forEach((group, gIdx) => {
      if (gIdx > 0) {
        html.push(`<div class="cr-space-sep"></div>`);
      }
      const wordLen = group.length;
      let groupHtml = `<div class="cr-word-group" style="--wlen:${wordLen}">`;
      group.forEach((s) => {
        if (!s.isLetter) {
          groupHtml += `<div class="cr-slot punct" data-idx="${s.id}">${esc(s.ch)}</div>`;
          return;
        }
        const isActive = s.id === this.activeIdx;
        const isDone = s.correct && s.typedCh !== null;
        const isHint = s.isHint;
        const display = s.typedCh || "";

        let cls = "cr-slot";
        if (isActive) cls += " active";
        if (isDone) cls += " correct";
        if (isHint) cls += " hint-slot";
        if (s.hasError) cls += " error";
        if (display && !isHint) cls += " has-content";

        groupHtml += `
          <div class="${cls}" data-idx="${s.id}" title="${display && !isHint ? "Tap to remove" : ""}">
            <span class="cr-char">${esc(display)}</span>
            ${isHint ? '<span class="cr-hint-badge">HINT</span>' : ''}
          </div>
        `;
      });
      groupHtml += `</div>`;
      html.push(groupHtml);
    });

    container.innerHTML = html.join("");

    // Clicking any non-hint filled slot returns the tile back to the bank
    $$("#r-slots .cr-slot[data-idx]").forEach(slotEl => {
      slotEl.onclick = () => {
        const idx = +slotEl.dataset.idx;
        this.unpickSlot(idx);
      };
    });
  },

  renderTiles() {
    const container = $("#r-tiles");
    if (!container) return;

    const wordGroups = [];
    let curGroup = [];
    let lastWIdx = null;

    this.tiles.forEach(t => {
      if (lastWIdx !== null && t.wIdx !== lastWIdx) {
        if (curGroup.length) wordGroups.push(curGroup);
        curGroup = [];
      }
      lastWIdx = t.wIdx;
      curGroup.push(t);
    });
    if (curGroup.length) wordGroups.push(curGroup);

    let html = [];
    wordGroups.forEach((group, gIdx) => {
      if (gIdx > 0) {
        html.push(`<div class="cr-tile-group-sep"></div>`);
      }
      let groupHtml = `<div class="cr-tile-group" style="--tlen:${group.length}">`;
      group.forEach(t => {
        let cls = "cr-tile";
        if (t.used) cls += " used";
        if (t.isHint) cls += " hint-tile";
        groupHtml += `<button class="${cls}" data-tid="${t.id}" ${t.used ? "disabled" : ""}>${esc(t.val)}</button>`;
      });
      groupHtml += `</div>`;
      html.push(groupHtml);
    });

    container.innerHTML = html.join("");

    // Zero-lag touch & click listeners
    $$("#r-tiles .cr-tile:not(.used)").forEach(btn => {
      let lastTap = 0;
      const onAction = (e) => {
        const now = Date.now();
        if (now - lastTap < 80) return;
        lastTap = now;
        if (e.cancelable) e.preventDefault();
        const tid = +btn.dataset.tid;
        this.pickTile(tid);
      };

      btn.addEventListener("pointerdown", onAction, { passive: false });
      btn.addEventListener("click", onAction);
    });
  },

  pickTile(tileId) {
    if (this.locked || this.over) return;
    const tile = this.tiles.find(t => t.id === tileId);
    if (!tile || tile.used) return;

    if (this.activeIdx < 0 || this.activeIdx >= this.slots.length) return;
    const slot = this.slots[this.activeIdx];
    if (!slot || !slot.isLetter || slot.correct) return;

    // Matching condition: same letter character
    if (tile.norm === slot.norm) {
      tile.used = true;
      slot.typedCh = tile.val;
      slot.tileId = tile.id;
      slot.correct = true;
      slot.hasError = false;
      Sfx.click();

      this.advanceCursor();
      this.renderSlots();
      this.renderTiles();
      this.checkCompletion();
    } else {
      // Wrong tile placed
      slot.hasError = true;
      Sfx.wrong();
      this.renderSlots();
      setTimeout(() => {
        if (!this.locked && !this.over && slot.hasError) {
          slot.hasError = false;
          this.renderSlots();
        }
      }, 400);
    }
  },

  unpickSlot(idx) {
    if (this.locked || this.over) return;
    const slot = this.slots[idx];
    if (!slot || slot.typedCh === null || slot.isHint) return;

    if (slot.tileId !== null) {
      const tile = this.tiles.find(t => t.id === slot.tileId);
      if (tile) tile.used = false;
    }
    slot.typedCh = null;
    slot.tileId = null;
    slot.correct = false;
    slot.hasError = false;
    this.activeIdx = idx;
    Sfx.click();

    this.renderSlots();
    this.renderTiles();
  },

  handleBackspace() {
    if (this.locked || this.over) return;

    let targetIdx = this.activeIdx - 1;
    while (targetIdx >= 0) {
      const s = this.slots[targetIdx];
      if (s.isLetter && !s.isHint && s.typedCh !== null) {
        break;
      }
      targetIdx--;
    }

    if (targetIdx < 0) {
      if (this.slots[this.activeIdx] && this.slots[this.activeIdx].hasError) {
        this.slots[this.activeIdx].hasError = false;
        this.renderSlots();
      }
      return;
    }

    this.unpickSlot(targetIdx);
  },

  handleKey(rawKey) {
    if (this.locked || this.over) return;
    const key = rawKey.toUpperCase();

    if (this.activeIdx < 0 || this.activeIdx >= this.slots.length) return;
    const slot = this.slots[this.activeIdx];
    if (!slot || !slot.isLetter || slot.correct) return;

    if (key === slot.norm) {
      const match = this.tiles.find(t => !t.used && t.wIdx === slot.wIdx && t.norm === key)
                 || this.tiles.find(t => !t.used && t.norm === key);
      if (match) {
        this.pickTile(match.id);
        return;
      }
    }

    // Wrong key typed
    slot.hasError = true;
    Sfx.wrong();
    this.renderSlots();
    setTimeout(() => {
      if (!this.locked && !this.over && slot.hasError) {
        slot.hasError = false;
        this.renderSlots();
      }
    }, 400);
  },

  advanceCursor() {
    let next = this.activeIdx + 1;
    while (next < this.slots.length && (!this.slots[next].isLetter || (this.slots[next].correct && this.slots[next].typedCh !== null))) {
      next++;
    }
    if (next >= this.slots.length) {
      const firstUnsolved = this.slots.findIndex(s => s.isLetter && !s.correct);
      next = firstUnsolved !== -1 ? firstUnsolved : this.slots.length;
    }
    this.activeIdx = next;
  },

  useHintLetter() {
    if (this.locked || this.over) return;

    const targetIdx = this.slots.findIndex(s => s.isLetter && !s.correct);
    if (targetIdx === -1) return;

    const slot = this.slots[targetIdx];
    const tile = this.tiles.find(t => !t.used && t.wIdx === slot.wIdx && t.norm === slot.norm)
              || this.tiles.find(t => !t.used && t.norm === slot.norm);

    if (tile) {
      tile.used = true;
      tile.isHint = true;
      slot.typedCh = tile.val;
      slot.tileId = tile.id;
      slot.correct = true;
      slot.isHint = true;
      slot.hasError = false;

      if (!this.isPractice) {
        this.time = Math.max(1, this.time - 2);
        this.floatTime("−2s", "minus");
      } else {
        this.floatTime("💡 Hint", "plus");
      }
      Sfx.click();

      this.advanceCursor();
      this.renderSlots();
      this.renderTiles();
      this.checkCompletion();
    }
  },

  skipCard() {
    if (this.locked || this.over) return;
    this.locked = true;

    if (!this.isPractice) {
      this.time = Math.max(1, this.time - 5);
      this.floatTime("−5s", "minus");
      this.combo = 0;
      $("#r-combo").innerHTML = "";
    }
    Sfx.wrong();
    
    // Reveal all slots
    this.slots.forEach(s => {
      s.typedCh = s.ch;
      s.correct = true;
    });
    this.tiles.forEach(t => t.used = true);
    this.renderSlots();
    this.renderTiles();
    this.missed.set(this.card.key || this.card.id, this.card);
    Store.review(this.card, 1);

    setTimeout(() => {
      if (!this.over) this.nextCard();
    }, 1200);
  },

  checkCompletion() {
    const allDone = this.slots.every(s => !s.isLetter || (s.correct && s.typedCh !== null));
    if (!allDone) return;

    this.locked = true;
    const rt = (performance.now() - this.qStart) / 1000;
    this.correct++;

    if (this.isPractice) {
      // Practice Mode completion
      const xpGained = 40;
      this.score += xpGained;
      Store.addXP(xpGained);
      Store.review(this.card, rt < 8 ? 5 : 4);
      
      Sfx.correct(1);
      Fx.confetti(28, innerWidth / 2, innerHeight / 2.5);
      this.floatTime(`+${xpGained} XP`, "plus");

      const scoreEl = $("#r-score");
      if (scoreEl) scoreEl.textContent = fmt(this.score);

      this.renderTimer();

      setTimeout(() => {
        if (!this.over) this.nextCard();
      }, 450);
      return;
    }

    // Game Mode completion
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);

    // Time refill: base 4s + combo bonus (up to 8s)
    const add = Math.min(8, this.BASE_ADD + Math.floor(this.combo / 3));
    const speedBonus = rt < 5.0 ? 80 : rt < 8.0 ? 30 : 0;
    
    // Score calculation with +25% bonus when All Sets Mixed
    const multVal = this.mult();
    const mixedMult = this.isMixed ? 1.25 : 1.0;
    const gained = Math.round((120 * multVal + speedBonus) * mixedMult);

    this.time += add;
    this.score += gained;
    this.floatTime(`+${add}s`, "plus");
    Sfx.correct(this.combo);
    Fx.confetti(40, innerWidth / 2, innerHeight / 2.5);

    Store.review(this.card, rt < 6 ? 5 : 4);

    if (this.combo >= 2) {
      const bonusText = this.isMixed ? " · 🔥 +25% Mixed" : "";
      $("#r-combo").innerHTML = `<span>🔥 ${this.combo} COMBO! (+${add}s${bonusText})</span>`;
    }
    if (this.combo === 5) Store.unlock("combo10");
    if (this.combo === 15) Store.unlock("combo25");
    if (this.correct % 4 === 0) this.levelUp();

    $("#r-score").textContent = fmt(this.score);
    if (!this.isMixed) {
      $("#r-mult").textContent = this.mult();
    } else {
      $("#r-mult-pill").textContent = `🔥 ${(this.mult() * 1.25).toFixed(2)}x`;
    }

    setTimeout(() => {
      if (!this.over) this.nextCard();
    }, 450);
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
    this.stop();
    if (this.score >= 2000) Store.unlock("rush2k");
    if (this.elapsed >= 90) Store.unlock("marathon");
    if (this.score >= 1000) Store.quest("rush");

    const setTitle = this.isMixed ? "🌟 All Sets Mixed (+25% Bonus)" : this.selectedSet;

    showResults({
      mode: "rush",
      emoji: this.score >= 2000 ? "⚡" : this.score >= 1000 ? "🔥" : "⏰",
      title: "Time's Up!",
      score: this.score,
      xp: Math.max(20, Math.round(this.score / 8)),
      stats: [
        ["Mode", "⚡ 60s Game Mode"],
        ["Set", setTitle],
        ["Solved", this.correct],
        ["Max Combo", `${this.maxCombo}x`],
        ["Survived", `${Math.round(this.elapsed)}s`],
        ["Level Reached", this.level]
      ],
      review: [...this.missed.values()],
      replay: () => this.start()
    });
  },

  endPractice() {
    this.stop();
    const accuracy = this.pool.length > 0 
      ? Math.round((this.correct / Math.max(1, this.correct + this.missed.size)) * 100) 
      : 100;
    const setTitle = this.isMixed ? "🌟 All Sets Mixed" : this.selectedSet;

    showResults({
      mode: "rush",
      emoji: "🎯",
      title: "Practice Completed!",
      score: this.score,
      xp: Math.max(25, this.correct * 40),
      isPractice: true,
      stats: [
        ["Mode", "🎯 Untimed Practice"],
        ["Set", setTitle],
        ["Mastered", `${this.correct} / ${this.pool.length}`],
        ["Accuracy", `${accuracy}%`],
        ["Time Spent", `${Math.round(this.elapsed)}s`]
      ],
      review: [...this.missed.values()],
      replay: () => this.start()
    });
  }
};
